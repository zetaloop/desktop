import * as React from 'react'
import { ForkContributionTarget } from '../../models/workflow-preferences'
import { RepositoryWithForkedGitHubRepository } from '../../models/repository'

interface IForkSettingsDescription {
  readonly repository: RepositoryWithForkedGitHubRepository
  readonly forkContributionTarget: ForkContributionTarget
}

export function ForkSettingsDescription(props: IForkSettingsDescription) {
  // We can't use the getNonForkGitHubRepository() helper since we need to calculate
  // the value based on the temporary form state.
  const targetRepository =
    props.forkContributionTarget === ForkContributionTarget.Self
      ? props.repository.gitHubRepository
      : props.repository.gitHubRepository.parent

  return (
    <ul className="fork-settings-description">
      <li>
        显示 <strong>{targetRepository.fullName}</strong> 的拉取请求。
      </li>
      <li>
        创建 <strong>{targetRepository.fullName}</strong> 的议题。
      </li>
      <li>
        打开 <strong>{targetRepository.fullName}</strong> 的 GitHub 地址。
      </li>
      <li>
        基于 <strong>{targetRepository.fullName}</strong> 的默认分支来新建分支。
      </li>
      <li>
        使用 <strong>{targetRepository.fullName}</strong> 的用户和议题信息。
      </li>
    </ul>
  )
}
