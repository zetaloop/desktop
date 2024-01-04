import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { shell } from '../../lib/app-shell'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IInstallGitProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissable prop.
   */
  readonly onDismissed: () => void

  /**
   * The path to the current repository, in case the user wants to continue
   * doing whatever they're doing.
   */
  readonly path: string

  /** Called when the user chooses to open the shell. */
  readonly onOpenShell: (path: string) => void
}

/**
 * A dialog indicating that Git wasn't found, to direct the user to an
 * external resource for more information about setting up their environment.
 */
export class InstallGit extends React.Component<IInstallGitProps, {}> {
  public constructor(props: IInstallGitProps) {
    super(props)
  }

  private onSubmit = () => {
    this.props.onOpenShell(this.props.path)
    this.props.onDismissed()
  }

  private onExternalLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const url = `https://docs.github.com/zh/get-started/getting-started-with-git/set-up-git#setting-up-git`
    shell.openExternal(url)
  }

  public render() {
    return (
      <Dialog
        id="install-git"
        type="warning"
        title={__DARWIN__ ? '找不到 Git' : '找不到 Git'}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            此电脑上没有安装 Git，这样的话您就没法在
            {__DARWIN__ ? '终端' : '终端'}里运行 Git 命令了。
          </p>
          <p>我们有一份安装指南可以帮助您配置 Git 环境。</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '跳过' : '跳过'}
            cancelButtonText="前往安装 Git"
            onCancelButtonClick={this.onExternalLink}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
