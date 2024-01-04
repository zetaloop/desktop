import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { CommitOneLine } from '../../models/commit'

interface IConfirmCheckoutCommitProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly commit: CommitOneLine
  readonly askForConfirmationOnCheckoutCommit: boolean
  readonly onDismissed: () => void
}

interface IConfirmCheckoutCommitState {
  readonly isCheckingOut: boolean
  readonly confirmCheckoutCommit: boolean
}
/**
 * Dialog to confirm checking out a commit
 */
export class ConfirmCheckoutCommitDialog extends React.Component<
  IConfirmCheckoutCommitProps,
  IConfirmCheckoutCommitState
> {
  public constructor(props: IConfirmCheckoutCommitProps) {
    super(props)

    this.state = {
      isCheckingOut: false,
      confirmCheckoutCommit: props.askForConfirmationOnCheckoutCommit,
    }
  }

  public render() {
    const title = __DARWIN__ ? '检出该提交？' : '检出该提交？'

    return (
      <Dialog
        id="checkout-commit"
        type="warning"
        title={title}
        loading={this.state.isCheckingOut}
        disabled={this.state.isCheckingOut}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        ariaDescribedBy="checking-out-commit-confirmation"
        role="alertdialog"
      >
        <DialogContent>
          <Row id="checking-out-commit-confirmation">
            检出某个提交将会创建一个游离的 HEAD
            指针，不属于任何分支。确定要检出该提交吗？
          </Row>
          <Row>
            <Checkbox
              label="不再显示"
              value={
                this.state.confirmCheckoutCommit
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onaskForConfirmationOnCheckoutCommitChanged}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="检出" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onaskForConfirmationOnCheckoutCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmCheckoutCommit: value })
  }

  private onSubmit = async () => {
    const { dispatcher, repository, commit, onDismissed } = this.props

    this.setState({
      isCheckingOut: true,
    })

    try {
      dispatcher.setConfirmCheckoutCommitSetting(
        this.state.confirmCheckoutCommit
      )
      await dispatcher.checkoutCommit(repository, commit)
    } finally {
      this.setState({
        isCheckingOut: false,
      })
    }

    onDismissed()
  }
}
