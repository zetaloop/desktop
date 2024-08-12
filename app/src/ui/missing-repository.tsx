import * as React from 'react'

import { UiView } from './ui-view'
import { Dispatcher } from './dispatcher'
import { Repository } from '../models/repository'

import { Button } from './lib/button'
import { Row } from './lib/row'
import { LinkButton } from './lib/link-button'
import { addSafeDirectory, getRepositoryType } from '../lib/git'
import { Ref } from './lib/ref'
import { Loading } from './lib/loading'

interface IMissingRepositoryProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
}

interface IMissingRepositoryState {
  readonly isPathUnsafe: boolean
  readonly unsafePath?: string
  readonly isTrustingPath: boolean
}

/** The view displayed when a repository is missing. */
export class MissingRepository extends React.Component<
  IMissingRepositoryProps,
  IMissingRepositoryState
> {
  public constructor(props: IMissingRepositoryProps) {
    super(props)
    this.state = { isPathUnsafe: false, isTrustingPath: false }
  }

  private onTrustDirectory = async () => {
    this.setState({ isTrustingPath: true })
    const { unsafePath } = this.state
    const { repository } = this.props

    if (unsafePath) {
      await addSafeDirectory(unsafePath)
      const type = await getRepositoryType(repository.path)

      this.setState({ isTrustingPath: false })

      if (type.kind !== 'unsafe') {
        this.checkAgain()
      }
    }
  }

  public async componentDidMount() {
    this.updateUnsafePathState()
  }

  public async componentDidUpdate(prevProps: IMissingRepositoryProps) {
    if (prevProps.repository.path !== this.props.repository.path) {
      this.updateUnsafePathState()
    }
  }

  private updateUnsafePathState = async () => {
    const { path } = this.props.repository
    const type = await getRepositoryType(path)
    if (path === this.props.repository.path) {
      this.setState({
        isPathUnsafe: type.kind === 'unsafe',
        unsafePath: type.kind === 'unsafe' ? type.path : undefined,
      })
    }
  }

  public render() {
    const buttons = new Array<JSX.Element>()
    const { isPathUnsafe, unsafePath } = this.state

    if (!isPathUnsafe) {
      buttons.push(
        <Button key="locate" onClick={this.locate} type="submit">
          查找…
        </Button>
      )

      if (this.canCloneAgain()) {
        buttons.push(
          <Button key="clone-again" onClick={this.cloneAgain}>
            重新克隆
          </Button>
        )
      }
    } else {
      buttons.push(
        <Button
          key="trustDirectory"
          onClick={this.onTrustDirectory}
          type="submit"
          disabled={this.state.isTrustingPath}
        >
          {this.state.isTrustingPath && <Loading />}
          {__DARWIN__ ? 'Trust Repository' : 'Trust repository'}
        </Button>
      )
    }

    buttons.push(
      <Button key="remove" onClick={this.remove}>
        移除
      </Button>
    )

    if (isPathUnsafe) {
      return (
        <UiView id="missing-repository-view">
          <div className="title-container">
            <div className="title">
              {this.props.repository.name}可能不安全
            </div>
            <div className="details">
              <p>
                位于 <Ref>{unsafePath}</Ref> 的 Git 仓库似乎是由您机器上的
                另一个用户拥有。添加不受信任的仓库可能会自动执行该仓库中的文件。
              </p>
              <p>
                如果您信任该目录的所有者，可以为该目录添加一个例外，以便继续操作。
              </p>
            </div>
          </div>

          <Row>{buttons}</Row>
        </UiView>
      )
    }

    return (
      <UiView id="missing-repository-view">
        <div className="title-container">
          <div className="title">找不到仓库 "{this.props.repository.name}"</div>
          <div className="details">
            最后保存于 {' '}
            <span className="path">{this.props.repository.path}</span>.{' '}
            <LinkButton onClick={this.checkAgain}>重新检查。</LinkButton>
          </div>
        </div>

        <Row>{buttons}</Row>
      </UiView>
    )
  }

  private canCloneAgain() {
    const gitHubRepository = this.props.repository.gitHubRepository
    return gitHubRepository && gitHubRepository.cloneURL
  }

  private checkAgain = () => {
    this.props.dispatcher.refreshRepository(this.props.repository)
  }

  private remove = () => {
    this.props.dispatcher.removeRepository(this.props.repository, false)
  }

  private locate = () => {
    this.props.dispatcher.relocateRepository(this.props.repository)
  }

  private cloneAgain = async () => {
    const gitHubRepository = this.props.repository.gitHubRepository
    if (!gitHubRepository) {
      return
    }

    const cloneURL = gitHubRepository.cloneURL
    if (!cloneURL) {
      return
    }

    try {
      await this.props.dispatcher.cloneAgain(
        cloneURL,
        this.props.repository.path
      )
    } catch (error) {
      this.props.dispatcher.postError(error)
    }
  }
}
