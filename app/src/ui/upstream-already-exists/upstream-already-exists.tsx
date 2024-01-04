import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { IRemote } from '../../models/remote'
import { Ref } from '../lib/ref'
import { forceUnwrap } from '../../lib/fatal-error'
import { UpstreamRemoteName } from '../../lib/stores'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IUpstreamAlreadyExistsProps {
  readonly repository: Repository
  readonly existingRemote: IRemote

  readonly onDismissed: () => void

  /** Called when the user chooses to update the existing remote. */
  readonly onUpdate: (repository: Repository) => void

  /** Called when the user chooses to ignore the warning. */
  readonly onIgnore: (repository: Repository) => void
}

/**
 * The dialog shown when a repository is a fork but its upstream remote doesn't
 * point to the parent repository.
 */
export class UpstreamAlreadyExists extends React.Component<IUpstreamAlreadyExistsProps> {
  public render() {
    const name = this.props.repository.name
    const gitHubRepository = forceUnwrap(
      '储存库需要存在于 GitHub 上，才能添加上游远程',
      this.props.repository.gitHubRepository
    )
    const parent = forceUnwrap(
      '储存库需要有一个复刻父储存库，才能添加上游远程',
      gitHubRepository.parent
    )
    const parentName = parent.fullName
    const existingURL = this.props.existingRemote.url
    const replacementURL = parent.cloneURL
    return (
      <Dialog
        title={__DARWIN__ ? '上游已存在' : '上游已存在'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onUpdate}
        type="warning"
      >
        <DialogContent>
          <p>
            储存库 <Ref>{name}</Ref> 是 <Ref>{parentName}</Ref> 的复刻，但其{' '}
            <Ref>{UpstreamRemoteName}</Ref> 上游远程却已经指向了其他储存库。
          </p>
          <ul>
            <li>
              当前上游: <Ref>{existingURL}</Ref>
            </li>
            <li>
              复刻来源: <Ref>{replacementURL}</Ref>
            </li>
          </ul>
          <p>您想把该储存库的上游改为复刻来源吗？</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText="更新上游"
            cancelButtonText="忽略"
            onCancelButtonClick={this.onIgnore}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onUpdate = () => {
    this.props.onUpdate(this.props.repository)
    this.props.onDismissed()
  }

  private onIgnore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    this.props.onIgnore(this.props.repository)
    this.props.onDismissed()
  }
}
