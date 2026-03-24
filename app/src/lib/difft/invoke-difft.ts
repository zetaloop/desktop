import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import * as Path from 'path'

import { execFile } from '../exec-file'

const DifftTimeoutInMs = 5000
const DifftMaxBufferSize = 70e6

export type DifftInvocationFailureReason =
  | 'timed-out'
  | 'process-failed'
  | 'parse-failed'

export type DifftInvocationResult =
  | {
      readonly kind: 'success'
      readonly payload: unknown
    }
  | {
      readonly kind: 'failure'
      readonly reason: DifftInvocationFailureReason
    }

export interface IDifftInvocationInput {
  readonly oldPath: string
  readonly newPath: string
  readonly oldText: string
  readonly newText: string
}

export async function invokeDifft(
  input: IDifftInvocationInput
): Promise<DifftInvocationResult> {
  const tempDir = await mkdtemp(Path.join(tmpdir(), 'desktop-difft-'))

  try {
    const oldFilePath = await writeSnapshotFile(
      tempDir,
      'old',
      input.oldPath,
      input.oldText
    )
    const newFilePath = await writeSnapshotFile(
      tempDir,
      'new',
      input.newPath,
      input.newText
    )

    try {
      const { stdout } = await execFile(
        'difft',
        ['--display', 'json', oldFilePath, newFilePath],
        {
          env: { ...process.env, DFT_UNSTABLE: '1' },
          maxBuffer: DifftMaxBufferSize,
          timeout: DifftTimeoutInMs,
        }
      )

      return parseDifftOutput(stdout)
    } catch (error) {
      return {
        kind: 'failure',
        reason: isTimedOutError(error) ? 'timed-out' : 'process-failed',
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function writeSnapshotFile(
  tempDir: string,
  side: 'old' | 'new',
  sourcePath: string,
  text: string
): Promise<string> {
  const basename = Path.basename(sourcePath) || `${side}.txt`
  const filePath = Path.join(tempDir, `${side}-${basename}`)
  await writeFile(filePath, text, 'utf8')
  return filePath
}

function parseDifftOutput(stdout: string): DifftInvocationResult {
  const trimmed = stdout.trim()

  if (trimmed.length === 0) {
    return { kind: 'failure', reason: 'parse-failed' }
  }

  try {
    return { kind: 'success', payload: JSON.parse(trimmed) }
  } catch {
    const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0)
    if (lines.length === 0) {
      return { kind: 'failure', reason: 'parse-failed' }
    }

    try {
      return {
        kind: 'success',
        payload: lines.map(line => JSON.parse(line)),
      }
    } catch {
      return { kind: 'failure', reason: 'parse-failed' }
    }
  }
}

function isTimedOutError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  return 'killed' in error && error.killed === true
}
