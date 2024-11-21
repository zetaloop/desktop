import * as React from 'react'

import { Branch } from '../../models/branch'

import { IBranchListItem } from './group-branches'
import { BranchListItem } from './branch-list-item'
import { IMatches } from '../../lib/fuzzy-find'
import { getRelativeTimeInfoFromDate } from '../relative-time'

export function renderDefaultBranch(
  item: IBranchListItem,
  matches: IMatches,
  currentBranch: Branch | null,
  authorDate: Date | undefined,
  onDropOntoBranch?: (branchName: string) => void,
  onDropOntoCurrentBranch?: () => void
): JSX.Element {
  const branch = item.branch
  const currentBranchName = currentBranch ? currentBranch.name : null
  return (
    <BranchListItem
      name={branch.name}
      isCurrentBranch={branch.name === currentBranchName}
      authorDate={authorDate}
      matches={matches}
      onDropOntoBranch={onDropOntoBranch}
      onDropOntoCurrentBranch={onDropOntoCurrentBranch}
    />
  )
}

export function getDefaultAriaLabelForBranch(item: IBranchListItem): string {
  const branch = item.branch

  // TODO! look up through cache
  const date: Date | null = null

  if (!date) {
    return branch.name
  }

  const { relativeText } = getRelativeTimeInfoFromDate(date, true)
  return `${item.branch.name} ${relativeText}`
}
