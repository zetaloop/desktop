import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { getGlobalConfigPath } from '../../lib/git'
import { shell } from '../../lib/app-shell'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void
}

interface IAttributeMismatchState {
  readonly globalGitConfigPath: string | null
}

export class AttributeMismatch extends React.Component<
  IAttributeMismatchProps,
  IAttributeMismatchState
> {
  public constructor(props: IAttributeMismatchProps) {
    super(props)

    this.state = {
      globalGitConfigPath: null,
    }
  }

  public async componentDidMount() {
    try {
      const path = await getGlobalConfigPath()
      this.setState({ globalGitConfigPath: path })
    } catch (error) {
      log.warn(`Couldn't get the global git config path`, error)
    }
  }

  private renderGlobalGitConfigLink() {
    const path = this.state.globalGitConfigPath
    const msg = '全局 Git 配置文件'
    if (path) {
      return <LinkButton onClick={this.showGlobalGitConfig}>{msg}</LinkButton>
    } else {
      return msg
    }
  }

  private showGlobalGitConfig = () => {
    const path = this.state.globalGitConfigPath
    if (path) {
      shell.openPath(path)
    }
  }

  public render() {
    return (
      <Dialog
        id="lfs-attribute-mismatch"
        title={
          __DARWIN__
            ? '更新当前的 Git LFS 过滤器？'
            : '更新当前的 Git LFS 过滤器？'
        }
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
      >
        <DialogContent>
          <p>
            Git LFS 过滤器已在{this.renderGlobalGitConfigLink()}
            中配置，但其值不正确。是否现在更新？
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={__DARWIN__ ? '更新过滤器' : '更新过滤器'}
            cancelButtonText={__DARWIN__ ? '忽略' : '忽略'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    this.props.onUpdateExistingFilters()
    this.props.onDismissed()
  }
}
