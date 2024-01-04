import * as React from 'react'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import { SamplesURL } from '../../lib/stats'
import { isWindowsOpenSSHAvailable } from '../../lib/ssh/ssh'
import { enableExternalCredentialHelper } from '../../lib/feature-flag'

interface IAdvancedPreferencesProps {
  readonly useWindowsOpenSSH: boolean
  readonly optOutOfUsageTracking: boolean
  readonly useExternalCredentialHelper: boolean
  readonly repositoryIndicatorsEnabled: boolean
  readonly onUseWindowsOpenSSHChanged: (checked: boolean) => void
  readonly onOptOutofReportingChanged: (checked: boolean) => void
  readonly onUseExternalCredentialHelperChanged: (checked: boolean) => void
  readonly onRepositoryIndicatorsEnabledChanged: (enabled: boolean) => void
}

interface IAdvancedPreferencesState {
  readonly optOutOfUsageTracking: boolean
  readonly canUseWindowsSSH: boolean
  readonly useExternalCredentialHelper: boolean
}

export class Advanced extends React.Component<
  IAdvancedPreferencesProps,
  IAdvancedPreferencesState
> {
  public constructor(props: IAdvancedPreferencesProps) {
    super(props)

    this.state = {
      optOutOfUsageTracking: this.props.optOutOfUsageTracking,
      canUseWindowsSSH: false,
      useExternalCredentialHelper: this.props.useExternalCredentialHelper,
    }
  }

  public componentDidMount() {
    this.checkSSHAvailability()
  }

  private async checkSSHAvailability() {
    this.setState({ canUseWindowsSSH: await isWindowsOpenSSHAvailable() })
  }

  private onReportingOptOutChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ optOutOfUsageTracking: value })
    this.props.onOptOutofReportingChanged(value)
  }

  private onUseExternalCredentialHelperChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ useExternalCredentialHelper: value })
    this.props.onUseExternalCredentialHelperChanged(value)
  }

  private onRepositoryIndicatorsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onRepositoryIndicatorsEnabledChanged(event.currentTarget.checked)
  }

  private onUseWindowsOpenSSHChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onUseWindowsOpenSSHChanged(event.currentTarget.checked)
  }

  private reportDesktopUsageLabel() {
    return (
      <span>
        发送 <LinkButton uri={SamplesURL}>使用情况数据</LinkButton> 帮助 GitHub
        Desktop 变得更好
      </span>
    )
  }

  public render() {
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>后台更新</h2>
          <Checkbox
            label="在储存库列表中显示状态图标"
            value={
              this.props.repositoryIndicatorsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onRepositoryIndicatorsEnabledChanged}
            ariaDescribedBy="periodic-fetch-description"
          />
          <div
            id="periodic-fetch-description"
            className="git-settings-description"
          >
            <p>
              这些小图标显示了储存库是否有本地和远程的改动，它需要定期获取更新所有储存库。
            </p>
            <p>
              关闭后，就只会定期更新当前选中的储存库。如果您有很多储存库，关掉它可以提升性能。
            </p>
          </div>
        </div>
        <div className="advanced-section">
          <h2>使用情况</h2>
          <Checkbox
            label={this.reportDesktopUsageLabel()}
            value={
              this.state.optOutOfUsageTracking
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onReportingOptOutChanged}
          />
        </div>
        {(this.state.canUseWindowsSSH || enableExternalCredentialHelper()) && (
          <h2>Network and credentials</h2>
        )}
        {this.renderSSHSettings()}
        {enableExternalCredentialHelper() && (
          <div className="advanced-section">
            <Checkbox
              label={'Use Git Credential Manager'}
              value={
                this.state.useExternalCredentialHelper
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onUseExternalCredentialHelperChanged}
              ariaDescribedBy="use-external-credential-helper-description"
            />
            <div
              id="use-external-credential-helper-description"
              className="git-settings-description"
            >
              <p>
                Use{' '}
                <LinkButton uri="https://gh.io/gcm">
                  Git Credential Manager{' '}
                </LinkButton>{' '}
                for private repositories outside of GitHub.com. This feature is
                experimental and subject to change.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    )
  }

  private renderSSHSettings() {
    if (!this.state.canUseWindowsSSH) {
      return null
    }

    return (
      <div className="advanced-section">
        <Checkbox
          label="使用系统环境的 OpenSSH（推荐）"
          value={
            this.props.useWindowsOpenSSH ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onUseWindowsOpenSSHChanged}
        />
      </div>
    )
  }
}
