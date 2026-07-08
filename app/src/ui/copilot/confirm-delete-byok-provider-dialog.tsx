import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { IBYOKProvider } from '../../lib/copilot/byok'

interface IConfirmDeleteCopilotBYOKProviderDialogProps {
  readonly provider: IBYOKProvider
  readonly onConfirm: (provider: IBYOKProvider) => void
  readonly onDismissed: () => void
}

/**
 * Confirmation prompt shown before removing a BYOK Copilot provider. The
 * provider is removed from local storage and any stored secret is purged
 * from the OS keychain.
 */
export class ConfirmDeleteCopilotBYOKProviderDialog extends React.Component<IConfirmDeleteCopilotBYOKProviderDialogProps> {
  public render() {
    return (
      <Dialog
        id="confirm-delete-copilot-byok-provider"
        title={__DARWIN__ ? '移除自定义提供商' : '移除自定义提供商'}
        type="warning"
        onSubmit={this.onConfirm}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="confirm-delete-copilot-byok-provider-message"
      >
        <DialogContent>
          <p id="confirm-delete-copilot-byok-provider-message">
            确定要移除自定义提供商 <Ref>{this.props.provider.name}</Ref> 吗？{' '}
            {this.renderSecretConsequence()}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? '移除' : '移除'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSecretConsequence() {
    switch (this.props.provider.authKind) {
      case 'apiKey':
        return '它的 API key 也会从钥匙串中移除。'
      case 'bearer':
        return '它的 bearer token 也会从钥匙串中移除。'
      case 'none':
        return '您为它配置的模型将不再可用。'
    }
  }

  private onConfirm = () => {
    this.props.onConfirm(this.props.provider)
    this.props.onDismissed()
  }
}
