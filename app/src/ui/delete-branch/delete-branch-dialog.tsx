import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IDeleteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly existsOnRemote: boolean
  readonly onDismissed: () => void
  readonly onDeleted: (repository: Repository) => void
}

interface IDeleteBranchState {
  readonly includeRemoteBranch: boolean
  readonly isDeleting: boolean
}

export class DeleteBranch extends React.Component<
  IDeleteBranchProps,
  IDeleteBranchState
> {
  public constructor(props: IDeleteBranchProps) {
    super(props)

    this.state = {
      includeRemoteBranch: false,
      isDeleting: false,
    }
  }

  public render() {
    return (
      <Dialog
        id="delete-branch"
        title={__DARWIN__ ? '删除分支' : '删除分支'}
        type="warning"
        onSubmit={this.deleteBranch}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-branch-confirmation-message delete-branch-confirmation-message-remote"
      >
        <DialogContent>
          <div id="delete-branch-confirmation-message">
            <p>
              确定要删除分支 <Ref>{this.props.branch.name}</Ref> 吗？
            </p>
            <p>该操作不可逆。</p>

            {this.renderDeleteOnRemote()}
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="删除" />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderDeleteOnRemote() {
    if (this.props.branch.upstreamRemoteName && this.props.existsOnRemote) {
      return (
        <div>
          <p id="delete-branch-confirmation-message-remote">
            <strong>该分支也存在于远程仓库，一并删除吗？</strong>
          </p>
          <Checkbox
            label="删除远程分支"
            value={
              this.state.includeRemoteBranch
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onIncludeRemoteChanged}
          />
        </div>
      )
    }

    return null
  }

  private onIncludeRemoteChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ includeRemoteBranch: value })
  }

  private deleteBranch = async () => {
    const { dispatcher, repository, branch } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteLocalBranch(
      repository,
      branch,
      this.state.includeRemoteBranch
    )
    this.props.onDeleted(repository)

    this.props.onDismissed()
  }
}
