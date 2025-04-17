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
import { LinkButton } from '../lib/link-button'

interface IGenerateCommitMessageDisclaimerProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly filesSelected: ReadonlyArray<WorkingDirectoryFileChange>

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

export class GenerateCommitMessageDisclaimer extends React.Component<IGenerateCommitMessageDisclaimerProps> {
  public constructor(props: IGenerateCommitMessageDisclaimerProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        title="GitHub Copilot"
        id="generate-commit-message-disclaimer"
        type="warning"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        ariaDescribedBy="generate-commit-message-disclaimer-body"
        role="alertdialog"
      >
        <DialogContent>
          <p id="generate-commit-message-disclaimer-body">
            Copilot 基于 AI 技术，它的回答未必正确无误，请核实确认后再使用。
            <LinkButton uri="https://docs.github.com/zh/copilot/responsible-use-of-github-copilot-features/responsible-use-of-github-copilot-in-github-desktop">
              点击了解如何在 GitHub Desktop 中规范使用 Copilot。
            </LinkButton>
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="我已知悉" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = async () => {
    this.props.dispatcher.updateCommitMessageGenerationDisclaimerLastSeen()
    this.props.dispatcher.generateCommitMessage(
      this.props.repository,
      this.props.filesSelected
    )
    this.props.onDismissed()
  }
}
