import * as React from 'react'
import { Dialog, DialogFooter } from '../dialog'
import { TabBar } from '../tab-bar'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Commit } from '../../models/commit'
import { CommitList } from './commit-list'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'

export enum UnreachableCommitsTab {
  Unreachable,
  Reachable,
}

interface IUnreachableCommitsDialogProps {
  /** The shas of the currently selected commits */
  readonly selectedShas: ReadonlyArray<string>

  /** The shas of the commits showed in the diff */
  readonly shasInDiff: ReadonlyArray<string>

  /** The commits loaded, keyed by their full SHA. */
  readonly commitLookup: Map<string, Commit>

  /** Used to set the selected tab. */
  readonly selectedTab: UnreachableCommitsTab

  /** The emoji lookup to render images inline */
  readonly emoji: Map<string, string>

  /** Called to dismiss the  */
  readonly onDismissed: () => void

  readonly accounts: ReadonlyArray<Account>
}

interface IUnreachableCommitsDialogState {
  /** The currently select tab. */
  readonly selectedTab: UnreachableCommitsTab

  /** The currently selected sha in the list */
  readonly selectedSHAs: ReadonlyArray<string>
}

/** The component for for viewing the unreachable commits in the current diff a repository. */
export class UnreachableCommitsDialog extends React.Component<
  IUnreachableCommitsDialogProps,
  IUnreachableCommitsDialogState
> {
  public constructor(props: IUnreachableCommitsDialogProps) {
    super(props)

    this.state = {
      selectedTab: props.selectedTab,
      selectedSHAs: [],
    }
  }

  public componentWillUpdate(nextProps: IUnreachableCommitsDialogProps) {
    const currentSelectedTab = this.props.selectedTab
    const selectedTab = nextProps.selectedTab

    if (currentSelectedTab !== selectedTab) {
      this.setState({ selectedTab })
    }
  }

  private onTabClicked = (selectedTab: UnreachableCommitsTab) => {
    this.setState({ selectedTab })
  }

  private getShasToDisplay = () => {
    const { selectedTab } = this.state
    const { shasInDiff, selectedShas } = this.props
    if (selectedTab === UnreachableCommitsTab.Reachable) {
      return shasInDiff
    }

    return selectedShas.filter(sha => !shasInDiff.includes(sha))
  }

  private onCommitsSelected = (
    commits: ReadonlyArray<Commit>,
    isContiguous: boolean
  ) => {
    this.setState({ selectedSHAs: commits.map(c => c.sha) })
  }

  private renderTabs() {
    return (
      <TabBar
        onTabClicked={this.onTabClicked}
        selectedIndex={this.state.selectedTab}
      >
        <span>不可及</span>
        <span>可及</span>
      </TabBar>
    )
  }

  private renderActiveTab() {
    const { commitLookup, emoji } = this.props

    return (
      <>
        {this.renderUnreachableCommitsMessage()}
        <div className="unreachable-commit-list">
          <CommitList
            gitHubRepository={null}
            isLocalRepository={true}
            commitLookup={commitLookup}
            commitSHAs={this.getShasToDisplay()}
            selectedSHAs={this.state.selectedSHAs}
            localCommitSHAs={[]}
            emoji={emoji}
            onCommitsSelected={this.onCommitsSelected}
            accounts={this.props.accounts}
          />
        </div>
      </>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup cancelButtonVisible={false} />
      </DialogFooter>
    )
  }

  private renderUnreachableCommitsMessage = () => {
    const count = this.getShasToDisplay().length
    const commitsPluralized = count > 1 ? '提交' : '提交'
    const pronounPluralized = count > 1 ? `它们` : `它`
    return (
      <div className="message">
        你将
        {this.state.selectedTab === UnreachableCommitsTab.Unreachable
          ? '不'
          : ''}
        会看到以下{commitsPluralized}的改动，因为{pronounPluralized}
        {this.state.selectedTab === UnreachableCommitsTab.Unreachable
          ? '不'
          : ''}
        在你所选的最新的一次提交的历史记录轨迹中。
        <LinkButton uri="https://github.com/desktop/desktop/blob/development/docs/learn-more/unreachable-commits.md">
          详细了解什么是不可达的提交
        </LinkButton>
        。
      </div>
    )
  }

  public render() {
    return (
      <Dialog
        className="unreachable-commits"
        title={__DARWIN__ ? '提交的可达性' : '提交的可达性'}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderTabs()}
        {this.renderActiveTab()}
        {this.renderFooter()}
      </Dialog>
    )
  }
}
