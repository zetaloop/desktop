import * as Path from 'path'

import { Account } from '../../../models/account'
import { mkdir, writeFile } from 'fs/promises'
import { API } from '../../api'
import { APIError } from '../../http'
import {
  executionOptionsWithProgress,
  PushProgressParser,
} from '../../progress'
import { git } from '../../git'
import { friendlyEndpointName } from '../../friendly-endpoint-name'
import { IRemote } from '../../../models/remote'
import { getDefaultBranch } from '../../helpers/default-branch'
import { envForRemoteOperation } from '../../git/environment'
import { pathExists } from '../../../ui/lib/path-exists'

const nl = __WIN32__ ? '\r\n' : '\n'
const InitialReadmeContents =
  `# 欢迎使用 GitHub Desktop！${nl}${nl}` +
  `这里是你的 README 自述文件。自述文件是你向大家介绍你的项目是什么、如何使用的地方。${nl}${nl}` +
  `在第六行写下你的名字，保存文件，然后回到 GitHub Desktop 吧。${nl}`

async function createAPIRepository(account: Account, name: string) {
  const api = new API(account.endpoint, account.token)

  try {
    return await api.createRepository(
      null,
      name,
      'GitHub Desktop 教程储存库',
      true
    )
  } catch (err) {
    if (
      err instanceof APIError &&
      err.responseStatus === 422 &&
      err.apiError !== null
    ) {
      if (err.apiError.message === 'Repository creation failed.') {
        if (
          err.apiError.errors &&
          err.apiError.errors.some(
            x => x.message === 'name already exists on this account'
          )
        ) {
          throw new Error(
            `您在 ${friendlyEndpointName(
              account
            )} 的账号上已经有一个名为 "${name}" 的储存库了。\n\n` +
              '请删除那个储存库再试一次。'
          )
        }
      }
    }

    throw err
  }
}

async function pushRepo(
  path: string,
  account: Account,
  remote: IRemote,
  remoteBranchName: string,
  progressCb: (title: string, value: number, description?: string) => void
) {
  const pushTitle = `推送储存库到 ${friendlyEndpointName(account)}`
  progressCb(pushTitle, 0)

  const pushOpts = await executionOptionsWithProgress(
    {
      env: await envForRemoteOperation(account, remote.url),
    },
    new PushProgressParser(),
    progress => {
      if (progress.kind === 'progress') {
        progressCb(pushTitle, progress.percent, progress.details.text)
      }
    }
  )

  const args = ['push', '-u', remote.name, remoteBranchName]
  await git(args, path, 'tutorial:push', pushOpts)
}

/**
 * Creates a repository on the remote (as specified by the Account
 * parameter), initializes an empty repository at the given path,
 * sets up the expected tutorial contents, and pushes the repository
 * to the remote.
 *
 * @param path    The path on the local machine where the tutorial
 *                repository is to be created
 *
 * @param account The account (and thereby the GitHub host) under
 *                which the repository is to be created created
 */
export async function createTutorialRepository(
  account: Account,
  name: string,
  path: string,
  progressCb: (title: string, value: number, description?: string) => void
) {
  const endpointName = friendlyEndpointName(account)
  progressCb(`在 ${endpointName} 上创建储存库`, 0)

  if (await pathExists(path)) {
    throw new Error(
      `文件夹 '${path}' 已经存在。请将它移动到别的位置，或者删除，然后再试一次。`
    )
  }

  const repo = await createAPIRepository(account, name)
  const branch = repo.default_branch ?? (await getDefaultBranch())
  progressCb('初始化本地储存库', 0.2)

  await mkdir(path, { recursive: true })

  await git(
    ['-c', `init.defaultBranch=${branch}`, 'init'],
    path,
    'tutorial:init'
  )

  await writeFile(Path.join(path, 'README.md'), InitialReadmeContents)

  await git(['add', '--', 'README.md'], path, 'tutorial:add')
  await git(['commit', '-m', '初始提交'], path, 'tutorial:commit')

  const remote: IRemote = { name: 'origin', url: repo.clone_url }
  await git(
    ['remote', 'add', remote.name, remote.url],
    path,
    'tutorial:add-remote'
  )

  await pushRepo(path, account, remote, branch, (title, value, description) => {
    progressCb(title, 0.3 + value * 0.6, description)
  })

  progressCb('完成教程储存库', 0.9)

  return repo
}
