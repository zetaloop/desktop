import * as QueryString from 'querystring'
import { URL } from 'url'

import { CommandError } from '../util'
import { openDesktop } from '../open-desktop'
import { ICommandModule, mriArgv } from '../load-commands'

interface ICloneArgs extends mriArgv {
  readonly branch?: string
}

export const command: ICommandModule = {
  command: 'clone <网址|标识符>',
  description: '克隆一个仓库',
  args: [
    {
      name: '网址|标识符',
      required: true,
      description:
        '仓库的 URL 地址，或者 GitHub "用户/仓库名" 格式的标识符',
      type: 'string',
    },
  ],
  options: {
    branch: {
      type: 'string',
      aliases: ['b'],
      description: '克隆完成后要检出的分支',
    },
  },
  handler({ _: [cloneUrl], branch }: ICloneArgs) {
    if (!cloneUrl) {
      throw new CommandError('必须指定克隆地址')
    }
    try {
      const _ = new URL(cloneUrl)
      _.toString() // don’t mark as unused
    } catch (e) {
      // invalid URL, assume a GitHub repo
      cloneUrl = `https://github.com/${cloneUrl}`
    }
    const url = `openRepo/${cloneUrl}?${QueryString.stringify({
      branch,
    })}`
    openDesktop(url)
  },
}
