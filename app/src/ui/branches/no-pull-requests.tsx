import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface INoPullRequestsProps {
  /** The name of the repository. */
  readonly repositoryName: string

  /** Is the default branch currently checked out? */
  readonly isOnDefaultBranch: boolean

  /** Is this component being rendered due to a search? */
  readonly isSearch: boolean

  /* Called when the user wants to create a new branch. */
  readonly onCreateBranch: () => void

  /** Called when the user wants to create a pull request. */
  readonly onCreatePullRequest: () => void

  /** Are we currently loading pull requests? */
  readonly isLoadingPullRequests: boolean
}

/** The placeholder for when there are no open pull requests. */
export class NoPullRequests extends React.Component<INoPullRequestsProps, {}> {
  public render() {
    return (
      <div className="no-pull-requests">
        <img src={BlankSlateImage} className="blankslate-image" alt="" />
        {this.renderTitle()}
        {this.renderCallToAction()}
      </div>
    )
  }

  private renderTitle() {
    if (this.props.isSearch) {
      return <div className="title">抱歉，找不到该拉取请求</div>
    } else if (this.props.isLoadingPullRequests) {
      return <div className="title">请稍候</div>
    } else {
      return (
        <div>
          <div className="title">一切准备就绪！</div>
          <div className="no-prs">
            <Ref>{this.props.repositoryName}</Ref> 没有打开的拉取请求
          </div>
        </div>
      )
    }
  }

  private renderCallToAction() {
    if (this.props.isLoadingPullRequests) {
      return (
        <div className="call-to-action">正在以最快速度加载拉取请求啦！</div>
      )
    }

    if (this.props.isOnDefaultBranch) {
      return (
        <div className="call-to-action">
          您想要{' '}
          <LinkButton onClick={this.props.onCreateBranch}>新建分支</LinkButton>{' '}
          开始着手新的项目吗？
        </div>
      )
    } else {
      return (
        <div className="call-to-action">
          您想要从当前分支{' '}
          <LinkButton onClick={this.props.onCreatePullRequest}>
            创建拉取请求
          </LinkButton>{' '}
          吗？
        </div>
      )
    }
  }
}
