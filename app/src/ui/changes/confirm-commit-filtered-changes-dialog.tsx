import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'

interface IConfirmCommitFilteredChangesProps {
  readonly onCommitAnyway: () => void
  readonly onDismissed: () => void
  readonly onClearFilter: () => void
  readonly setConfirmCommitFilteredChanges: (value: boolean) => void
}

interface IConfirmCommitFilteredChangesState {
  readonly showAgain: boolean
}

export class ConfirmCommitFilteredChanges extends React.Component<
  IConfirmCommitFilteredChangesProps,
  IConfirmCommitFilteredChangesState
> {
  public render() {
    return (
      <Dialog
        id="hidden-changes"
        type="warning"
        title={
          __DARWIN__ ? 'Commit Filtered Changes?' : 'Commit filtered changes?'
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="confirm-commit-filtered-changes-message"
      >
        <DialogContent>
          <Row id="confirm-commit-filtered-changes-message">
            Are you sure you want to commit this changes? You have a filter
            applied and some the changes you are about to commit are hidden from
            view.{' '}
            <LinkButton onClick={this.props.onClearFilter}>
              Clear Filter
            </LinkButton>
          </Row>
          <Row>
            <Checkbox
              label="Do not show this message again"
              value={
                this.state.showAgain ? CheckboxValue.Off : CheckboxValue.On
              }
              onChange={this.onShowMessageChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? 'Commit Anyway' : 'Commit anyway'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onShowMessageChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = !event.currentTarget.checked

    this.setState({ showAgain: value })
  }

  private onSubmit = async () => {
    this.props.setConfirmCommitFilteredChanges(this.state.showAgain)
    this.props.onCommitAnyway()
    this.props.onDismissed()
  }
}
