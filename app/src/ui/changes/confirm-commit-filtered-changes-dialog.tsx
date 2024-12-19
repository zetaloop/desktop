import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IConfirmCommitFilteredChangesProps {
  readonly onCommitAnyway: () => void
  readonly onDismissed: () => void
  readonly onClearFilter: () => void
  readonly setConfirmCommitFilteredChanges: (value: boolean) => void
}

interface IConfirmCommitFilteredChangesState {
  readonly askForConfirmationOnCommitFilteredChanges: boolean
}

export class ConfirmCommitFilteredChanges extends React.Component<
  IConfirmCommitFilteredChangesProps,
  IConfirmCommitFilteredChangesState
> {
  public constructor(props: IConfirmCommitFilteredChangesProps) {
    super(props)

    this.state = {
      askForConfirmationOnCommitFilteredChanges: true,
    }
  }

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
          <p id="confirm-commit-filtered-changes-message">
            You have a filter applied. There are changes that will be committed
            hidden from view. Are you sure you want to commit these changes?
          </p>
          <Row>
            <Checkbox
              label="Do not show this message again"
              value={
                this.state.askForConfirmationOnCommitFilteredChanges
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onShowMessageChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? 'Commit Anyway' : 'Commit anyway'}
            cancelButtonText={
              __DARWIN__ ? 'Cancel and Clear Filter' : 'Cancel and clear filter'
            }
            onCancelButtonClick={this.onClearFilter}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onShowMessageChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnCommitFilteredChanges: value })
  }

  private onClearFilter = () => {
    this.props.onClearFilter()
    this.props.onDismissed()
  }

  private onSubmit = () => {
    this.props.setConfirmCommitFilteredChanges(
      this.state.askForConfirmationOnCommitFilteredChanges
    )
    this.props.onCommitAnyway()
    this.props.onDismissed()
  }
}
