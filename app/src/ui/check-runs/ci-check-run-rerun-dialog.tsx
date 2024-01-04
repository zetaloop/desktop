import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { IRefCheck } from '../../lib/ci-checks/ci-checks'
import { CICheckRunList } from './ci-check-run-list'
import { GitHubRepository } from '../../models/github-repository'
import { Dispatcher } from '../dispatcher'
import {
  APICheckConclusion,
  APICheckStatus,
  IAPICheckSuite,
} from '../../lib/api'
import { Octicon } from '../octicons'
import * as octicons from './../octicons/octicons.generated'
import { encodePathAsUrl } from '../../lib/path'
import { offsetFromNow } from '../../lib/offset-from'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface ICICheckRunRerunDialogProps {
  readonly dispatcher: Dispatcher
  readonly repository: GitHubRepository

  /** List of all the check runs (some of which are not rerunnable) */
  readonly checkRuns: ReadonlyArray<IRefCheck>

  /** The git reference of the pr */
  readonly prRef: string

  /** Whether to only rerun failed checks */
  readonly failedOnly: boolean

  readonly onDismissed: () => void
}

interface ICICheckRunRerunDialogState {
  readonly loadingCheckSuites: boolean
  readonly loadingRerun: boolean
  readonly rerunnable: ReadonlyArray<IRefCheck>
  readonly nonRerunnable: ReadonlyArray<IRefCheck>
}

/**
 * Dialog that informs the user of which jobs will be rerun
 */
export class CICheckRunRerunDialog extends React.Component<
  ICICheckRunRerunDialogProps,
  ICICheckRunRerunDialogState
> {
  public constructor(props: ICICheckRunRerunDialogProps) {
    super(props)
    this.state = {
      loadingCheckSuites: true,
      loadingRerun: false,
      rerunnable: [],
      nonRerunnable: [],
    }
    this.determineRerunnability()
  }

  private onSubmit = async () => {
    const { dispatcher, repository, prRef } = this.props
    this.setState({ loadingRerun: true })
    await dispatcher.rerequestCheckSuites(
      repository,
      this.state.rerunnable,
      this.props.failedOnly
    )
    await dispatcher.manualRefreshSubscription(
      repository,
      prRef,
      this.state.rerunnable
    )
    dispatcher.incrementMetric('rerunsChecks')
    this.props.onDismissed()
  }

  private determineRerunnability = async () => {
    const checkRunsToConsider = this.props.failedOnly
      ? this.props.checkRuns.filter(
          cr => cr.conclusion === APICheckConclusion.Failure
        )
      : this.props.checkRuns

    // Get unique set of check suite ids
    const checkSuiteIds = new Set(
      checkRunsToConsider.map(cr => cr.checkSuiteId)
    )

    const checkSuitesPromises = new Array<Promise<IAPICheckSuite | null>>()

    for (const id of checkSuiteIds) {
      if (id === null) {
        continue
      }
      checkSuitesPromises.push(
        this.props.dispatcher.fetchCheckSuite(this.props.repository, id)
      )
    }

    const rerequestableCheckSuiteIds: number[] = []
    for (const cs of await Promise.all(checkSuitesPromises)) {
      if (cs === null) {
        continue
      }

      const createdAt = Date.parse(cs.created_at)
      if (
        cs.rerequestable &&
        createdAt > offsetFromNow(-30, 'days') && // Must be less than a month old
        cs.status === APICheckStatus.Completed // Must be completed
      ) {
        rerequestableCheckSuiteIds.push(cs.id)
      }
    }

    const rerunnable = checkRunsToConsider.filter(
      cr =>
        cr.checkSuiteId !== null &&
        rerequestableCheckSuiteIds.includes(cr.checkSuiteId)
    )
    const nonRerunnable = checkRunsToConsider.filter(
      cr =>
        cr.checkSuiteId === null ||
        !rerequestableCheckSuiteIds.includes(cr.checkSuiteId)
    )

    this.setState({ loadingCheckSuites: false, rerunnable, nonRerunnable })
  }

  private renderRerunnableJobsList = () => {
    if (this.state.rerunnable.length === 0) {
      return null
    }

    return (
      <div className="ci-check-run-list check-run-rerun-list">
        <CICheckRunList
          checkRuns={this.state.rerunnable}
          notExpandable={true}
          isCondensedView={true}
        />
      </div>
    )
  }

  private renderRerunDependentsMessage = () => {
    if (this.state.rerunnable.length === 0) {
      return null
    }

    const name =
      this.props.checkRuns.length === 1 ? (
        <strong> {this.props.checkRuns[0].name}</strong>
      ) : (
        '这些工作流'
      )
    const dependentAdj = this.props.checkRuns.length === 1 ? '其' : '其'

    return (
      <div className="re-run-dependents-message">
        即将重新运行{name}，包括{dependentAdj}所有依赖项：
      </div>
    )
  }

  private renderRerunWarning = () => {
    if (
      this.state.loadingCheckSuites ||
      this.state.nonRerunnable.length === 0
    ) {
      return null
    }

    const pluralize = `检查${this.state.nonRerunnable.length !== 1 ? '' : ''}`
    const verb = this.state.nonRerunnable.length !== 1 ? '' : ''
    const warningPrefix =
      this.state.rerunnable.length === 0
        ? `已经没有${this.props.failedOnly ? '未通过的' : ''}检查可以重新运行了`
        : `有${verb} ${this.state.nonRerunnable.length}个${
            this.props.failedOnly ? '未通过的' : ''
          }${pluralize}无法重新运行`
    return (
      <div className="non-re-run-info warning-helper-text">
        <Octicon symbol={octicons.alert} />

        {`${warningPrefix}。如果一个检查已经过去超过一个月、相关的检查和依赖项还没完成，或者设为不允许重启，那么它就不能被重新运行了。`}
      </div>
    )
  }

  public getTitle = (showDescriptor: boolean = true) => {
    const { checkRuns, failedOnly } = this.props
    const s = checkRuns.length === 1 ? '' : ''
    const c = __DARWIN__ ? '' : ''

    let descriptor = ''
    if (showDescriptor && checkRuns.length === 1) {
      descriptor = __DARWIN__ ? '单个' : '单个'
    }

    if (showDescriptor && failedOnly) {
      descriptor = __DARWIN__ ? '未通过的' : '未通过的'
    }

    return `重新运行${descriptor}${c}检查${s}`
  }

  private renderDialogContent = () => {
    if (this.state.loadingCheckSuites && this.props.checkRuns.length > 1) {
      return (
        <div className="loading-rerun-checks">
          <img src={BlankSlateImage} className="blankslate-image" alt="" />
          <div className="title">请稍候</div>
          <div className="call-to-action">正在确定哪些检查可以重新运行。</div>
        </div>
      )
    }

    return (
      <>
        {this.renderRerunDependentsMessage()}
        {this.renderRerunnableJobsList()}
        {this.renderRerunWarning()}
      </>
    )
  }

  public render() {
    return (
      <Dialog
        id="rerun-check-runs"
        title={this.getTitle()}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        loading={this.state.loadingCheckSuites || this.state.loadingRerun}
      >
        <DialogContent>{this.renderDialogContent()}</DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={this.getTitle(false)}
            okButtonDisabled={this.state.rerunnable.length === 0}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}
