import * as React from 'react'

import { Dispatcher } from '../dispatcher'

import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { PullRequest } from '../../models/pull-request'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IDeleteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly pullRequest: PullRequest
  readonly onDismissed: () => void
}

export class DeletePullRequest extends React.Component<IDeleteBranchProps, {}> {
  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={__DARWIN__ ? '删除分支' : '删除分支'}
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.deleteBranch}
      >
        <DialogContent>
          <p>注意该分支所关联的拉取请求尚未关闭。</p>
          <p>
            如果{' '}
            <LinkButton onClick={this.openPullRequest}>
              #{this.props.pullRequest.pullRequestNumber}
            </LinkButton>{' '}
            已被合并，您可前往 GitHub 删除远程分支。
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="删除" />
        </DialogFooter>
      </Dialog>
    )
  }

  private openPullRequest = () => {
    this.props.dispatcher.showPullRequest(this.props.repository)
  }

  private deleteBranch = () => {
    this.props.dispatcher.deleteLocalBranch(
      this.props.repository,
      this.props.branch
    )

    return this.props.onDismissed()
  }
}
