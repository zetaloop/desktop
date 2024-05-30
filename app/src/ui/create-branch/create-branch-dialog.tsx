import * as React from 'react'

import {
  Repository,
  isRepositoryWithGitHubRepository,
} from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Branch, StartPoint } from '../../models/branch'
import { Row } from '../lib/row'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import {
  VerticalSegmentedControl,
  ISegmentedItem,
} from '../lib/vertical-segmented-control'
import {
  TipState,
  IUnbornRepository,
  IDetachedHead,
  IValidBranch,
} from '../../models/tip'
import { assertNever } from '../../lib/fatal-error'
import { renderBranchNameExistsOnRemoteWarning } from '../lib/branch-name-warnings'
import { getStartPoint } from '../../lib/create-branch'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { startTimer } from '../lib/timing'
import { GitHubRepository } from '../../models/github-repository'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { CommitOneLine } from '../../models/commit'
import { PopupType } from '../../models/popup'
import { RepositorySettingsTab } from '../repository-settings/repository-settings'
import { isRepositoryWithForkedGitHubRepository } from '../../models/repository'
import { API, APIRepoRuleType, IAPIRepoRuleset } from '../../lib/api'
import { Account } from '../../models/account'
import { getAccountForRepository } from '../../lib/get-account-for-repository'
import { InputError } from '../lib/input-description/input-error'
import { InputWarning } from '../lib/input-description/input-warning'
import { parseRepoRules, useRepoRulesLogic } from '../../lib/helpers/repo-rules'

interface ICreateBranchProps {
  readonly repository: Repository
  readonly targetCommit?: CommitOneLine
  readonly upstreamGitHubRepository: GitHubRepository | null
  readonly accounts: ReadonlyArray<Account>
  readonly cachedRepoRulesets: ReadonlyMap<number, IAPIRepoRuleset>
  readonly dispatcher: Dispatcher
  readonly onBranchCreatedFromCommit?: () => void
  readonly onDismissed: () => void
  /**
   * If provided, the branch creation is handled by the given method.
   *
   * It is also responsible for dismissing the popup.
   */
  readonly createBranch?: (
    name: string,
    startPoint: string | null,
    noTrack: boolean
  ) => void
  readonly tip: IUnbornRepository | IDetachedHead | IValidBranch
  readonly defaultBranch: Branch | null
  readonly upstreamDefaultBranch: Branch | null
  readonly allBranches: ReadonlyArray<Branch>
  readonly initialName: string
  /**
   * If provided, use as the okButtonText
   */
  readonly okButtonText?: string

  /**
   * If provided, use as the header
   */
  readonly headerText?: string
}

interface ICreateBranchState {
  readonly currentError: { error: Error; isWarning: boolean } | null
  readonly branchName: string
  readonly startPoint: StartPoint

  /**
   * Whether or not the dialog is currently creating a branch. This affects
   * the dialog loading state as well as the rendering of the branch selector.
   *
   * When the dialog is creating a branch we take the tip and defaultBranch
   * as they were in props at the time of creation and stick them in state
   * so that we can maintain the layout of the branch selection parts even
   * as the Tip changes during creation.
   *
   * Note: once branch creation has been initiated this value stays at true
   * and will never revert to being false. If the branch creation operation
   * fails this dialog will still be dismissed and an error dialog will be
   * shown in its place.
   */
  readonly isCreatingBranch: boolean

  /**
   * The tip of the current repository, captured from props at the start
   * of the create branch operation.
   */
  readonly tipAtCreateStart: IUnbornRepository | IDetachedHead | IValidBranch

  /**
   * The default branch of the current repository, captured from props at the
   * start of the create branch operation.
   */
  readonly defaultBranchAtCreateStart: Branch | null
}

/** The Create Branch component. */
export class CreateBranch extends React.Component<
  ICreateBranchProps,
  ICreateBranchState
> {
  private branchRulesDebounceId: number | null = null

  private readonly ERRORS_ID = 'branch-name-errors'

  public constructor(props: ICreateBranchProps) {
    super(props)

    const startPoint = getStartPoint(props, StartPoint.UpstreamDefaultBranch)

    this.state = {
      currentError: null,
      branchName: props.initialName,
      startPoint,
      isCreatingBranch: false,
      tipAtCreateStart: props.tip,
      defaultBranchAtCreateStart: getBranchForStartPoint(startPoint, props),
    }
  }

  public componentWillReceiveProps(nextProps: ICreateBranchProps) {
    this.setState({
      startPoint: getStartPoint(nextProps, this.state.startPoint),
    })

    if (!this.state.isCreatingBranch) {
      const defaultStartPoint = getStartPoint(
        nextProps,
        StartPoint.UpstreamDefaultBranch
      )

      this.setState({
        tipAtCreateStart: nextProps.tip,
        defaultBranchAtCreateStart: getBranchForStartPoint(
          defaultStartPoint,
          nextProps
        ),
      })
    }

    if (nextProps.initialName.length > 0) {
      this.checkBranchRules(nextProps.initialName)
    }
  }

  public componentWillUnmount() {
    if (this.branchRulesDebounceId !== null) {
      window.clearTimeout(this.branchRulesDebounceId)
    }
  }

  private renderBranchSelection() {
    const tip = this.state.isCreatingBranch
      ? this.state.tipAtCreateStart
      : this.props.tip

    const tipKind = tip.kind
    const targetCommit = this.props.targetCommit

    if (targetCommit !== undefined) {
      return (
        <p>
          新的分支将会基于 '{targetCommit.summary}' (
          {targetCommit.sha.substring(0, 7)}) 提交。
        </p>
      )
    } else if (tip.kind === TipState.Detached) {
      return (
        <p>
          当前未检出任何特定分支，HEAD
          指针为游离状态，新的分支将会基于当前检出的 '
          {tip.currentSha.substring(0, 7)}' 提交。
        </p>
      )
    } else if (tip.kind === TipState.Unborn) {
      return (
        <p>当前分支未初始化，不包含任何提交。新建分支就只会重命名当前分支。</p>
      )
    } else if (tip.kind === TipState.Valid) {
      if (
        this.props.upstreamGitHubRepository !== null &&
        this.props.upstreamDefaultBranch !== null
      ) {
        return this.renderForkBranchSelection(
          tip.branch.name,
          this.props.upstreamDefaultBranch,
          this.props.upstreamGitHubRepository.fullName
        )
      }

      const defaultBranch = this.state.isCreatingBranch
        ? this.props.defaultBranch
        : this.state.defaultBranchAtCreateStart

      return this.renderRegularBranchSelection(tip.branch.name, defaultBranch)
    } else {
      return assertNever(tip, `Unknown tip kind ${tipKind}`)
    }
  }

  private renderBranchNameErrors() {
    const { currentError } = this.state
    if (!currentError) {
      return null
    }

    if (currentError.isWarning) {
      return (
        <Row>
          <InputWarning
            id={this.ERRORS_ID}
            trackedUserInput={this.state.branchName}
          >
            {currentError.error.message}
          </InputWarning>
        </Row>
      )
    } else {
      return (
        <Row>
          <InputError
            id={this.ERRORS_ID}
            trackedUserInput={this.state.branchName}
          >
            {currentError.error.message}
          </InputError>
        </Row>
      )
    }
  }

  private onBaseBranchChanged = (startPoint: StartPoint) => {
    this.setState({
      startPoint,
    })
  }

  public render() {
    const disabled =
      this.state.branchName.length <= 0 ||
      (!!this.state.currentError && !this.state.currentError.isWarning) ||
      /^\s*$/.test(this.state.branchName)
    const hasError = !!this.state.currentError

    return (
      <Dialog
        id="create-branch"
        title={this.getHeaderText()}
        onSubmit={this.createBranch}
        onDismissed={this.props.onDismissed}
        loading={this.state.isCreatingBranch}
        disabled={this.state.isCreatingBranch}
      >
        <DialogContent>
          <RefNameTextBox
            label="名称"
            ariaDescribedBy={hasError ? this.ERRORS_ID : undefined}
            initialValue={this.props.initialName}
            onValueChange={this.onBranchNameChange}
          />

          {this.renderBranchNameErrors()}

          {renderBranchNameExistsOnRemoteWarning(
            this.state.branchName,
            this.props.allBranches
          )}

          {this.renderBranchSelection()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={this.getOkButtonText()}
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private getHeaderText = (): string => {
    if (this.props.headerText !== undefined) {
      return this.props.headerText
    }

    return __DARWIN__ ? '创建分支' : '创建分支'
  }

  private getOkButtonText = (): string => {
    if (this.props.okButtonText !== undefined) {
      return this.props.okButtonText
    }

    return __DARWIN__ ? '创建分支' : '创建分支'
  }

  private onBranchNameChange = (name: string) => {
    this.updateBranchName(name)
  }

  private async updateBranchName(branchName: string) {
    this.setState({ branchName })

    const alreadyExists =
      this.props.allBranches.findIndex(b => b.name === branchName) > -1

    const currentError = alreadyExists
      ? {
          error: new Error(`已存在同名分支 ${branchName}。`),
          isWarning: false,
        }
      : null

    if (!currentError) {
      if (this.branchRulesDebounceId !== null) {
        window.clearTimeout(this.branchRulesDebounceId)
      }

      this.branchRulesDebounceId = window.setTimeout(
        this.checkBranchRules,
        500,
        branchName
      )
    }

    this.setState({
      branchName,
      currentError,
    })
  }

  /**
   * Checks repo rules to see if the provided branch name is valid for the
   * current user and repository. The "get all rules for a branch" endpoint
   * is called first, and if a "creation" or "branch name" rule is found,
   * then those rulesets are checked to see if the current user can bypass
   * them.
   */
  private checkBranchRules = async (branchName: string) => {
    if (
      this.state.branchName !== branchName ||
      this.props.accounts.length === 0 ||
      !isRepositoryWithGitHubRepository(this.props.repository) ||
      branchName === '' ||
      this.state.currentError !== null
    ) {
      return
    }

    const account = getAccountForRepository(
      this.props.accounts,
      this.props.repository
    )

    if (
      account === null ||
      !useRepoRulesLogic(account, this.props.repository)
    ) {
      return
    }

    const api = API.fromAccount(account)
    const branchRules = await api.fetchRepoRulesForBranch(
      this.props.repository.gitHubRepository.owner.login,
      this.props.repository.gitHubRepository.name,
      branchName
    )

    // Make sure user branch name hasn't changed during api call
    if (this.state.branchName !== branchName) {
      return
    }

    // filter the rules to only the relevant ones and get their IDs. use a Set to dedupe.
    const toCheck = new Set(
      branchRules
        .filter(
          r =>
            r.type === APIRepoRuleType.Creation ||
            r.type === APIRepoRuleType.BranchNamePattern
        )
        .map(r => r.ruleset_id)
    )

    // there are no relevant rules for this branch name, so return
    if (toCheck.size === 0) {
      return
    }

    // check for actual failures
    const { branchNamePatterns, creationRestricted } = await parseRepoRules(
      branchRules,
      this.props.cachedRepoRulesets,
      this.props.repository
    )

    // Make sure user branch name hasn't changed during parsing of repo rules
    // (async due to a config retrieval of users with commit signing repo rules)
    if (this.state.branchName !== branchName) {
      return
    }

    const { status } = branchNamePatterns.getFailedRules(branchName)

    // Only possible kind of failures is branch name pattern failures and creation restriction
    if (creationRestricted !== true && status === 'pass') {
      return
    }

    // check cached rulesets to see which ones the user can bypass
    let cannotBypass = false
    for (const id of toCheck) {
      const rs = this.props.cachedRepoRulesets.get(id)

      if (rs?.current_user_can_bypass !== 'always') {
        // the user cannot bypass, so stop checking
        cannotBypass = true
        break
      }
    }

    if (cannotBypass) {
      this.setState({
        currentError: {
          error: new Error(`分支名称 '${branchName}' 违反储存库规则。`),
          isWarning: false,
        },
      })
    } else {
      this.setState({
        currentError: {
          error: new Error(
            `分支名称 '${branchName}' 违反储存库规则，但是规则允许绕过，请谨慎操作！`
          ),
          isWarning: true,
        },
      })
    }
  }

  private createBranch = async () => {
    const name = this.state.branchName

    let startPoint: string | null = null
    let noTrack = false

    const { defaultBranch, upstreamDefaultBranch, repository } = this.props

    if (this.props.targetCommit !== undefined) {
      startPoint = this.props.targetCommit.sha
    } else if (this.state.startPoint === StartPoint.DefaultBranch) {
      // This really shouldn't happen, we take all kinds of precautions
      // to make sure the startPoint state is valid given the current props.
      if (!defaultBranch) {
        this.setState({
          currentError: {
            error: new Error('无法确定默认分支。'),
            isWarning: false,
          },
        })
        return
      }

      startPoint = defaultBranch.name
    } else if (this.state.startPoint === StartPoint.UpstreamDefaultBranch) {
      // This really shouldn't happen, we take all kinds of precautions
      // to make sure the startPoint state is valid given the current props.
      if (!upstreamDefaultBranch) {
        this.setState({
          currentError: {
            error: new Error('无法确定默认分支。'),
            isWarning: false,
          },
        })
        return
      }

      startPoint = upstreamDefaultBranch.name
      noTrack = true
    }

    if (name.length > 0) {
      this.setState({ isCreatingBranch: true })

      // If createBranch is provided, use it instead of dispatcher
      if (this.props.createBranch !== undefined) {
        this.props.createBranch(name, startPoint, noTrack)
        return
      }

      const timer = startTimer('create branch', repository)
      const branch = await this.props.dispatcher.createBranch(
        repository,
        name,
        startPoint,
        noTrack
      )
      timer.done()
      this.props.onDismissed()

      // If the operation was successful and the branch was created from a
      // commit, invoke the callback.
      if (
        branch !== undefined &&
        this.props.targetCommit !== undefined &&
        this.props.onBranchCreatedFromCommit !== undefined
      ) {
        this.props.onBranchCreatedFromCommit()
      }
    }
  }

  /**
   * Render options for a non-fork repository
   *
   * Gives user the option to make a new branch from
   * the default branch.
   */
  private renderRegularBranchSelection(
    currentBranchName: string,
    defaultBranch: Branch | null
  ) {
    if (defaultBranch === null || defaultBranch.name === currentBranchName) {
      return (
        <div>
          {this.renderForkLinkSuffix()}新的分支将会基于当前检出的{' '}
          <Ref>{currentBranchName}</Ref> 分支。
          {defaultBranch?.name === currentBranchName && (
            <>
              <Ref>{currentBranchName}</Ref> 是储存库的 {defaultBranchLink}。
            </>
          )}
        </div>
      )
    } else {
      const items = [
        {
          title: defaultBranch.name,
          description: '储存库默认分支。开始制作一些新的东西。',
          key: StartPoint.DefaultBranch,
        },
        {
          title: currentBranchName,
          description: '当前检出的分支。在此基础上进一步开发。',
          key: StartPoint.CurrentBranch,
        },
      ]

      const selectedValue =
        this.state.startPoint === StartPoint.DefaultBranch
          ? this.state.startPoint
          : StartPoint.CurrentBranch

      return (
        <div>
          {this.renderOptions(items, selectedValue)}
          {this.renderForkLink()}
        </div>
      )
    }
  }

  /**
   * Render options if we're in a fork
   *
   * Gives user the option to make a new branch from
   * the upstream default branch.
   */
  private renderForkBranchSelection(
    currentBranchName: string,
    upstreamDefaultBranch: Branch,
    upstreamRepositoryFullName: string
  ) {
    // we assume here that the upstream and this
    // fork will have the same default branch name
    if (currentBranchName === upstreamDefaultBranch.nameWithoutRemote) {
      return (
        <div>
          {this.renderForkLinkSuffix()}新的分支将会基于{' '}
          <strong>{upstreamRepositoryFullName}</strong> 的 {defaultBranchLink} '
          <Ref>{upstreamDefaultBranch.nameWithoutRemote}</Ref>'。
        </div>
      )
    } else {
      const items = [
        {
          title: upstreamDefaultBranch.name,
          description: '上游的默认分支。开始制作一些新的东西。',
          key: StartPoint.UpstreamDefaultBranch,
        },
        {
          title: currentBranchName,
          description: '当前检出的分支。在此基础上进一步开发。',
          key: StartPoint.CurrentBranch,
        },
      ]

      const selectedValue =
        this.state.startPoint === StartPoint.UpstreamDefaultBranch
          ? this.state.startPoint
          : StartPoint.CurrentBranch
      return (
        <div>
          {this.renderOptions(items, selectedValue)}
          {this.renderForkLink()}
        </div>
      )
    }
  }

  private renderForkLink = () => {
    if (isRepositoryWithForkedGitHubRepository(this.props.repository)) {
      return (
        <div className="secondary-text">
          默认起始分支由储存库的{' '}
          <LinkButton onClick={this.onForkSettingsClick}>
            复刻行为设置
          </LinkButton>{' '}
          决定。
        </div>
      )
    } else {
      return
    }
  }

  private renderForkLinkSuffix = () => {
    if (isRepositoryWithForkedGitHubRepository(this.props.repository)) {
      return (
        <span>
          根据储存库的{' '}
          <LinkButton onClick={this.onForkSettingsClick}>
            复刻行为设置
          </LinkButton>
          ，
        </span>
      )
    } else {
      return
    }
  }

  /** Shared method for rendering two choices in this component */
  private renderOptions = (
    items: ReadonlyArray<ISegmentedItem<StartPoint>>,
    selectedValue: StartPoint
  ) => (
    <Row>
      <VerticalSegmentedControl
        label="起始分支"
        items={items}
        selectedKey={selectedValue}
        onSelectionChanged={this.onBaseBranchChanged}
      />
    </Row>
  )

  private onForkSettingsClick = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.RepositorySettings,
      repository: this.props.repository,
      initialSelectedTab: RepositorySettingsTab.ForkSettings,
    })
  }
}

/** Reusable snippet */
const defaultBranchLink = (
  <LinkButton uri="https://docs.github.com/zh/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/changing-the-default-branch">
    默认分支
  </LinkButton>
)

/** Given some branches and a start point, return the proper branch */
function getBranchForStartPoint(
  startPoint: StartPoint,
  branchInfo: {
    readonly defaultBranch: Branch | null
    readonly upstreamDefaultBranch: Branch | null
  }
) {
  return startPoint === StartPoint.UpstreamDefaultBranch
    ? branchInfo.upstreamDefaultBranch
    : startPoint === StartPoint.DefaultBranch
    ? branchInfo.defaultBranch
    : null
}
