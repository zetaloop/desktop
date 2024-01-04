import * as React from 'react'

import { Repository } from '../../models/repository'
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
import { IAPIRepoRuleset } from '../../lib/api'
import { Account } from '../../models/account'
import {
  IBranchRuleError,
  checkBranchNameRules,
  renderBranchNameRuleError,
} from '../lib/branch-name-rule-validation'

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
  readonly currentError: IBranchRuleError | null
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
          当前未跟踪任何分支，HEAD 指针分离，新的分支将会基于当前检出的 '
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

          {renderBranchNameRuleError(
            this.state.currentError,
            this.ERRORS_ID,
            this.state.branchName
          )}

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

  private checkBranchRules = async (branchName: string) => {
    if (
      this.state.branchName !== branchName ||
      branchName === '' ||
      this.state.currentError !== null
    ) {
      return
    }

    const result = await checkBranchNameRules(
      branchName,
      this.props.accounts,
      this.props.repository,
      this.props.cachedRepoRulesets
    )

    // Make sure user branch name hasn't changed during async calls
    if (this.state.branchName !== branchName) {
      return
    }

    if (result !== null) {
      this.setState({ currentError: result })
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
              <Ref>{currentBranchName}</Ref> 是仓库的 {defaultBranchLink}。
            </>
          )}
        </div>
      )
    } else {
      const items = [
        {
          title: defaultBranch.name,
          description: '仓库默认分支。开始制作一些新的东西。',
          key: StartPoint.DefaultBranch,
        },
        {
          title: currentBranchName,
          description: '当前检出分支。在此基础上进一步开发。',
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
          description: '上游默认分支。开始制作一些新的东西。',
          key: StartPoint.UpstreamDefaultBranch,
        },
        {
          title: currentBranchName,
          description: '当前检出分支。在此基础上进一步开发。',
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
          默认起始分支由仓库的{' '}
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
          根据仓库的{' '}
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
