import * as Path from 'path'
import { execFile } from './exec-file'

const findOnPath = (program: string) => {
  if (process.platform === 'win32') {
    const cwd = process.env.SystemRoot || 'C:\\Windows'
    const cmd = Path.join(cwd, 'System32', 'where.exe')
    return execFile(cmd, [program], { cwd })
  }

  return execFile('which', [program])
}

let difftOnPathCache: Promise<boolean> | null = null

export const findDifftOnPath = () =>
  findOnPath('difft')
    .then(({ stdout }) => stdout.split(/\r?\n/, 1)[0])
    .catch(() => undefined)

export const isDifftOnPath = async () => {
  if (difftOnPathCache === null) {
    difftOnPathCache = findDifftOnPath().then(path => path !== undefined)
  }

  return difftOnPathCache
}
