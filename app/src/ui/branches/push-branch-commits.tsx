import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Repository } from '../../models/repository'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IPushBranchCommitsProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly onConfirm: (repository: Repository, branch: Branch) => void
  readonly onDismissed: () => void

  /**
   * Used to show the number of commits a branch is ahead by.
   * If this value is undefined, component defaults to publish view.
   */
  readonly unPushedCommits?: number
}

interface IPushBranchCommitsState {
  /**
   * A value indicating whether we're currently working on publishing
   * or pushing the branch to the remote. This value is used to tell
   * the dialog to apply the loading and disabled state which adds a
   * spinner and disables form controls for the duration of the operation.
   */
  readonly isPushingOrPublishing: boolean
}

/**
 * Returns a string used for communicating the number of commits
 * that will be pushed to the user.
 *
 * @param numberOfCommits The number of commits that will be pushed
 * @param unit            A string written in such a way that without
 *                        modification it can be paired with the digit 1
 *                        such as 'commit' and which, when a 's' is appended
 *                        to it can be paired with a zero digit or a number
 *                        greater than one.
 */
function pluralize(numberOfCommits: number, unit: string) {
  return numberOfCommits === 1
    ? `${numberOfCommits}个${unit}`
    : `${numberOfCommits}个${unit}`
}

/**
 * Simple type guard which allows us to substitute the non-obvious
 * this.props.unPushedCommits === undefined checks with
 * renderPublishView(this.props.unPushedCommits).
 */
function renderPublishView(
  unPushedCommits: number | undefined
): unPushedCommits is undefined {
  return unPushedCommits === undefined
}

/**
 * This component gets shown if the user attempts to open a PR with
 * a) An un-published branch
 * b) A branch that is ahead of its base branch
 *
 * In both cases, this asks the user if they'd like to push/publish the branch.
 * If they confirm we push/publish then open the PR page on dotcom.
 */
export class PushBranchCommits extends React.Component<
  IPushBranchCommitsProps,
  IPushBranchCommitsState
> {
  public constructor(props: IPushBranchCommitsProps) {
    super(props)

    this.state = { isPushingOrPublishing: false }
  }

  public render() {
    return (
      <Dialog
        id="push-branch-commits"
        key="push-branch-commits"
        title={this.renderDialogTitle()}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        loading={this.state.isPushingOrPublishing}
        disabled={this.state.isPushingOrPublishing}
        role="alertdialog"
        ariaDescribedBy="push-branch-commits-title push-branch-commits-message"
      >
        {this.renderDialogContent()}

        <DialogFooter>{this.renderButtonGroup()}</DialogFooter>
      </Dialog>
    )
  }

  private renderDialogContent() {
    if (renderPublishView(this.props.unPushedCommits)) {
      return (
        <DialogContent>
          <p id="push-branch-commits-title">需要先发布分支才能打开拉取请求。</p>
          <p id="push-branch-commits-message">
            您要立刻发布 <Ref>{this.props.branch.name}</Ref>{' '}
            分支并打开拉取请求吗？
          </p>
        </DialogContent>
      )
    }

    const localCommits = pluralize(this.props.unPushedCommits, '本地提交')

    return (
      <DialogContent>
        <p id="push-branch-commits-title">您有{localCommits}尚未推送到远程。</p>
        <p id="push-branch-commits-message">
          在创建拉取请求前需要先把改动推送到 <Ref>{this.props.branch.name}</Ref>{' '}
          吗？
        </p>
      </DialogContent>
    )
  }

  private renderDialogTitle() {
    if (renderPublishView(this.props.unPushedCommits)) {
      return __DARWIN__ ? '发布分支？' : '发布分支？'
    }

    return __DARWIN__ ? `推送本地改动？` : `推送本地改动？`
  }

  private renderButtonGroup() {
    if (renderPublishView(this.props.unPushedCommits)) {
      return (
        <OkCancelButtonGroup
          okButtonText={__DARWIN__ ? '发布分支' : '发布分支'}
        />
      )
    }

    return (
      <OkCancelButtonGroup
        okButtonText={__DARWIN__ ? '推送提交' : '推送提交'}
        cancelButtonText={__DARWIN__ ? '直接创建' : '直接创建'}
        onCancelButtonClick={this.onCreateWithoutPushButtonClick}
      />
    )
  }

  private onCreateWithoutPushButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    this.props.onConfirm(this.props.repository, this.props.branch)
    this.props.onDismissed()
  }

  private onSubmit = async () => {
    const { repository, branch } = this.props

    this.setState({ isPushingOrPublishing: true })

    try {
      await this.props.dispatcher.push(repository)
    } finally {
      this.setState({ isPushingOrPublishing: false })
    }

    this.props.onConfirm(repository, branch)
    this.props.onDismissed()
  }
}
