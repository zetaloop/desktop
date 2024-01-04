import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'

interface IWarnLocalChangesBeforeUndoProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly commit: Commit
  readonly isWorkingDirectoryClean: boolean
  readonly confirmUndoCommit: boolean
  readonly onDismissed: () => void
}

interface IWarnLocalChangesBeforeUndoState {
  readonly isLoading: boolean
  readonly confirmUndoCommit: boolean
}

/**
 * Dialog that alerts user that there are uncommitted changes in the working
 * directory where they are gonna be undoing a commit.
 */
export class WarnLocalChangesBeforeUndo extends React.Component<
  IWarnLocalChangesBeforeUndoProps,
  IWarnLocalChangesBeforeUndoState
> {
  public constructor(props: IWarnLocalChangesBeforeUndoProps) {
    super(props)
    this.state = {
      isLoading: false,
      confirmUndoCommit: props.confirmUndoCommit,
    }
  }

  public render() {
    const title = __DARWIN__ ? '撤回提交' : '撤回提交'

    return (
      <Dialog
        id="warn-local-changes-before-undo"
        type="warning"
        title={title}
        loading={this.state.isLoading}
        disabled={this.state.isLoading}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="undo-warning-message"
      >
        {this.getWarningDialog()}
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="继续" />
        </DialogFooter>
      </Dialog>
    )
  }

  private getWarningDialog() {
    if (this.props.commit.isMergeCommit) {
      return this.getMergeCommitWarningDialog()
    }
    return (
      <DialogContent>
        <Row id="undo-warning-message">
          当前仍有未提交的改动，撤回提交可能导致这些改动丢失。确定要继续吗？
        </Row>
        <Row>
          <Checkbox
            label="不再显示"
            value={
              this.state.confirmUndoCommit
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onConfirmUndoCommitChanged}
          />
        </Row>
      </DialogContent>
    )
  }

  private getMergeCommitWarningDialog() {
    if (this.props.isWorkingDirectoryClean) {
      return (
        <DialogContent>
          <p>{this.getMergeCommitUndoWarningText()}</p>
          <p>确定要继续吗？</p>
        </DialogContent>
      )
    }
    return (
      <DialogContent>
        <p>当前仍有未提交的改动，撤回提交可能导致这些改动丢失。</p>
        <p>{this.getMergeCommitUndoWarningText()}</p>
        <p>确定要继续吗？</p>
      </DialogContent>
    )
  }

  private getMergeCommitUndoWarningText() {
    return `撤销一个合并提交将会撤销所有合并的内容，把他重新提交回来将会创建一个全新的提交。也就是说，虽然文件会回来，但是它们合并过来的提交记录都会消失。`
  }

  private onSubmit = async () => {
    const { dispatcher, repository, commit, onDismissed } = this.props
    this.setState({ isLoading: true })

    try {
      dispatcher.setConfirmUndoCommitSetting(this.state.confirmUndoCommit)
      await dispatcher.undoCommit(repository, commit, false)
    } finally {
      this.setState({ isLoading: false })
    }

    onDismissed()
  }

  private onConfirmUndoCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmUndoCommit: value })
  }
}
