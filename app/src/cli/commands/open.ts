import chalk from 'chalk'
import * as Path from 'path'

import { ICommandModule, mriArgv } from '../load-commands'
import { openDesktop } from '../open-desktop'
import { parseRemote } from '../../lib/remote-parsing'

export const command: ICommandModule = {
  command: 'open <路径>',
  aliases: ['<路径>'],
  description: '用 GitHub Desktop 打开一个 git 仓库',
  args: [
    {
      name: '路径',
      description: '仓库文件夹路径',
      type: 'string',
      required: false,
    },
  ],
  handler({ _: [pathArg] }: mriArgv) {
    if (!pathArg) {
      // just open Desktop
      openDesktop()
      return
    }
    //Check if the pathArg is a remote url
    if (parseRemote(pathArg) != null) {
      console.log(
        `\n无法直接打开远程地址\n` +
          `请先使用 \`${chalk.bold(`git clone ` + pathArg)}\`` +
          ` 来克隆它`
      )
    } else {
      const repositoryPath = Path.resolve(process.cwd(), pathArg)
      const url = `openLocalRepo/${encodeURIComponent(repositoryPath)}`
      openDesktop(url)
    }
  },
}
