import { Branch } from '../models/branch'
import {
  ChooseBranchStep,
  conflictSteps,
  MultiCommitOperationStepKind,
} from '../models/multi-commit-operation'
import { TipState } from '../models/tip'
import { IMultiCommitOperationState, IRepositoryState } from './app-state'

/**
 * Setup the multi commit operation state when the user needs to select a branch as the
 * base for the operation.
 */
export function getMultiCommitOperationChooseBranchStep(
  state: IRepositoryState,
  initialBranch?: Branch | null
): ChooseBranchStep {
  const { defaultBranch, allBranches, recentBranches, tip } =
    state.branchesState
  let currentBranch: Branch | null = null

  if (tip.kind === TipState.Valid) {
    currentBranch = tip.branch
  } else {
    throw new Error('无法启动多提交操作，分支顶端状态无效')
  }

  return {
    kind: MultiCommitOperationStepKind.ChooseBranch,
    defaultBranch,
    currentBranch,
    allBranches,
    recentBranches,
    initialBranch: initialBranch !== null ? initialBranch : undefined,
  }
}

export function isConflictsFlow(
  isMultiCommitOperationPopupOpen: boolean,
  multiCommitOperationState: IMultiCommitOperationState | null
): boolean {
  return (
    isMultiCommitOperationPopupOpen &&
    multiCommitOperationState !== null &&
    conflictSteps.includes(multiCommitOperationState.step.kind)
  )
}
