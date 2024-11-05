import { IMenuItem } from '../../lib/menu-item'
import { PullRequest } from '../../models/pull-request'

interface IBranchContextMenuConfig {
  pr: PullRequest | null
  onViewPullRequestOnGitHub?: () => void
}

export function generatePullRequestContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const { pr, onViewPullRequestOnGitHub } = config
  const items = new Array<IMenuItem>()

  if (onViewPullRequestOnGitHub !== undefined && pr !== null) {
    items.push({
      label: 'View Pull Request on GitHub',
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  return items
}
