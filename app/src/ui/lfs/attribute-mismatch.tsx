import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IAttributeMismatchProps {
  /** Called when the dialog should be dismissed. */
  readonly onDismissed: () => void

  /** Called when the user has chosen to replace the update filters. */
  readonly onUpdateExistingFilters: () => void

  readonly onEditGlobalGitConfig: () => void
}

export class AttributeMismatch extends React.Component<IAttributeMismatchProps> {
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
            Git LFS 过滤器已在{' '}
            <LinkButton onClick={this.props.onEditGlobalGitConfig}>
              全局 Git 配置文件
            </LinkButton>{' '}
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
