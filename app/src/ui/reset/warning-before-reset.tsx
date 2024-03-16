import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'

interface IWarningBeforeResetProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly commit: Commit
  readonly onDismissed: () => void
}

interface IWarningBeforeResetState {
  readonly isLoading: boolean
}

/**
 * Dialog that alerts user that there are uncommitted changes in the working
 * directory where they are gonna be resetting to a previous commit.
 */
export class WarningBeforeReset extends React.Component<
  IWarningBeforeResetProps,
  IWarningBeforeResetState
> {
  public constructor(props: IWarningBeforeResetProps) {
    super(props)
    this.state = { isLoading: false }
  }

  public render() {
    const title = __DARWIN__ ? '重置到提交' : '重置到提交'

    return (
      <Dialog
        id="warning-before-reset"
        type="warning"
        title={title}
        loading={this.state.isLoading}
        disabled={this.state.isLoading}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="reset-warning-message"
      >
        <DialogContent>
          <Row id="reset-warning-message">
            当前仍有进行中的改动，重置到一个更早的提交可能会导致这些改动丢失。仍要继续吗？
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="继续" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    const { dispatcher, repository, commit, onDismissed } = this.props
    this.setState({ isLoading: true })

    try {
      await dispatcher.resetToCommit(repository, commit, false)
    } finally {
      this.setState({ isLoading: false })
    }

    onDismissed()
  }
}
