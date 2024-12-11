import { join, resolve } from 'path'
import parse from 'minimist'
import { spawn } from 'child_process'

const _spawn = (args: string[]) => {
  if (process.platform === 'darwin') {
    const execPath = join(__dirname, '../../../').replace(/\/$/, '')
    return spawn('open', [execPath, '--args', ...args], {
      stdio: ['ignore', 'inherit', 'inherit'],
    })
  } else if (process.platform === 'win32') {
    throw new Error('TODO')
  } else {
    throw new Error('Unsupported platform')
  }
}

const run = (...args: Array<string | false | undefined>) =>
  _spawn(args.filter(x => typeof x === 'string'))
    .on('error', e => {
      console.error('Error running command', e)
      process.exitCode = 1
    })
    .on('exit', code => {
      process.exitCode = typeof code === 'number' ? code : process.exitCode
    })

const args = parse(process.argv.slice(2), {
  alias: { help: 'h', branch: 'b' },
  boolean: ['help'],
  string: ['branch'],
})

const usage = (exitCode = 1): never => {
  process.stderr.write(
    'GitHub Desktop CLI usage: \n' +
      '  github                                       Open the current directory\n' +
      '  github open [path]                           Open the provided path\n' +
      '  github clone [-b branch] <url|owner/name>    Clone the repository by url or \n' +
      '                                               name/owner (ex torvalds/linux),\n' +
      '                                               optionally checking out the branch\n'
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
  } else {
    run(`--cli-clone=${url}`, args.branch && `--cli-branch=${args.branch}`)
  }
} else {
  const [firstArg, secondArg] = args._
  const pathArg = firstArg === 'open' ? secondArg : firstArg
  const path = resolve(pathArg ?? '.')
  run(`--cli-open=${path}`)
}
