import * as React from 'react'
import { GitHubRepository } from '../../models/github-repository'
import {
  RepoRulesMetadataFailure,
  RepoRulesMetadataFailures,
} from '../../models/repo-rules'
import { RepoRulesetsForBranchLink } from './repo-rulesets-for-branch-link'
import { RepoRulesetLink } from './repo-ruleset-link'

interface IRepoRulesMetadataFailureListProps {
  readonly repository: GitHubRepository
  readonly branch: string
  readonly failures: RepoRulesMetadataFailures

  /**
   * Text that will come before the standard text, should be the name of the rule
   * that's being checked. For example, "The email in your global Git config" or
   * "This commit message".
   */
  readonly leadingText: string | JSX.Element
}

/**
 * Returns a standard message for failed repo metadata rules.
 */
export class RepoRulesMetadataFailureList extends React.Component<IRepoRulesMetadataFailureListProps> {
  public render() {
    const { repository, branch, failures, leadingText } = this.props

    const totalFails = failures.failed.length + failures.bypassed.length
    let endText: string
    if (failures.status === 'bypass') {
      endText = `，其中${
        totalFails === 1 ? '一条' : '一些'
      }允许绕过，请谨慎操作！`
    } else {
      endText = '.'
    }

    const rulesText = __DARWIN__ ? '规则' : '规则'

    return (
      <div className="repo-rules-failure-list-component">
        <p>
          {leadingText}违反了{totalFails}条规则{totalFails > 1 ? '' : ''}
          {endText}
          <RepoRulesetsForBranchLink repository={repository} branch={branch}>
            查看此分支的所有规则集。
          </RepoRulesetsForBranchLink>
        </p>
        {failures.failed.length > 0 && (
          <div className="repo-rule-list">
            <strong>违反{rulesText}：</strong>
            {this.renderRuleFailureList(failures.failed)}
          </div>
        )}
        {failures.bypassed.length > 0 && (
          <div className="repo-rule-list">
            <strong>绕过{rulesText}：</strong>
            {this.renderRuleFailureList(failures.bypassed)}
          </div>
        )}
      </div>
    )
  }

  private renderRuleFailureList(failures: RepoRulesMetadataFailure[]) {
    return (
      <ul>
        {failures.map(f => (
          <li key={`${f.description}-${f.rulesetId}`}>
            <RepoRulesetLink
              repository={this.props.repository}
              rulesetId={f.rulesetId}
            >
              {f.description}
            </RepoRulesetLink>
          </li>
        ))}
      </ul>
    )
  }
}
