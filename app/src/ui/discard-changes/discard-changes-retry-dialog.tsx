import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Dispatcher } from '../dispatcher'
import { TrashNameLabel } from '../lib/context-menu'
import { RetryAction } from '../../models/retry-actions'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IDiscardChangesRetryDialogProps {
  readonly dispatcher: Dispatcher
  readonly retryAction: RetryAction
  readonly onDismissed: () => void
  readonly onConfirmDiscardChangesChanged: (optOut: boolean) => void
}

interface IDiscardChangesRetryDialogState {
  readonly retrying: boolean
  readonly confirmDiscardChanges: boolean
}

export class DiscardChangesRetryDialog extends React.Component<
  IDiscardChangesRetryDialogProps,
  IDiscardChangesRetryDialogState
> {
  public constructor(props: IDiscardChangesRetryDialogProps) {
    super(props)
    this.state = { retrying: false, confirmDiscardChanges: true }
  }

  public render() {
    const { retrying } = this.state

    return (
      <Dialog
        title={__DARWIN__ ? '放弃改动无法恢复' : '放弃改动无法恢复'}
        id="discard-changes-retry"
        loading={retrying}
        disabled={retrying}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
      >
        <DialogContent>
          <p>无法放弃改动，文件放不进{TrashNameLabel}。</p>
          <div>
            通常原因如下：
            <ul>
              <li>{TrashNameLabel}被设置为立刻删除文件。</li>
              <li>没有文件移动权限。</li>
            </ul>
          </div>
          <p>这些改动将会无法从{TrashNameLabel}恢复。</p>
          {this.renderConfirmDiscardChanges()}
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderConfirmDiscardChanges() {
    return (
      <Checkbox
        label="不再显示"
        value={
          this.state.confirmDiscardChanges
            ? CheckboxValue.Off
            : CheckboxValue.On
        }
        onChange={this.onConfirmDiscardChangesChanged}
      />
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={__DARWIN__ ? '永久删除' : '永久删除'}
          okButtonTitle={`文件会被永久删除，这些改动将无法恢复。`}
          cancelButtonText="取消"
          destructive={true}
        />
      </DialogFooter>
    )
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
  }

  private onSubmit = async () => {
    const { dispatcher, retryAction } = this.props

    this.setState({ retrying: true })

    await dispatcher.performRetry(retryAction)

    this.props.onConfirmDiscardChangesChanged(this.state.confirmDiscardChanges)
    this.props.onDismissed()
  }
}
