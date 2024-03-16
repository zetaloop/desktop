import React from 'react'
import { getAheadBehind, revSymmetricDifference } from '../../../lib/git'
import { determineMergeability } from '../../../lib/git/merge-tree'
import { promiseWithMinimumTimeout } from '../../../lib/promise'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { MergeTreeResult } from '../../../models/merge'
import { MultiCommitOperationKind } from '../../../models/multi-commit-operation'
import { PopupType } from '../../../models/popup'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import {
  ChooseBranchDialog,
  IBaseChooseBranchDialogProps,
  canStartOperation,
} from './base-choose-branch-dialog'
import { truncateWithEllipsis } from '../../../lib/truncate-with-ellipsis'

interface IMergeChooseBranchDialogState {
  readonly commitCount: number
  readonly mergeStatus: MergeTreeResult | null
  readonly selectedBranch: Branch | null
}

export class MergeChooseBranchDialog extends React.Component<
  IBaseChooseBranchDialogProps,
  IMergeChooseBranchDialogState
> {
  public constructor(props: IBaseChooseBranchDialogProps) {
    super(props)

    this.state = {
      selectedBranch: null,
      commitCount: 0,
      mergeStatus: null,
    }
  }

  private start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch, mergeStatus } = this.state
    const { operation, dispatcher, repository } = this.props
    if (!selectedBranch) {
      return
    }

    dispatcher.mergeBranch(
      repository,
      selectedBranch,
      mergeStatus,
      operation === MultiCommitOperationKind.Squash
    )

    dispatcher.closePopup(PopupType.MultiCommitOperation)
  }

  private canStart = (): boolean => {
    const { currentBranch } = this.props
    const { selectedBranch, commitCount, mergeStatus } = this.state

    return canStartOperation(
      selectedBranch,
      currentBranch,
      commitCount,
      mergeStatus?.kind
    )
  }

  private onSelectionChanged = (selectedBranch: Branch | null) => {
    this.setState({ selectedBranch })

    if (selectedBranch === null) {
      this.setState({ commitCount: 0, mergeStatus: null })
      return
    }

    this.updateStatus(selectedBranch)
  }

  private getDialogTitle = () => {
    const truncatedName = truncateWithEllipsis(
      this.props.currentBranch.name,
      40
    )
    const squashPrefix =
      this.props.operation === MultiCommitOperationKind.Squash ? '压缩' : null
    return (
      <>
        {squashPrefix}合并到 <strong>{truncatedName}</strong>
      </>
    )
  }

  private updateStatus = async (branch: Branch) => {
    const { currentBranch, repository } = this.props
    this.setState({
      commitCount: 0,
      mergeStatus: { kind: ComputedAction.Loading },
    })

    const mergeStatus = await promiseWithMinimumTimeout(
      () => determineMergeability(repository, currentBranch, branch),
      500
    ).catch<MergeTreeResult>(e => {
      log.error('Failed determining mergeability', e)
      return { kind: ComputedAction.Clean }
    })

    // The user has selected a different branch since we started, so don't
    // update the preview with stale data.
    if (this.state.selectedBranch !== branch) {
      return
    }

    // Can't go forward if the merge status is invalid, no need to check commit count
    if (mergeStatus.kind === ComputedAction.Invalid) {
      this.setState({ mergeStatus })
      return
    }

    // Commit count is used in the UI output as well as determining whether the
    // submit button is enabled
    const range = revSymmetricDifference('', branch.name)
    const aheadBehind = await getAheadBehind(this.props.repository, range)
    const commitCount = aheadBehind ? aheadBehind.behind : 0

    if (this.state.selectedBranch !== branch) {
      return
    }

    this.setState({ commitCount, mergeStatus })
  }

  private renderStatusPreviewMessage(): JSX.Element | null {
    const { mergeStatus, selectedBranch: branch } = this.state
    const { currentBranch } = this.props

    if (mergeStatus === null || branch === null) {
      return null
    }

    if (mergeStatus.kind === ComputedAction.Loading) {
      return this.renderLoadingMergeMessage()
    }

    if (mergeStatus.kind === ComputedAction.Clean) {
      return this.renderCleanMergeMessage(
        branch,
        currentBranch,
        this.state.commitCount
      )
    }

    if (mergeStatus.kind === ComputedAction.Invalid) {
      return this.renderInvalidMergeMessage()
    }

    return this.renderConflictedMergeMessage(
      branch,
      currentBranch,
      mergeStatus.conflictedFiles
    )
  }

  private renderLoadingMergeMessage() {
    return <>正在自动检查合并可行性...</>
  }

  private renderCleanMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    commitCount: number
  ) {
    if (commitCount === 0) {
      return (
        <React.Fragment>
          {`该分支已与 `}
          <strong>{branch.name}</strong>
          {` 保持同步`}
        </React.Fragment>
      )
    }

    const pluralized = commitCount === 1 ? '个提交' : '个提交'
    return (
      <React.Fragment>
        从 <strong>{branch.name}</strong> 合并
        <strong>{` ${commitCount} ${pluralized}`}</strong>到{' '}
        <strong>{currentBranch.name}</strong>
      </React.Fragment>
    )
  }

  private renderInvalidMergeMessage() {
    return (
      <React.Fragment>
        无法合并从不相关的历史记录，它们没有任何一条共同的历史提交
      </React.Fragment>
    )
  }

  private renderConflictedMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    count: number
  ) {
    const pluralized = count === 1 ? '文件' : '文件'
    return (
      <React.Fragment>
        从 <strong>{branch.name}</strong> 合并到{' '}
        <strong>{currentBranch.name}</strong> 时有{' '}
        <strong>{` ${count} 个${pluralized}产生冲突`}</strong>
      </React.Fragment>
    )
  }

  private renderStatusPreview() {
    return (
      <>
        <ActionStatusIcon
          status={this.state.mergeStatus}
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
        onSelectionChanged={this.onSelectionChanged}
      >
        {this.renderStatusPreview()}
      </ChooseBranchDialog>
    )
  }
}
