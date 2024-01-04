import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'

interface IGenerateCommitMessageOverrideWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly filesSelected: ReadonlyArray<WorkingDirectoryFileChange>

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

export class GenerateCommitMessageOverrideWarning extends React.Component<IGenerateCommitMessageOverrideWarningProps> {
  public constructor(props: IGenerateCommitMessageOverrideWarningProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        title="覆盖提交消息"
        id="generate-commit-message-override-warning"
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onOverride}
        ariaDescribedBy="generate-commit-message-override-warning-body"
        role="alertdialog"
      >
        <DialogContent>
          <p id="generate-commit-message-override-warning-body">
            用 AI 生成的提交消息覆盖现有内容。
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="确认覆盖" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onOverride = async () => {
    this.props.dispatcher.generateCommitMessage(
      this.props.repository,
      this.props.filesSelected
    )
    this.props.onDismissed()
  }
}
