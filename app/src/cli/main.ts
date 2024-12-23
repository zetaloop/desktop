import { join, resolve } from 'path'
import parse from 'minimist'
import { execFile, ExecFileException } from 'child_process'

const run = (...args: Array<string>) => {
  function cb(e: ExecFileException | null, stderr: string) {
    if (e) {
      console.error(`Error running command ${args}`)
      console.error(stderr)
      process.exit(e.code)
    }
  }

  if (process.platform === 'darwin') {
    execFile('open', ['-n', join(__dirname, '../../..'), '--args', ...args], cb)
  } else if (process.platform === 'win32') {
    const exeName = `GitHubDesktop${__DEV__ ? '-dev' : ''}.exe`
    execFile(join(__dirname, `../../${exeName}`), args, cb)
  } else {
    throw new Error('Unsupported platform')
  }
}

const args = parse(process.argv.slice(2), {
  alias: { help: 'h', branch: 'b' },
  boolean: ['help'],
})

const usage = (exitCode = 1): never => {
  process.stderr.write(
    'GitHub Desktop CLI 用法说明: \n' +
      '  github                            打开当前目录\n' +
      '  github open [path]                打开一个目录\n' +
      '  github clone [-b branch] <url>    克隆此 URL 或 name/owner (例如 torvalds/linux)\n' +
      '                                    所对应的的仓库，也可选择检出特定分支。\n'
  )
  process.exit(exitCode)
}

delete process.env.ELECTRON_RUN_AS_NODE

if (args.help || args._.at(0) === 'help') {
  usage(0)
} else if (args._.at(0) === 'clone') {
  const urlArg = args._.at(1)
  // Assume name with owner slug if it looks like it
  const url =
    urlArg && /^[^\/]+\/[^\/]+$/.test(urlArg)
      ? `https://github.com/${urlArg}`
      : urlArg

  if (!url) {
    usage(1)
  } else if (typeof args.branch === 'string') {
    run(`--cli-clone=${url}`, `--cli-branch=${args.branch}`)
  } else {
    run(`--cli-clone=${url}`)
  }
} else {
  const [firstArg, secondArg] = args._
  const pathArg = firstArg === 'open' ? secondArg : firstArg
  const path = resolve(pathArg ?? '.')
  run(`--cli-open=${path}`)
}
