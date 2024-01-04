import * as React from 'react'
import { UncommittedChangesStrategy } from '../../models/uncommitted-changes-strategy'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { RadioGroup } from '../lib/radio-group'
import { assertNever } from '../../lib/fatal-error'
import { enableFilteredChangesList } from '../../lib/feature-flag'

interface IPromptsPreferencesProps {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmDiscardStash: boolean
  readonly confirmCheckoutCommit: boolean
  readonly confirmForcePush: boolean
  readonly confirmUndoCommit: boolean
  readonly askForConfirmationOnCommitFilteredChanges: boolean
  readonly showCommitLengthWarning: boolean
  readonly uncommittedChangesStrategy: UncommittedChangesStrategy
  readonly onConfirmDiscardChangesChanged: (checked: boolean) => void
  readonly onConfirmDiscardChangesPermanentlyChanged: (checked: boolean) => void
  readonly onConfirmDiscardStashChanged: (checked: boolean) => void
  readonly onConfirmCheckoutCommitChanged: (checked: boolean) => void
  readonly onConfirmRepositoryRemovalChanged: (checked: boolean) => void
  readonly onConfirmForcePushChanged: (checked: boolean) => void
  readonly onConfirmUndoCommitChanged: (checked: boolean) => void
  readonly onShowCommitLengthWarningChanged: (checked: boolean) => void
  readonly onUncommittedChangesStrategyChanged: (
    value: UncommittedChangesStrategy
  ) => void
  readonly onAskForConfirmationOnCommitFilteredChanges: (value: boolean) => void
}

interface IPromptsPreferencesState {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmDiscardStash: boolean
  readonly confirmCheckoutCommit: boolean
  readonly confirmForcePush: boolean
  readonly confirmUndoCommit: boolean
  readonly askForConfirmationOnCommitFilteredChanges: boolean
  readonly uncommittedChangesStrategy: UncommittedChangesStrategy
}

export class Prompts extends React.Component<
  IPromptsPreferencesProps,
  IPromptsPreferencesState
> {
  public constructor(props: IPromptsPreferencesProps) {
    super(props)

    this.state = {
      confirmRepositoryRemoval: this.props.confirmRepositoryRemoval,
      confirmDiscardChanges: this.props.confirmDiscardChanges,
      confirmDiscardChangesPermanently:
        this.props.confirmDiscardChangesPermanently,
      confirmDiscardStash: this.props.confirmDiscardStash,
      confirmCheckoutCommit: this.props.confirmCheckoutCommit,
      confirmForcePush: this.props.confirmForcePush,
      confirmUndoCommit: this.props.confirmUndoCommit,
      uncommittedChangesStrategy: this.props.uncommittedChangesStrategy,
      askForConfirmationOnCommitFilteredChanges:
        this.props.askForConfirmationOnCommitFilteredChanges,
    }
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
    this.props.onConfirmDiscardChangesChanged(value)
  }

  private onConfirmDiscardChangesPermanentlyChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChangesPermanently: value })
    this.props.onConfirmDiscardChangesPermanentlyChanged(value)
  }

  private onConfirmDiscardStashChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardStash: value })
    this.props.onConfirmDiscardStashChanged(value)
  }

  private onConfirmCheckoutCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmCheckoutCommit: value })
    this.props.onConfirmCheckoutCommitChanged(value)
  }

  private onConfirmForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmForcePush: value })
    this.props.onConfirmForcePushChanged(value)
  }

  private onConfirmUndoCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmUndoCommit: value })
    this.props.onConfirmUndoCommitChanged(value)
  }

  private onAskForConfirmationOnCommitFilteredChanges = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ askForConfirmationOnCommitFilteredChanges: value })
    this.props.onAskForConfirmationOnCommitFilteredChanges(value)
  }

  private onConfirmRepositoryRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmRepositoryRemoval: value })
    this.props.onConfirmRepositoryRemovalChanged(value)
  }

  private onUncommittedChangesStrategyChanged = (
    value: UncommittedChangesStrategy
  ) => {
    this.setState({ uncommittedChangesStrategy: value })
    this.props.onUncommittedChangesStrategyChanged(value)
  }

  private onShowCommitLengthWarningChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onShowCommitLengthWarningChanged(event.currentTarget.checked)
  }

  private renderSwitchBranchOptionLabel = (key: UncommittedChangesStrategy) => {
    switch (key) {
      case UncommittedChangesStrategy.AskForConfirmation:
        return '询问怎么办'
      case UncommittedChangesStrategy.MoveToNewBranch:
        return '将改动带去新的分支'
      case UncommittedChangesStrategy.StashOnCurrentBranch:
        return '将改动暂存在当前分支'
      default:
        return assertNever(key, `Unknown uncommitted changes strategy: ${key}`)
    }
  }

  private renderSwitchBranchOptions = () => {
    const options = [
      UncommittedChangesStrategy.AskForConfirmation,
      UncommittedChangesStrategy.MoveToNewBranch,
      UncommittedChangesStrategy.StashOnCurrentBranch,
    ]

    const selectedKey =
      options.find(o => o === this.state.uncommittedChangesStrategy) ??
      UncommittedChangesStrategy.AskForConfirmation

    return (
      <div className="advanced-section">
        <h2 id="switch-branch-heading">有未提交的改动时切换分支...</h2>

        <RadioGroup<UncommittedChangesStrategy>
          ariaLabelledBy="switch-branch-heading"
          selectedKey={selectedKey}
          radioButtonKeys={options}
          onSelectionChanged={this.onUncommittedChangesStrategyChanged}
          renderRadioButtonLabelContents={this.renderSwitchBranchOptionLabel}
        />
      </div>
    )
  }

  private renderCommittingFilteredChangesPrompt = () => {
    if (!enableFilteredChangesList()) {
      return
    }

    return (
      <Checkbox
        label="Committing changes hidden by filter"
        value={
          this.state.askForConfirmationOnCommitFilteredChanges
            ? CheckboxValue.On
            : CheckboxValue.Off
        }
        onChange={this.onAskForConfirmationOnCommitFilteredChanges}
      />
    )
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2 id="show-confirm-dialog-heading">显示确认提示...</h2>
          <div role="group" aria-labelledby="show-confirm-dialog-heading">
            <Checkbox
              label="删除仓库"
              value={
                this.state.confirmRepositoryRemoval
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmRepositoryRemovalChanged}
            />
            <Checkbox
              label="放弃改动"
              value={
                this.state.confirmDiscardChanges
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmDiscardChangesChanged}
            />
            <Checkbox
              label="永久放弃改动"
              value={
                this.state.confirmDiscardChangesPermanently
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmDiscardChangesPermanentlyChanged}
            />
            <Checkbox
              label="放弃暂存区"
              value={
                this.state.confirmDiscardStash
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmDiscardStashChanged}
            />
            <Checkbox
              label="检出提交"
              value={
                this.state.confirmCheckoutCommit
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmCheckoutCommitChanged}
            />
            <Checkbox
              label="强制推送"
              value={
                this.state.confirmForcePush
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmForcePushChanged}
            />
            <Checkbox
              label="撤回提交"
              value={
                this.state.confirmUndoCommit
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmUndoCommitChanged}
            />
            {this.renderCommittingFilteredChangesPrompt()}
          </div>
        </div>
        {this.renderSwitchBranchOptions()}
        <div className="advanced-section">
          <h2>提交长度</h2>
          <Checkbox
            label="显示提交长度警告"
            value={
              this.props.showCommitLengthWarning
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onShowCommitLengthWarningChanged}
          />
        </div>
      </DialogContent>
    )
  }
}
