import * as Path from 'path'
import { execFile } from './exec-file'
import { updateEnvironmentForProcess } from './shell'

const findOnPath = (program: string) => {
  if (process.platform === 'win32') {
    const cwd = process.env.SystemRoot || 'C:\\Windows'
    const cmd = Path.join(cwd, 'System32', 'where.exe')
    return execFile(cmd, [program], { cwd })
  }

  return execFile('which', [program])
}

let difftOnPathCache: Promise<boolean> | null = null
let difftAvailabilityErrorCache: Promise<string | null> | null = null

export const findDifftOnPath = async () => {
  await updateEnvironmentForProcess()

  return findOnPath('difft')
    .then(({ stdout }) => stdout.split(/\r?\n/, 1)[0])
    .catch(() => undefined)
}

export const getDifftAvailabilityError = async (
  forceRefresh: boolean = false
) => {
  if (difftAvailabilityErrorCache === null || forceRefresh) {
    difftAvailabilityErrorCache = findDifftOnPath().then(async path => {
      if (path === undefined) {
        return '找不到 Difftastic 的 difft 可执行文件。请确认已经安装 Difftastic，并且 PATH 环境变量里可以找到它。'
      }

      try {
        await execFile(path, ['--version'])
        return null
      } catch (error) {
        const detail = getDifftAvailabilityErrorDetail(error)
        return detail === null
          ? `检测到了 Difftastic，但无法执行 ${path}。`
          : `检测到了 Difftastic，但无法执行 ${path}。${detail}`
      }
    })
  }

  return difftAvailabilityErrorCache
}

export const isDifftOnPath = async (forceRefresh: boolean = false) => {
  if (difftOnPathCache === null || forceRefresh) {
    difftOnPathCache = getDifftAvailabilityError(forceRefresh).then(
      error => error === null
    )
  }

  return difftOnPathCache
}

function getDifftAvailabilityErrorDetail(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  if ('stderr' in error && typeof error.stderr === 'string') {
    const stderr = error.stderr.trim()
    if (stderr.length > 0) {
      return stderr
    }
  }

  if ('message' in error && typeof error.message === 'string') {
    const message = error.message.trim()
    if (message.length > 0) {
      return message
    }
  }

  return null
}
