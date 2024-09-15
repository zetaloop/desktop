import * as React from 'react'
import { GitHubRepository } from '../../models/github-repository'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from '../dialog'
import { RepoRulesetsForBranchLink } from './repo-rulesets-for-branch-link'

interface IRepoRulesBypassConfirmationProps {
  readonly repository: GitHubRepository
  readonly branch: string
  readonly onConfirm: () => void
  readonly onDismissed: () => void
}

/**
 * Returns a LinkButton to the webpage for the ruleset with the
 * provided ID within the provided repo.
 */
export class RepoRulesBypassConfirmation extends React.Component<
  IRepoRulesBypassConfirmationProps,
  {}
> {
  public render() {
    return (
      <Dialog
        id="repo-rules-bypass-confirmation"
        title={__DARWIN__ ? '绕过仓库规则' : '绕过仓库规则'}
        onSubmit={this.submit}
        onDismissed={this.props.onDismissed}
        type="warning"
      >
        <DialogContent>
          本次提交将绕过{' '}
          <RepoRulesetsForBranchLink
            repository={this.props.repository}
            branch={this.props.branch}
          >
            若干仓库规则
          </RepoRulesetsForBranchLink>
          。确定要继续吗？
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? '绕过仓库规则' : '绕过仓库规则'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private submit = () => {
    this.props.onConfirm()
    this.props.onDismissed()
  }
}
