import { GitError as DugiteError } from 'dugite'
import { readFile } from 'fs/promises'
import * as Path from 'path'
import { git } from './core'
import {
  WorkingDirectoryFileChange,
  AppFileStatusKind,
} from '../../models/status'
import {
  DiffType,
  ITextDiff,
  ILargeTextDiff,
  DiffSelection,
  DiffLineType,
} from '../../models/diff'
import { Repository, WorkingTree } from '../../models/repository'
import { getWorkingDirectoryDiff } from './diff'
import { formatPatch, formatPatchToDiscardChanges } from '../patch-formatter'
import { assertNever } from '../fatal-error'

export async function applyPatchToIndex(
  repository: Repository,
  file: WorkingDirectoryFileChange,
  displayedDiff?: ITextDiff | ILargeTextDiff,
  requireDisplayedDiff: boolean = false
): Promise<void> {
  if (displayedDiff !== undefined) {
    await assertDisplayedDiffMatchesWorkingDirectory(
      repository,
      file,
      displayedDiff
    )
  } else if (requireDisplayedDiff) {
    throw new Error(
      `Could not stage selected changes because the displayed diff is unavailable for ${file.path}`
    )
  }

  // If the file was a rename we have to recreate that rename since we've
  // just blown away the index. Think of this block of weird looking commands
  // as running `git mv`.
  if (file.status.kind === AppFileStatusKind.Renamed) {
    // Make sure the index knows of the removed file. We could use
    // update-index --force-remove here but we're not since it's
    // possible that someone staged a rename and then recreated the
    // original file and we don't have any guarantees for in which order
    // partial stages vs full-file stages happen. By using git add the
    // worst that could happen is that we re-stage a file already staged
    // by updateIndex.
    await git(
      ['add', '--update', '--', file.status.oldPath],
      repository.path,
      'applyPatchToIndex'
    )

    // Figure out the blob oid of the removed file
    // <mode> SP <type> SP <object> TAB <file>
    const oldFile = await git(
      ['ls-tree', 'HEAD', '--', file.status.oldPath],
      repository.path,
      'applyPatchToIndex'
    )

    const [info] = oldFile.stdout.split('\t', 1)
    const [mode, , oid] = info.split(' ', 3)

    // Add the old file blob to the index under the new name
    await git(
      ['update-index', '--add', '--cacheinfo', mode, oid, file.path],
      repository.path,
      'applyPatchToIndex'
    )
  }

  const applyArgs: string[] = [
    'apply',
    '--cached',
    '--unidiff-zero',
    '--whitespace=nowarn',
    '-',
  ]

  const diff =
    displayedDiff ?? (await getWorkingDirectoryDiff(repository, file))

  if (diff.kind !== DiffType.Text && diff.kind !== DiffType.LargeText) {
    const { kind } = diff
    switch (diff.kind) {
      case DiffType.Binary:
      case DiffType.Submodule:
      case DiffType.Image:
        throw new Error(
          `Can't create partial commit in binary file: ${file.path}`
        )
      case DiffType.Unrenderable:
        throw new Error(
          `File diff is too large to generate a partial commit: ${file.path}`
        )
      default:
        assertNever(diff, `Unknown diff kind: ${kind}`)
    }
  }

  const patch = await formatPatch(file, diff)
  await git(applyArgs, repository.path, 'applyPatchToIndex', { stdin: patch })

  return Promise.resolve()
}

interface IWorkingDirectoryTextSnapshot {
  readonly lines: ReadonlyArray<string>
  readonly hasTrailingNewline: boolean
}

async function assertDisplayedDiffMatchesWorkingDirectory(
  repository: Repository,
  file: WorkingDirectoryFileChange,
  diff: ITextDiff | ILargeTextDiff
) {
  const snapshot = await readWorkingDirectorySnapshot(repository, file)

  if (file.status.kind === AppFileStatusKind.Deleted) {
    if (snapshot !== null) {
      throw new Error(
        `Could not stage selected changes because ${file.path} no longer matches the displayed diff`
      )
    }

    return
  }

  if (snapshot === null) {
    throw new Error(
      `Could not stage selected changes because ${file.path} no longer matches the displayed diff`
    )
  }

  for (const hunk of diff.hunks) {
    const expectedNewLines = new Array<string>()
    let lastLineHasNoTrailingNewline = false

    for (const line of hunk.lines) {
      switch (line.type) {
        case DiffLineType.Hunk:
        case DiffLineType.Delete:
          break

        case DiffLineType.Context:
        case DiffLineType.Add:
          expectedNewLines.push(line.text.substring(1))
          lastLineHasNoTrailingNewline = line.noTrailingNewLine
          break

        default:
          assertNever(line.type, `Unsupported line type ${line.type}`)
      }
    }

    const startIndex = Math.max(hunk.header.newStartLine - 1, 0)
    const actualNewLines = snapshot.lines.slice(
      startIndex,
      startIndex + expectedNewLines.length
    )

    if (actualNewLines.length !== expectedNewLines.length) {
      throw new Error(
        `Could not stage selected changes because ${file.path} no longer matches the displayed diff`
      )
    }

    for (let i = 0; i < expectedNewLines.length; i++) {
      if (actualNewLines[i] !== expectedNewLines[i]) {
        throw new Error(
          `Could not stage selected changes because ${file.path} no longer matches the displayed diff`
        )
      }
    }

    if (lastLineHasNoTrailingNewline) {
      const hunkEndsAtEOF =
        startIndex + expectedNewLines.length === snapshot.lines.length
      if (!hunkEndsAtEOF || snapshot.hasTrailingNewline) {
        throw new Error(
          `Could not stage selected changes because ${file.path} no longer matches the displayed diff`
        )
      }
    }
  }
}

async function readWorkingDirectorySnapshot(
  repository: Repository,
  file: WorkingDirectoryFileChange
): Promise<IWorkingDirectoryTextSnapshot | null> {
  const path = Path.join(repository.path, file.path)

  try {
    const contents = await readFile(path, 'utf8')
    return {
      lines: splitLines(contents),
      hasTrailingNewline: /(?:\r\n|\n|\r)$/.test(contents),
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

function splitLines(text: string): ReadonlyArray<string> {
  if (text.length === 0) {
    return []
  }

  const lines = text.split(/\r\n|\n|\r/)
  const hasTrailingNewline = /(?:\r\n|\n|\r)$/.test(text)
  return hasTrailingNewline ? lines.slice(0, -1) : lines
}

/**
 * Test a patch to see if it will apply cleanly.
 *
 * @param workTree work tree (which should be checked out to a specific commit)
 * @param patch a Git patch (or patch series) to try applying
 * @returns whether the patch applies cleanly
 *
 * See `formatPatch` to generate a patch series from existing Git commits
 */
export async function checkPatch(
  workTree: WorkingTree,
  patch: string
): Promise<boolean> {
  const result = await git(
    ['apply', '--check', '-'],
    workTree.path,
    'checkPatch',
    {
      stdin: patch,
      stdinEncoding: 'utf8',
      expectedErrors: new Set<DugiteError>([DugiteError.PatchDoesNotApply]),
    }
  )

  if (result.gitError === DugiteError.PatchDoesNotApply) {
    // other errors will be thrown if encountered, so this is fine for now
    return false
  }

  return true
}

/**
 * Discards the local changes for the specified file based on the passed diff
 * and a selection of lines from it.
 *
 * When passed an empty selection, this method won't do anything. When passed a
 * full selection, all changes from the file will be discarded.
 *
 * @param repository The repository in which to update the working directory
 *                   with information from the index
 *
 * @param filePath   The relative path in the working directory of the file to use
 *
 * @param diff       The diff containing the file local changes
 *
 * @param selection  The selection of changes from the diff to discard
 */
export async function discardChangesFromSelection(
  repository: Repository,
  filePath: string,
  diff: ITextDiff,
  selection: DiffSelection
) {
  const patch = formatPatchToDiscardChanges(filePath, diff, selection)

  if (patch === null) {
    // When the patch is null we don't need to apply it since it will be a noop.
    return
  }

  const args = ['apply', '--unidiff-zero', '--whitespace=nowarn', '-']

  await git(args, repository.path, 'discardChangesFromSelection', {
    stdin: patch,
  })
}
