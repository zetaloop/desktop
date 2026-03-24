import { HiddenBidiCharsRegex } from '../diff-parser'
import {
  DiffHunk,
  DiffHunkHeader,
  DiffLine,
  DiffLineType,
  DiffType,
  ITextDiff,
} from '../../models/diff'
import { getLargestLineNumber } from '../../ui/diff/diff-helpers'
import { getHunkHeaderExpansionType } from '../../ui/diff/text-diff-expansion'

type DifftStatus = 'unchanged' | 'created' | 'deleted' | 'changed'

export type DifftLanguageKind =
  | 'structural'
  | 'plain-text'
  | 'plain-text-fallback'
  | 'binary'
  | 'unknown'

const DefaultContextLineCount = 3

interface IDifftChange {
  readonly content: string
  readonly start?: number
  readonly end?: number
}

interface IDifftSide {
  readonly lineNumber: number
  readonly changes: ReadonlyArray<IDifftChange>
}

interface IDifftChunkEntry {
  readonly lhs: IDifftSide | null
  readonly rhs: IDifftSide | null
}

interface IDifftFile {
  readonly language: string | null
  readonly status: DifftStatus | null
  readonly alignedLines: ReadonlyArray<readonly [number | null, number | null]>
  readonly chunks: ReadonlyArray<ReadonlyArray<IDifftChunkEntry>>
}

export interface IDifftTextDiffMetadata {
  readonly language: string | null
  readonly languageKind: DifftLanguageKind
  readonly status: DifftStatus | null
}

interface IDifftChunkIndex {
  readonly lhs: ReadonlyMap<number, IDifftSide>
  readonly rhs: ReadonlyMap<number, IDifftSide>
}

interface IChunkLineNumbers {
  readonly oldLines: ReadonlySet<number>
  readonly newLines: ReadonlySet<number>
}

interface IHunkSlice {
  readonly start: number
  readonly end: number
}

export type DifftTextDiffProjectionFailureReason =
  | 'invalid-payload'
  | 'unexpected-file-count'

export type DifftTextDiffProjectionResult =
  | {
      readonly kind: 'success'
      readonly diff: ITextDiff
      readonly metadata: IDifftTextDiffMetadata
    }
  | {
      readonly kind: 'failure'
      readonly reason: DifftTextDiffProjectionFailureReason
      readonly message: string
    }

export interface IDifftTextDiffProjectionInput {
  readonly payload: unknown

  readonly oldText?: string

  readonly newText?: string
}

export function projectDifftTextDiff(
  input: IDifftTextDiffProjectionInput
): DifftTextDiffProjectionResult {
  const files = parseDifftFiles(input.payload)
  if (files.kind === 'failure') {
    return files
  }

  if (files.files.length > 1) {
    return {
      kind: 'failure',
      reason: 'unexpected-file-count',
      message: `Expected a single difft file payload but received ${files.files.length}`,
    }
  }

  if (files.files.length === 0) {
    return {
      kind: 'success',
      diff: {
        kind: DiffType.Text,
        text: '',
        hunks: [],
        maxLineNumber: 0,
        hasHiddenBidiChars: false,
      },
      metadata: {
        language: null,
        languageKind: 'unknown',
        status: null,
      },
    }
  }

  const file = files.files[0]
  const oldLines = splitLines(input.oldText)
  const newLines = splitLines(input.newText)
  const hunks = buildHunks(file, oldLines, newLines)
  const text = hunks
    .flatMap(hunk => hunk.lines.map(line => line.text))
    .join('\n')

  return {
    kind: 'success',
    diff: {
      kind: DiffType.Text,
      text,
      hunks,
      maxLineNumber: getLargestLineNumber([...hunks]),
      hasHiddenBidiChars: HiddenBidiCharsRegex.test(text),
    },
    metadata: {
      language: file.language,
      languageKind: classifyLanguage(file.language),
      status: file.status,
    },
  }
}

function parseDifftFiles(payload: unknown):
  | { readonly kind: 'success'; readonly files: ReadonlyArray<IDifftFile> }
  | {
      readonly kind: 'failure'
      readonly reason: DifftTextDiffProjectionFailureReason
      readonly message: string
    } {
  if (Array.isArray(payload)) {
    const files = payload.flatMap(value => {
      const file = parseDifftFile(value)
      return file === null ? [] : [file]
    })

    return { kind: 'success', files }
  }

  const file = parseDifftFile(payload)
  if (file !== null) {
    return { kind: 'success', files: [file] }
  }

  return {
    kind: 'failure',
    reason: 'invalid-payload',
    message: 'Expected difft payload to be an object or array of objects',
  }
}

function parseDifftFile(value: unknown): IDifftFile | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    language: parseLanguage(value.language),
    status: parseStatus(value.status),
    alignedLines: parseAlignedLines(value.aligned_lines),
    chunks: parseChunks(value.chunks),
  }
}

function parseLanguage(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function classifyLanguage(language: string | null): DifftLanguageKind {
  if (language === null) {
    return 'unknown'
  }

  if (language === 'Binary') {
    return 'binary'
  }

  if (language === 'Text') {
    return 'plain-text'
  }

  if (language.startsWith('Text (')) {
    return 'plain-text-fallback'
  }

  return 'structural'
}

function parseStatus(value: unknown): DifftStatus | null {
  switch (value) {
    case 'unchanged':
    case 'created':
    case 'deleted':
    case 'changed':
      return value
    default:
      return null
  }
}

function parseAlignedLines(
  value: unknown
): ReadonlyArray<readonly [number | null, number | null]> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(item => {
    if (!Array.isArray(item) || item.length < 2) {
      return []
    }

    return [[parseLineNumber(item[0]), parseLineNumber(item[1])] as const]
  })
}

function parseChunks(
  value: unknown
): ReadonlyArray<ReadonlyArray<IDifftChunkEntry>> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(chunk => parseChunk(chunk))
}

function parseChunk(value: unknown): ReadonlyArray<IDifftChunkEntry> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(item => {
    const entry = parseChunkEntry(item)
    return entry === null ? [] : [entry]
  })
}

function parseChunkEntry(value: unknown): IDifftChunkEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const lhs = parseSide(value.lhs)
  const rhs = parseSide(value.rhs)

  if (lhs === null && rhs === null) {
    return null
  }

  return { lhs, rhs }
}

function parseSide(value: unknown): IDifftSide | null {
  if (!isRecord(value)) {
    return null
  }

  const lineNumber = parseNumber(value.line_number)
  if (lineNumber === null) {
    return null
  }

  return {
    lineNumber,
    changes: parseChanges(value.changes),
  }
}

function parseChanges(value: unknown): ReadonlyArray<IDifftChange> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(item => {
    if (!isRecord(item) || typeof item.content !== 'string') {
      return []
    }

    return [
      {
        content: item.content,
        start: parseNumber(item.start) ?? undefined,
        end: parseNumber(item.end) ?? undefined,
      },
    ]
  })
}

function buildHunks(
  file: IDifftFile,
  oldLines: ReadonlyArray<string>,
  newLines: ReadonlyArray<string>
): ReadonlyArray<DiffHunk> {
  if (file.status === 'unchanged') {
    return []
  }

  const alignedLines =
    file.alignedLines.length > 0
      ? file.alignedLines
      : deriveAlignedLines(file.chunks)

  if (alignedLines.length === 0) {
    return []
  }

  const chunkIndex = buildChunkIndex(file.chunks)
  const sourceChunks =
    file.chunks.length > 0
      ? file.chunks
      : [createSyntheticChunk(alignedLines, oldLines, newLines)]

  const hunks = new Array<DiffHunk>()
  let linesConsumed = 0
  let previousHunk: DiffHunk | null = null

  for (const chunk of sourceChunks) {
    const lineNumbers = getChunkLineNumbers(chunk)
    if (lineNumbers.oldLines.size === 0 && lineNumbers.newLines.size === 0) {
      continue
    }

    const slice = findHunkSlice(alignedLines, lineNumbers)
    const rows = getSliceRows(alignedLines, slice)
    const header = createHunkHeader(rows)
    const lines = buildDiffLines(
      rows,
      lineNumbers,
      chunkIndex,
      oldLines,
      newLines,
      header,
      linesConsumed
    )

    if (lines.length === 1) {
      continue
    }

    const hunk: DiffHunk = new DiffHunk(
      header,
      lines,
      linesConsumed,
      linesConsumed + lines.length - 1,
      getHunkHeaderExpansionType(hunks.length, header, previousHunk)
    )

    hunks.push(hunk)
    previousHunk = hunk
    linesConsumed += lines.length
  }

  return hunks
}

function buildChunkIndex(
  chunks: ReadonlyArray<ReadonlyArray<IDifftChunkEntry>>
): IDifftChunkIndex {
  const lhs = new Map<number, IDifftSide>()
  const rhs = new Map<number, IDifftSide>()

  for (const chunk of chunks) {
    for (const entry of chunk) {
      if (entry.lhs !== null) {
        lhs.set(entry.lhs.lineNumber, entry.lhs)
      }

      if (entry.rhs !== null) {
        rhs.set(entry.rhs.lineNumber, entry.rhs)
      }
    }
  }

  return { lhs, rhs }
}

function deriveAlignedLines(
  chunks: ReadonlyArray<ReadonlyArray<IDifftChunkEntry>>
): ReadonlyArray<readonly [number | null, number | null]> {
  return chunks.flatMap(chunk =>
    chunk.map(
      entry =>
        [entry.lhs?.lineNumber ?? null, entry.rhs?.lineNumber ?? null] as const
    )
  )
}

function createSyntheticChunk(
  alignedLines: ReadonlyArray<readonly [number | null, number | null]>,
  oldLines: ReadonlyArray<string>,
  newLines: ReadonlyArray<string>
): ReadonlyArray<IDifftChunkEntry> {
  return alignedLines.flatMap(([oldLine, newLine]) => {
    if (!isChangedAlignedLine(oldLine, newLine, oldLines, newLines)) {
      return []
    }

    return [
      {
        lhs: oldLine === null ? null : { lineNumber: oldLine, changes: [] },
        rhs: newLine === null ? null : { lineNumber: newLine, changes: [] },
      },
    ]
  })
}

function isChangedAlignedLine(
  oldLine: number | null,
  newLine: number | null,
  oldLines: ReadonlyArray<string>,
  newLines: ReadonlyArray<string>
): boolean {
  if (oldLine === null || newLine === null) {
    return true
  }

  const oldContent = oldLines[oldLine]
  const newContent = newLines[newLine]

  return oldContent !== newContent
}

function getChunkLineNumbers(
  chunk: ReadonlyArray<IDifftChunkEntry>
): IChunkLineNumbers {
  const oldLines = new Set<number>()
  const newLines = new Set<number>()

  for (const entry of chunk) {
    if (entry.lhs !== null) {
      oldLines.add(entry.lhs.lineNumber)
    }

    if (entry.rhs !== null) {
      newLines.add(entry.rhs.lineNumber)
    }
  }

  return { oldLines, newLines }
}

function findHunkSlice(
  alignedLines: ReadonlyArray<readonly [number | null, number | null]>,
  lineNumbers: IChunkLineNumbers
): IHunkSlice {
  let start = -1
  let end = -1

  for (const [index, [oldLine, newLine]] of alignedLines.entries()) {
    const matchesOld = oldLine !== null && lineNumbers.oldLines.has(oldLine)
    const matchesNew = newLine !== null && lineNumbers.newLines.has(newLine)

    if (!matchesOld && !matchesNew) {
      continue
    }

    if (start === -1) {
      start = index
    }

    end = index
  }

  if (start === -1 || end === -1) {
    return { start: 0, end: alignedLines.length - 1 }
  }

  return {
    start: Math.max(0, start - DefaultContextLineCount),
    end: Math.min(alignedLines.length - 1, end + DefaultContextLineCount),
  }
}

function getSliceRows(
  alignedLines: ReadonlyArray<readonly [number | null, number | null]>,
  slice: IHunkSlice
): ReadonlyArray<readonly [number | null, number | null]> {
  return alignedLines.slice(slice.start, slice.end + 1)
}

function createHunkHeader(
  rows: ReadonlyArray<readonly [number | null, number | null]>
): DiffHunkHeader {
  const oldLineNumbers = rows.flatMap(([oldLine]) =>
    oldLine === null ? [] : [oldLine + 1]
  )
  const newLineNumbers = rows.flatMap(([, newLine]) =>
    newLine === null ? [] : [newLine + 1]
  )

  const oldStartLine = oldLineNumbers[0] ?? 0
  const newStartLine = newLineNumbers[0] ?? 0

  return new DiffHunkHeader(
    oldStartLine,
    oldLineNumbers.length,
    newStartLine,
    newLineNumbers.length
  )
}

function buildDiffLines(
  rows: ReadonlyArray<readonly [number | null, number | null]>,
  lineNumbers: IChunkLineNumbers,
  chunkIndex: IDifftChunkIndex,
  oldLines: ReadonlyArray<string>,
  newLines: ReadonlyArray<string>,
  header: DiffHunkHeader,
  linesConsumed: number
): ReadonlyArray<DiffLine> {
  const lines = new Array<DiffLine>()
  lines.push(
    new DiffLine(
      header.toDiffLineRepresentation(),
      DiffLineType.Hunk,
      1,
      null,
      null
    )
  )

  let diffLineNumber = linesConsumed

  for (const [oldLine, newLine] of rows) {
    const oldContent = getLineContent(oldLine, oldLines, chunkIndex.lhs)
    const newContent = getLineContent(newLine, newLines, chunkIndex.rhs)
    const hasOld = oldLine !== null
    const hasNew = newLine !== null
    const changedOld = oldLine !== null && lineNumbers.oldLines.has(oldLine)
    const changedNew = newLine !== null && lineNumbers.newLines.has(newLine)

    if (
      hasOld &&
      hasNew &&
      !changedOld &&
      !changedNew &&
      oldContent === newContent
    ) {
      lines.push(
        new DiffLine(
          ` ${newContent}`,
          DiffLineType.Context,
          ++diffLineNumber,
          oldLine + 1,
          newLine + 1
        )
      )
      continue
    }

    if (hasOld && hasNew) {
      lines.push(
        new DiffLine(
          `-${oldContent}`,
          DiffLineType.Delete,
          ++diffLineNumber,
          oldLine + 1,
          null,
          false,
          getInlineChangedRanges(oldLine, chunkIndex.lhs)
        )
      )
      lines.push(
        new DiffLine(
          `+${newContent}`,
          DiffLineType.Add,
          ++diffLineNumber,
          null,
          newLine + 1,
          false,
          getInlineChangedRanges(newLine, chunkIndex.rhs)
        )
      )
      continue
    }

    if (hasOld) {
      lines.push(
        new DiffLine(
          `-${oldContent}`,
          DiffLineType.Delete,
          ++diffLineNumber,
          oldLine + 1,
          null
        )
      )
      continue
    }

    if (hasNew) {
      lines.push(
        new DiffLine(
          `+${newContent}`,
          DiffLineType.Add,
          ++diffLineNumber,
          null,
          newLine + 1
        )
      )
    }
  }

  return lines
}

function getLineContent(
  lineNumber: number | null,
  sourceLines: ReadonlyArray<string>,
  sideIndex: ReadonlyMap<number, IDifftSide>
): string {
  if (lineNumber === null) {
    return ''
  }

  const sourceLine = sourceLines[lineNumber]
  if (sourceLine !== undefined) {
    return sourceLine
  }

  const side = sideIndex.get(lineNumber)
  if (side === undefined) {
    return ''
  }

  return side.changes.map(change => change.content).join('')
}

function splitLines(text: string | undefined): ReadonlyArray<string> {
  if (text === undefined || text.length === 0) {
    return []
  }

  const lines = text.split(/\r\n|\n|\r/)
  const hasTrailingNewline = /(?:\r\n|\n|\r)$/.test(text)
  return hasTrailingNewline ? lines.slice(0, -1) : lines
}

function parseLineNumber(value: unknown): number | null {
  if (value === null) {
    return null
  }

  return parseNumber(value)
}

function parseNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getInlineChangedRanges(
  lineNumber: number,
  sideIndex: ReadonlyMap<number, IDifftSide>
): ReadonlyArray<readonly [number, number]> | undefined {
  const side = sideIndex.get(lineNumber)
  if (side === undefined || side.changes.length === 0) {
    return undefined
  }

  const ranges: Array<readonly [number, number]> = []

  for (const change of side.changes) {
    if (
      change.start !== undefined &&
      change.end !== undefined &&
      change.end > change.start
    ) {
      ranges.push([change.start, change.end - change.start] as const)
    }
  }

  return ranges.length > 0 ? ranges : undefined
}
