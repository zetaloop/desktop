import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DefaultDialogFooter,
} from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { RetryAction, RetryActionType } from '../../models/retry-actions'
import { Dispatcher } from '../dispatcher'
import { PathText } from '../lib/path-text'
import { assertNever } from '../../lib/fatal-error'

interface ILocalChangesOverwrittenDialogProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  /**
   * Whether there's already a stash entry for the local branch.
   */
  readonly hasExistingStash: boolean
  /**
   * The action that should get executed if the user selects "Stash and Continue".
   */
  readonly retryAction: RetryAction
  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void

  /**
   * The files that prevented the operation from completing, i.e. the files
   * that would be overwritten.
   */
  readonly files: ReadonlyArray<string>
}
interface ILocalChangesOverwrittenDialogState {
  readonly stashing: boolean
}

export class LocalChangesOverwrittenDialog extends React.Component<
  ILocalChangesOverwrittenDialogProps,
  ILocalChangesOverwrittenDialogState
> {
  public constructor(props: ILocalChangesOverwrittenDialogProps) {
    super(props)
    this.state = { stashing: false }
  }

  public render() {
    const overwrittenText =
      this.props.files.length > 0 ? '以下文件将会被覆盖：' : null

    return (
      <Dialog
        title="错误"
        id="local-changes-overwritten"
        loading={this.state.stashing}
        disabled={this.state.stashing}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
        role="alertdialog"
        ariaDescribedBy="local-changes-error-description"
      >
        <DialogContent>
          <div id="local-changes-error-description">
            <p>
              无法{this.getRetryActionName()}，因为当前分支有改动还没提交。
              {overwrittenText}
            </p>
            {this.renderFiles()}
            {this.renderStashText()}
          </div>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFiles() {
    const { files } = this.props
    if (files.length === 0) {
      return null
    }

    return (
      <div className="files-list">
        <ul>
          {files.map(fileName => (
            <li key={fileName}>
              <PathText path={fileName} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  private renderStashText() {
    if (this.props.hasExistingStash && !this.state.stashing) {
      return null
    }

    return <p>您可以先把改动暂存，之后再恢复。</p>
  }

  private renderFooter() {
    if (this.props.hasExistingStash && !this.state.stashing) {
      return <DefaultDialogFooter />
    }

    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={__DARWIN__ ? '暂存并继续' : '暂存并继续'}
          okButtonTitle="把当前未提交的改动保存到一个暂存区，您可稍后恢复这些改动。"
          cancelButtonText="关闭"
        />
      </DialogFooter>
    )
  }

  private onSubmit = async () => {
    const { hasExistingStash, repository, dispatcher, retryAction } = this.props

    if (hasExistingStash) {
      // When there's an existing stash we don't let the user stash the changes
      // and we only show a "Close" button on the modal. In that case, the
      // "Close" button submits the dialog and should only dismiss it.
      this.props.onDismissed()
      return
    }

    this.setState({ stashing: true })

    // We know that there's no stash for the current branch so we can safely
    // tell createStashForCurrentBranch not to show a confirmation dialog which
    // would disrupt the async flow (since you can't await a dialog).
    const createdStash = await dispatcher.createStashForCurrentBranch(
      repository,
      false
    )

    this.props.onDismissed()

    if (createdStash) {
      await dispatcher.performRetry(retryAction)
    }
  }

  /**
   * Returns a user-friendly string to describe the current retryAction.
   */
  private getRetryActionName() {
    switch (this.props.retryAction.type) {
      case RetryActionType.Checkout:
        return '检出'
      case RetryActionType.Pull:
        return '拉取'
      case RetryActionType.Merge:
        return '合并'
      case RetryActionType.Rebase:
        return '重构'
      case RetryActionType.Clone:
        return '克隆'
      case RetryActionType.Fetch:
        return '获取更新'
      case RetryActionType.Push:
        return '推送'
      case RetryActionType.CherryPick:
      case RetryActionType.CreateBranchForCherryPick:
        return '摘取'
      case RetryActionType.Squash:
        return '压缩'
      case RetryActionType.Reorder:
        return '重排'
      case RetryActionType.DiscardChanges:
        return '放弃改动'
      default:
        assertNever(
          this.props.retryAction,
          `Unknown retryAction: ${this.props.retryAction}`
        )
    }
  }
}
