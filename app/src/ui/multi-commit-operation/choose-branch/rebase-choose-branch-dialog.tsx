import React from 'react'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { RebasePreview } from '../../../models/rebase'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import { updateRebasePreview } from '../../lib/update-branch'
import {
  ChooseBranchDialog,
  IBaseChooseBranchDialogProps,
  canStartOperation,
} from './base-choose-branch-dialog'
import { truncateWithEllipsis } from '../../../lib/truncate-with-ellipsis'

interface IRebaseChooseBranchDialogState {
  readonly rebasePreview: RebasePreview | null
  readonly selectedBranch: Branch | null
}

export class RebaseChooseBranchDialog extends React.Component<
  IBaseChooseBranchDialogProps,
  IRebaseChooseBranchDialogState
> {
  public constructor(props: IBaseChooseBranchDialogProps) {
    super(props)

    this.state = {
      selectedBranch: null,
      rebasePreview: null,
    }
  }

  private start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch, rebasePreview } = this.state
    const { repository, currentBranch, dispatcher } = this.props

    // Just type checking here, this shouldn't be possible
    if (
      selectedBranch === null ||
      rebasePreview === null ||
      rebasePreview.kind !== ComputedAction.Clean
    ) {
      return
    }

    dispatcher.startRebase(
      repository,
      selectedBranch,
      currentBranch,
      rebasePreview.commits
    )
  }

  private canStart = (): boolean => {
    const { currentBranch } = this.props
    const { selectedBranch, rebasePreview } = this.state
    const commitCount =
      rebasePreview?.kind === ComputedAction.Clean
        ? rebasePreview.commits.length
        : undefined
    return canStartOperation(
      selectedBranch,
      currentBranch,
      commitCount,
      rebasePreview?.kind
    )
  }

  private onSelectionChanged = (selectedBranch: Branch | null) => {
    this.setState({ selectedBranch })

    if (selectedBranch === null) {
      this.setState({ rebasePreview: null })
      return
    }

    this.updateStatus(selectedBranch)
  }

  private getSubmitButtonToolTip = () => {
    const { currentBranch } = this.props
    const { selectedBranch, rebasePreview } = this.state

    const selectedBranchIsCurrentBranch =
      selectedBranch !== null &&
      currentBranch !== null &&
      selectedBranch.name === currentBranch.name

    const areCommitsToRebase =
      rebasePreview?.kind === ComputedAction.Clean
        ? rebasePreview.commits.length > 0
        : false

    return selectedBranchIsCurrentBranch
      ? '无法将该分支重构在自己身上。'
      : !areCommitsToRebase
      ? '当前分支没有提交可以重构。'
      : undefined
  }

  private getDialogTitle = () => {
    const truncatedName = truncateWithEllipsis(
      this.props.currentBranch.name,
      40
    )
    return (
      <>
        重构 <strong>{truncatedName}</strong>
      </>
    )
  }

  private updateStatus = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.setState({ rebasePreview })
    })
  }

  private renderStatusPreviewMessage(): JSX.Element | null {
    const { rebasePreview, selectedBranch: baseBranch } = this.state
    if (rebasePreview == null || baseBranch == null) {
      return null
    }

    const { currentBranch } = this.props

    if (rebasePreview.kind === ComputedAction.Loading) {
      return this.renderLoadingRebaseMessage()
    }
    if (rebasePreview.kind === ComputedAction.Clean) {
      return this.renderCleanRebaseMessage(
        currentBranch,
        baseBranch,
        rebasePreview.commits.length
      )
    }

    if (rebasePreview.kind === ComputedAction.Invalid) {
      return this.renderInvalidRebaseMessage()
    }

    return null
  }

  private renderLoadingRebaseMessage() {
    return <>正在自动检查重构可行性…</>
  }

  private renderInvalidRebaseMessage() {
    return <>无法启动重构，请检查选择的分支是否有效。</>
  }

  private renderCleanRebaseMessage(
    currentBranch: Branch,
    baseBranch: Branch,
    commitsToRebase: number
  ) {
    if (commitsToRebase <= 0) {
      return (
        <>
          该分支已与 <strong>{currentBranch.name}</strong> 保持同步
        </>
      )
    }

    const pluralized = commitsToRebase === 1 ? '个提交' : '个提交'
    return (
      <>
        把 <strong>{currentBranch.name}</strong> 所做的{' '}
        <strong>{`${commitsToRebase}${pluralized}`}</strong> 以{' '}
        <strong>{baseBranch.name}</strong> 为基础重新构造
      </>
    )
  }

  private renderStatusPreview() {
    return (
      <>
        <ActionStatusIcon
          status={this.state.rebasePreview}
          classNamePrefix="merge-status"
        />
        <p className="merge-info" id="merge-status-preview">
          {this.renderStatusPreviewMessage()}
        </p>
      </>
    )
  }

  public render() {
    return (
      <ChooseBranchDialog
        {...this.props}
        start={this.start}
        selectedBranch={this.state.selectedBranch}
        canStartOperation={this.canStart()}
        dialogTitle={this.getDialogTitle()}
        submitButtonTooltip={this.getSubmitButtonToolTip()}
        onSelectionChanged={this.onSelectionChanged}
      >
        {this.renderStatusPreview()}
      </ChooseBranchDialog>
    )
  }
}
