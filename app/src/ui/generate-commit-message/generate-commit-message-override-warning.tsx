import * as React from 'react'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../lib/row'

interface IGenerateCommitMessageOverrideWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly filesSelected: ReadonlyArray<WorkingDirectoryFileChange>

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IGenerateCommitMessageOverrideWarningState {
  readonly confirmCommitMessageOverride: boolean
}

export class GenerateCommitMessageOverrideWarning extends React.Component<
  IGenerateCommitMessageOverrideWarningProps,
  IGenerateCommitMessageOverrideWarningState
> {
  public constructor(props: IGenerateCommitMessageOverrideWarningProps) {
    super(props)

    this.state = {
      confirmCommitMessageOverride: true,
    }
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
          <Row id="generate-commit-message-override-warning-body">
            用 AI 生成的提交消息覆盖现有内容。
          </Row>
          <Row>
            <Checkbox
              label="Do not show this message again"
              value={
                this.state.confirmCommitMessageOverride
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onConfirmCommitMessageOverrideChanged}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="确认覆盖" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmCommitMessageOverrideChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked
    this.setState({ confirmCommitMessageOverride: value })
  }

  private onOverride = async () => {
    if (!this.state.confirmCommitMessageOverride) {
      await this.props.dispatcher.setConfirmCommitMessageOverrideSetting(false)
    }

    this.props.dispatcher.generateCommitMessage(
      this.props.repository,
      this.props.filesSelected
    )
    this.props.onDismissed()
  }
}
