import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { RetryAction } from '../../models/retry-actions'
import { SignInResult } from '../../lib/stores'

const okButtonText = __DARWIN__ ? '打开浏览器' : '打开浏览器'

interface ISAMLReauthRequiredDialogProps {
  readonly dispatcher: Dispatcher
  readonly organizationName: string
  readonly endpoint: string

  /** The action to retry if applicable. */
  readonly retryAction?: RetryAction

  readonly onDismissed: () => void
}
interface ISAMLReauthRequiredDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a Git network operation is denied due to
 * the organization owning the repository having enforced SAML
 * SSO and the current session not being authorized.
 */
export class SAMLReauthRequiredDialog extends React.Component<
  ISAMLReauthRequiredDialogProps,
  ISAMLReauthRequiredDialogState
> {
  public constructor(props: ISAMLReauthRequiredDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        title={__DARWIN__ ? '需要重新授权' : '需要重新授权'}
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            "{this.props.organizationName}" 组织已启用或强制执行 SAML
            SSO。要访问此仓库，您必须重新登录并授予 GitHub Desktop
            访问该组织仓库的权限。
          </p>
          <p>是否打开浏览器授权 GitHub Desktop 访问该仓库？</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={okButtonText} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSignIn = async () => {
    this.setState({ loading: true })
    const { dispatcher, endpoint } = this.props

    const result = await new Promise<SignInResult>(async resolve => {
      dispatcher.beginBrowserBasedSignIn(endpoint, resolve)
    })

    if (result.kind === 'success' && this.props.retryAction) {
      dispatcher.performRetry(this.props.retryAction)
    }

    this.props.onDismissed()
  }
}
