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
        拉取请求列表里显示的是针对 <strong>{targetRepository.fullName}</strong>{' '}
        的拉取请求。
      </li>
      <li>
        议题将会创建在 <strong>{targetRepository.fullName}</strong> 里。
      </li>
      <li>
        "打开 GitHub" 将会打开的是 <strong>{targetRepository.fullName}</strong>{' '}
        的地址。
      </li>
      <li>
        新建分支将会基于 <strong>{targetRepository.fullName}</strong>{' '}
        的默认分支。
      </li>
      <li>
        用户和议题的自动补全将会来自{' '}
        <strong>{targetRepository.fullName}</strong> 的信息。
      </li>
    </ul>
  )
}
