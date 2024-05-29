import {
  GitProcess,
  IGitResult as DugiteResult,
  GitError as DugiteError,
  IGitExecutionOptions as DugiteExecutionOptions,
} from 'dugite'

import { assertNever } from '../fatal-error'
import * as GitPerf from '../../ui/lib/git-perf'
import * as Path from 'path'
import { isErrnoException } from '../errno-exception'
import { ChildProcess } from 'child_process'
import { Readable } from 'stream'
import split2 from 'split2'
import { getFileFromExceedsError } from '../helpers/regex'
import { merge } from '../merge'
import { withTrampolineEnv } from '../trampoline/trampoline-environment'
import { enableCredentialHelperTrampoline } from '../feature-flag'

/**
 * An extension of the execution options in dugite that
 * allows us to piggy-back our own configuration options in the
 * same object.
 */
export interface IGitExecutionOptions extends DugiteExecutionOptions {
  /**
   * The exit codes which indicate success to the
   * caller. Unexpected exit codes will be logged and an
   * error thrown. Defaults to 0 if undefined.
   */
  readonly successExitCodes?: ReadonlySet<number>

  /**
   * The git errors which are expected by the caller. Unexpected errors will
   * be logged and an error thrown.
   */
  readonly expectedErrors?: ReadonlySet<DugiteError>

  /** Should it track & report LFS progress? */
  readonly trackLFSProgress?: boolean

  /**
   * Whether the command about to run is part of a background task or not.
   * This affects error handling and UI such as credential prompts.
   */
  readonly isBackgroundTask?: boolean
}

/**
 * The result of using `git`. This wraps dugite's results to provide
 * the parsed error if one occurs.
 */
export interface IGitResult extends DugiteResult {
  /**
   * The parsed git error. This will be null when the exit code is included in
   * the `successExitCodes`, or when dugite was unable to parse the
   * error.
   */
  readonly gitError: DugiteError | null

  /** The human-readable error description, based on `gitError`. */
  readonly gitErrorDescription: string | null

  /** Both stdout and stderr combined. */
  readonly combinedOutput: string

  /**
   * The path that the Git command was executed from, i.e. the
   * process working directory (not to be confused with the Git
   * working directory which is... super confusing, I know)
   */
  readonly path: string
}
export class GitError extends Error {
  /** The result from the failed command. */
  public readonly result: IGitResult

  /** The args for the failed command. */
  public readonly args: ReadonlyArray<string>

  /**
   * Whether or not the error message is just the raw output of the git command.
   */
  public readonly isRawMessage: boolean

  public constructor(result: IGitResult, args: ReadonlyArray<string>) {
    let rawMessage = true
    let message

    if (result.gitErrorDescription) {
      message = result.gitErrorDescription
      rawMessage = false
    } else if (result.combinedOutput.length > 0) {
      message = result.combinedOutput
    } else if (result.stderr.length) {
      message = result.stderr
    } else if (result.stdout.length) {
      message = result.stdout
    } else {
      message = 'Unknown error'
      rawMessage = false
    }

    super(message)

    this.name = 'GitError'
    this.result = result
    this.args = args
    this.isRawMessage = rawMessage
  }
}

/**
 * Shell out to git with the given arguments, at the given path.
 *
 * @param args             The arguments to pass to `git`.
 *
 * @param path             The working directory path for the execution of the
 *                         command.
 *
 * @param name             The name for the command based on its caller's
 *                         context. This will be used for performance
 *                         measurements and debugging.
 *
 * @param options          Configuration options for the execution of git,
 *                         see IGitExecutionOptions for more information.
 *
 * Returns the result. If the command exits with a code not in
 * `successExitCodes` or an error not in `expectedErrors`, a `GitError` will be
 * thrown.
 */
export async function git(
  args: string[],
  path: string,
  name: string,
  options?: IGitExecutionOptions
): Promise<IGitResult> {
  const defaultOptions: IGitExecutionOptions = {
    successExitCodes: new Set([0]),
    expectedErrors: new Set(),
  }

  let combinedOutput = ''
  const opts = {
    ...defaultOptions,
    ...options,
  }

  opts.processCallback = (process: ChildProcess) => {
    options?.processCallback?.(process)

    const combineOutput = (readable: Readable | null) => {
      if (readable) {
        readable.pipe(split2()).on('data', (line: string) => {
          combinedOutput += line + '\n'
        })
      }
    }

    combineOutput(process.stderr)
    combineOutput(process.stdout)
  }

  return withTrampolineEnv(
    async env => {
      const combinedEnv = merge(opts.env, env)

      // Explicitly set TERM to 'dumb' so that if Desktop was launched
      // from a terminal or if the system environment variables
      // have TERM set Git won't consider us as a smart terminal.
      // See https://github.com/git/git/blob/a7312d1a2/editor.c#L11-L15
      opts.env = { TERM: 'dumb', ...combinedEnv }

      const commandName = `${name}: git ${args.join(' ')}`

      const result = await GitPerf.measure(commandName, () =>
        GitProcess.exec(args, path, opts)
      ).catch(err => {
        // If this is an exception thrown by Node.js (as opposed to
        // dugite) let's keep the salient details but include the name of
        // the operation.
        if (isErrnoException(err)) {
          throw new Error(`Failed to execute ${name}: ${err.code}`)
        }

        throw err
      })

      const exitCode = result.exitCode

      let gitError: DugiteError | null = null
      const acceptableExitCode = opts.successExitCodes
        ? opts.successExitCodes.has(exitCode)
        : false
      if (!acceptableExitCode) {
        gitError = GitProcess.parseError(result.stderr)
        if (gitError === null) {
          gitError = GitProcess.parseError(result.stdout)
        }
      }

      const gitErrorDescription =
        gitError !== null
          ? getDescriptionForError(gitError, result.stderr)
          : null
      const gitResult = {
        ...result,
        gitError,
        gitErrorDescription,
        combinedOutput,
        path,
      }

      let acceptableError = true
      if (gitError !== null && opts.expectedErrors) {
        acceptableError = opts.expectedErrors.has(gitError)
      }

      if ((gitError !== null && acceptableError) || acceptableExitCode) {
        return gitResult
      }

      // The caller should either handle this error, or expect that exit code.
      const errorMessage = new Array<string>()
      errorMessage.push(
        `\`git ${args.join(' ')}\` exited with an unexpected code: ${exitCode}.`
      )

      if (result.stdout) {
        errorMessage.push('stdout:')
        errorMessage.push(result.stdout)
      }

      if (result.stderr) {
        errorMessage.push('stderr:')
        errorMessage.push(result.stderr)
      }

      if (gitError !== null) {
        errorMessage.push(
          `(The error was parsed as ${gitError}: ${gitErrorDescription})`
        )
      }

      log.error(errorMessage.join('\n'))

      if (gitError === DugiteError.PushWithFileSizeExceedingLimit) {
        const result = getFileFromExceedsError(errorMessage.join())
        const files = result.join('\n')

        if (files !== '') {
          gitResult.gitErrorDescription += '\n\nFile causing error:\n\n' + files
        }
      }

      throw new GitError(gitResult, args)
    },
    path,
    options?.isBackgroundTask ?? false
  )
}

/**
 * Determine whether the provided `error` is an authentication failure
 * as per our definition. Note that this is not an exhaustive list of
 * authentication failures, only a collection of errors that we treat
 * equally in terms of error message and presentation to the user.
 */
export function isAuthFailureError(
  error: DugiteError
): error is
  | DugiteError.SSHAuthenticationFailed
  | DugiteError.SSHPermissionDenied
  | DugiteError.HTTPSAuthenticationFailed {
  switch (error) {
    case DugiteError.SSHAuthenticationFailed:
    case DugiteError.SSHPermissionDenied:
    case DugiteError.HTTPSAuthenticationFailed:
      return true
  }
  return false
}

/**
 * Determine whether the provided `error` is an error from Git indicating
 * that a configuration file  write failed due to a lock file already
 * existing for that config file.
 */
export function isConfigFileLockError(error: Error): error is GitError {
  return (
    error instanceof GitError &&
    error.result.gitError === DugiteError.ConfigLockFileAlreadyExists
  )
}

const lockFilePathRe = /^error: could not lock config file (.+?): File exists$/m

/**
 * If the `result` is associated with an config lock file error (as determined
 * by `isConfigFileLockError`) this method will attempt to extract an absolute
 * path (i.e. rooted) to the configuration lock file in question from the Git
 * output.
 */
export function parseConfigLockFilePathFromError(result: IGitResult) {
  const match = lockFilePathRe.exec(result.stderr)

  if (match === null) {
    return null
  }

  // Git on Windows may print the config file path using forward slashes.
  // Luckily for us forward slashes are not allowed in Windows file or
  // directory names so we can simply replace any instance of forward
  // slashes with backslashes.
  const normalized = __WIN32__ ? match[1].replace('/', '\\') : match[1]

  // https://github.com/git/git/blob/232378479/lockfile.h#L117-L119
  return Path.resolve(result.path, `${normalized}.lock`)
}

export function getDescriptionForError(
  error: DugiteError,
  stderr: string
): string | null {
  if (isAuthFailureError(error)) {
    const menuHint = __DARWIN__ ? 'GitHub Desktop > 设置。' : '文件 > 设置。'
    return `身份认证失败，通常可能是因为：

- 您尚未登录您的账户：见 ${menuHint}
- 您可能需要退出并重新登录来刷新登录令牌。
- 您没有该储存库的访问权限。
- 该储存库在 GitHub 上已经被存档，请检查储存库设置来确定您是否仍有权推送提交。
- 使用 SSH 认证时，您的私钥不正确，请检查登录密钥是否已添加到 ssh-agent 并与您的账户相关联。
- 使用 SSH 认证时，对方公钥不匹配，请检查您的储存库托管服务是否通过了主机密钥验证。
- 使用账号密码认证时，您可能需要把个人访问令牌作为密码来输入，具体请查阅您的储存库托管服务的文档。`
  }

  switch (error) {
    case DugiteError.BadConfigValue:
      const errorInfo = GitProcess.parseBadConfigValueErrorInfo(stderr)
      if (errorInfo === null) {
        return 'Git 配置文件的值有误。'
      }

      return `Git 配置文件中键 '${errorInfo.key}' 的值 '${errorInfo.value}' 有误。`
    case DugiteError.SSHKeyAuditUnverified:
      return 'SSH 密钥未验证。'
    case DugiteError.RemoteDisconnection:
      return '远程端已断开连接，请检查网络连接并重试。'
    case DugiteError.HostDown:
      return '服务器不可用，请检查网络连接并重试。'
    case DugiteError.RebaseConflicts:
      return '重构出现冲突，请先解决冲突再继续。'
    case DugiteError.MergeConflicts:
      return '合并出现冲突，请先解决冲突并提交。'
    case DugiteError.HTTPSRepositoryNotFound:
    case DugiteError.SSHRepositoryNotFound:
      return '储存库不存在，可能您没有访问权限，或者它已经被删除或重命名了。'
    case DugiteError.PushNotFastForward:
      return '在您上次拉取过后，储存库有更新，您在推送前需要先拉取更新。'
    case DugiteError.BranchDeletionFailed:
      return '无法删除分支，它可能已经被删掉了。'
    case DugiteError.DefaultBranchDeletionFailed:
      return `此分支是储存库的默认分支，不可以删除。`
    case DugiteError.RevertConflicts:
      return '请先合并和提交改动，然后才能完成逆转提交。'
    case DugiteError.EmptyRebasePatch:
      return '没有可应用的改动。'
    case DugiteError.NoMatchingRemoteBranch:
      return '当前分支没有对应的远程分支。'
    case DugiteError.NothingToCommit:
      return '没有可提交的改动。'
    case DugiteError.NoSubmoduleMapping:
      return '子模块已从 .gitmodules 移除，但它的文件夹尚未删除，请删除文件夹，提交改动，然后重试。'
    case DugiteError.SubmoduleRepositoryDoesNotExist:
      return '子模块指向一个不存在的位置。'
    case DugiteError.InvalidSubmoduleSHA:
      return '子模块指向一个不存在的提交。'
    case DugiteError.LocalPermissionDenied:
      return '没有访问权限。'
    case DugiteError.InvalidMerge:
      return '该内容不能合并。'
    case DugiteError.InvalidRebase:
      return '该内容不能重构。'
    case DugiteError.NonFastForwardMergeIntoEmptyHead:
      return '该合并不是快进合并，无法在空分支上执行。'
    case DugiteError.PatchDoesNotApply:
      return '该改动与储存库中的文件冲突。'
    case DugiteError.BranchAlreadyExists:
      return '同名分支已存在。'
    case DugiteError.BadRevision:
      return '无效修订。'
    case DugiteError.NotAGitRepository:
      return '这不是 Git 储存库。'
    case DugiteError.ProtectedBranchForcePush:
      return '该分支受保护，不允许强制推送。'
    case DugiteError.ProtectedBranchRequiresReview:
      return '该分支受保护，任何更改都需要审核批准，你需要为此创建拉取请求。'
    case DugiteError.PushWithFileSizeExceedingLimit:
      return '推送包含了大小超过 100MB 的文件，超过 GitHub 文件大小限制，请从历史记录中删除过大的文件后重试。'
    case DugiteError.HexBranchNameRejected:
      return '分支名称不能是 40 位十六进制字符串，这与 Git 对象的格式有冲突。'
    case DugiteError.ForcePushRejected:
      return '该分支拒绝了强制推送。'
    case DugiteError.InvalidRefLength:
      return '引用的长度不能超过 255 字符。'
    case DugiteError.CannotMergeUnrelatedHistories:
      return '无法合并从不相关的历史记录。'
    case DugiteError.PushWithPrivateEmail:
      return '无法推送，提交的邮箱在 GitHub 上设为私有。如需继续，请访问 https://github.com/settings/emails 取消勾选 "保持我的邮箱地址为私有"，然后回来继续提交。提交完成后可以重新勾选。'
    case DugiteError.LFSAttributeDoesNotMatch:
      return '全局 Git 配置文件中的 Git LFS 属性与当前不符。'
    case DugiteError.ProtectedBranchDeleteRejected:
      return '该分支受保护，不能从远程端删除。'
    case DugiteError.ProtectedBranchRequiredStatus:
      return '状态检查失败，推送已被远程服务器拒绝。'
    case DugiteError.BranchRenameFailed:
      return '无法重命名该分支。'
    case DugiteError.PathDoesNotExist:
      return '该路径不存在。'
    case DugiteError.InvalidObjectName:
      return 'Git 储存库中找不到该对象。'
    case DugiteError.OutsideRepository:
      return '该路径在储存库中无效。'
    case DugiteError.LockFileAlreadyExists:
      return '储存库中已存在锁文件，该操作被阻止。'
    case DugiteError.NoMergeToAbort:
      return '当前没有合并操作，不需要停止。'
    case DugiteError.NoExistingRemoteBranch:
      return '远程分支不存在。'
    case DugiteError.LocalChangesOverwritten:
      return '当前有未提交的文件改动，如果切换分支会被覆盖导致丢失，因此请先提交或暂存这些改动。'
    case DugiteError.UnresolvedConflicts:
      return '当前仍有冲突未解决。'
    case DugiteError.ConfigLockFileAlreadyExists:
      // Added in dugite 1.88.0 (https://github.com/desktop/dugite/pull/386)
      // in support of https://github.com/desktop/desktop/issues/8675 but we're
      // not using it yet. Returning a null message here means the stderr will
      // be used as the error message (or stdout if stderr is empty), i.e. the
      // same behavior as before the ConfigLockFileAlreadyExists was added
      return null
    case DugiteError.RemoteAlreadyExists:
      return null
    case DugiteError.TagAlreadyExists:
      return '同名标签已存在。'
    case DugiteError.MergeWithLocalChanges:
    case DugiteError.RebaseWithLocalChanges:
    case DugiteError.GPGFailedToSignData:
    case DugiteError.ConflictModifyDeletedInBranch:
    case DugiteError.MergeCommitNoMainlineOption:
    case DugiteError.UnsafeDirectory:
    case DugiteError.PathExistsButNotInRef:
      return null
    default:
      return assertNever(error, `未知错误：${error}`)
  }
}

/**
 * Return an array of command line arguments for network operation that override
 * the default git configuration values provided by local, global, or system
 * level git configs.
 *
 * These arguments should be inserted before the subcommand, i.e in the case of
 * `git pull` these arguments needs to go before the `pull` argument.
 */
export const gitNetworkArguments = () => [
  // Explicitly unset any defined credential helper, we rely on our own askpass
  // for authentication except when our credential helper trampoline is enabled.
  // When it is enabled we set the credential helper via environment variables
  // in withTrampolineEnv instead.
  ...(enableCredentialHelperTrampoline() ? [] : ['-c', 'credential.helper=']),
]

/**
 * Returns the arguments to use on any git operation that can end up
 * triggering a rebase.
 */
export function gitRebaseArguments() {
  return [
    // Explicitly set the rebase backend to merge.
    // We need to force this option to be sure that Desktop
    // uses the merge backend even if the user has the apply backend
    // configured, since this is the only one supported.
    // This can go away once git deprecates the apply backend.
    ...['-c', 'rebase.backend=merge'],
  ]
}

/**
 * Returns the SHA of the passed in IGitResult
 */
export function parseCommitSHA(result: IGitResult): string {
  return result.stdout.split(']')[0].split(' ')[1]
}
