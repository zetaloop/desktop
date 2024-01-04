import * as React from 'react'

import { Row } from '../lib/row'
import { Button } from '../lib/button'
import {
  Dialog,
  DialogError,
  DialogContent,
  DefaultDialogFooter,
} from '../dialog'
import { LinkButton } from '../lib/link-button'
import { updateStore, IUpdateState, UpdateStatus } from '../lib/update-store'
import { Disposable } from 'event-kit'
import { Loading } from '../lib/loading'
import { RelativeTime } from '../relative-time'
import { assertNever } from '../../lib/fatal-error'
import { ReleaseNotesUri } from '../lib/releases'
import { encodePathAsUrl } from '../../lib/path'
import { isOSNoLongerSupportedByElectron } from '../../lib/get-os'

const logoPath = __DARWIN__
  ? 'static/logo-64x64@2x.png'
  : 'static/windows-logo-64x64@2x.png'
const DesktopLogo = encodePathAsUrl(__dirname, logoPath)

interface IAboutProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissible prop.
   */
  readonly onDismissed: () => void

  /**
   * The name of the currently installed (and running) application
   */
  readonly applicationName: string

  /**
   * The currently installed (and running) version of the app.
   */
  readonly applicationVersion: string

  /**
   * The currently installed (and running) architecture of the app.
   */
  readonly applicationArchitecture: string

  /** A function to call to kick off a non-staggered update check. */
  readonly onCheckForNonStaggeredUpdates: () => void

  readonly onShowAcknowledgements: () => void

  /** A function to call when the user wants to see Terms and Conditions. */
  readonly onShowTermsAndConditions: () => void
}

interface IAboutState {
  readonly updateState: IUpdateState
}

/**
 * A dialog that presents information about the
 * running application such as name and version.
 */
export class About extends React.Component<IAboutProps, IAboutState> {
  private updateStoreEventHandle: Disposable | null = null

  public constructor(props: IAboutProps) {
    super(props)

    this.state = {
      updateState: updateStore.state,
    }
  }

  private onUpdateStateChanged = (updateState: IUpdateState) => {
    this.setState({ updateState })
  }

  public componentDidMount() {
    this.updateStoreEventHandle = updateStore.onDidChange(
      this.onUpdateStateChanged
    )
    this.setState({ updateState: updateStore.state })
  }

  public componentWillUnmount() {
    if (this.updateStoreEventHandle) {
      this.updateStoreEventHandle.dispose()
      this.updateStoreEventHandle = null
    }
  }

  private onQuitAndInstall = () => {
    updateStore.quitAndInstallUpdate()
  }

  private renderUpdateButton() {
    if (__RELEASE_CHANNEL__ === 'development') {
      return null
    }

    const updateStatus = this.state.updateState.status

    switch (updateStatus) {
      case UpdateStatus.UpdateReady:
        return (
          <Row>
            <Button onClick={this.onQuitAndInstall}>退出并安装更新</Button>
          </Row>
        )
      case UpdateStatus.UpdateNotAvailable:
      case UpdateStatus.CheckingForUpdates:
      case UpdateStatus.UpdateAvailable:
      case UpdateStatus.UpdateNotChecked:
        const disabled =
          ![
            UpdateStatus.UpdateNotChecked,
            UpdateStatus.UpdateNotAvailable,
          ].includes(updateStatus) || isOSNoLongerSupportedByElectron()

        const buttonTitle = '检查更新'

        return (
          <Row>
            <Button
              disabled={disabled}
              onClick={this.props.onCheckForNonStaggeredUpdates}
            >
              {buttonTitle}
            </Button>
          </Row>
        )
      default:
        return assertNever(
          updateStatus,
          `Unknown update status ${updateStatus}`
        )
    }
  }

  private renderCheckingForUpdate() {
    return (
      <Row className="update-status">
        <Loading />
        <span>正在检查更新…</span>
      </Row>
    )
  }

  private renderUpdateAvailable() {
    return (
      <Row className="update-status">
        <Loading />
        <span>正在下载更新…</span>
      </Row>
    )
  }

  private renderUpdateNotAvailable() {
    const lastCheckedDate = this.state.updateState.lastSuccessfulCheck

    // This case is rendered as an error
    if (!lastCheckedDate) {
      return null
    }

    return (
      <p className="update-status">
        已是最新版本 (检查于
        <RelativeTime date={lastCheckedDate} />)
      </p>
    )
  }

  private renderUpdateReady() {
    return <p className="update-status">更新已准备就绪</p>
  }

  private renderUpdateDetails() {
    if (__LINUX__) {
      return null
    }

    if (__RELEASE_CHANNEL__ === 'development') {
      return <p>开发版本不接收更新</p>
    }

    const updateState = this.state.updateState

    switch (updateState.status) {
      case UpdateStatus.CheckingForUpdates:
        return this.renderCheckingForUpdate()
      case UpdateStatus.UpdateAvailable:
        return this.renderUpdateAvailable()
      case UpdateStatus.UpdateNotAvailable:
        return this.renderUpdateNotAvailable()
      case UpdateStatus.UpdateReady:
        return this.renderUpdateReady()
      case UpdateStatus.UpdateNotChecked:
        return null
      default:
        return assertNever(
          updateState.status,
          `Unknown update status ${updateState.status}`
        )
    }
  }

  private renderUpdateErrors() {
    if (__LINUX__) {
      return null
    }

    if (__RELEASE_CHANNEL__ === 'development') {
      return null
    }

    if (isOSNoLongerSupportedByElectron()) {
      return (
        <DialogError>
          您的系统版本太低，软件将停止更新。
          <LinkButton uri="https://docs.github.com/zh/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
            支持的操作系统
          </LinkButton>
        </DialogError>
      )
    }

    if (!this.state.updateState.lastSuccessfulCheck) {
      return (
        <DialogError>
          无法确定上次检查更新的时间，当前版本可能过旧。请手动检查更新。如果问题依旧，请联系
          GitHub 支持。
        </DialogError>
      )
    }

    return null
  }

  private renderBetaLink() {
    if (__RELEASE_CHANNEL__ === 'beta') {
      return
    }

    return (
      <div>
        <p className="no-padding">想试试最新功能吗?</p>
        <p className="no-padding">
          安装{' '}
          <LinkButton uri="https://github.com/zetaloop/desktop/releases">
            Beta 内测版
          </LinkButton>
        </p>
      </div>
    )
  }

  public render() {
    const name = this.props.applicationName
    const version = this.props.applicationVersion
    const releaseNotesLink = (
      <LinkButton uri={ReleaseNotesUri}>更新日志</LinkButton>
    )

    const versionText = __DEV__ ? `构建 ${version}` : `版本 ${version}`
    const titleId = 'Dialog_about'

    return (
      <Dialog
        id="about"
        titleId={titleId}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderUpdateErrors()}
        <DialogContent>
          <Row className="logo">
            <img
              src={DesktopLogo}
              alt="GitHub Desktop"
              width="64"
              height="64"
            />
          </Row>
          <h1 id={titleId}>关于 {name}</h1>
          <p className="no-padding">
            <span className="selectable-text">
              {versionText} ({this.props.applicationArchitecture})
            </span>
          </p>
          <p className="no-padding terms-and-license">
            <LinkButton onClick={this.props.onShowTermsAndConditions}>
              使用条款
            </LinkButton>
          </p>
          <p className="terms-and-license">
            <LinkButton onClick={this.props.onShowAcknowledgements}>
              开源许可
            </LinkButton>
          </p>
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
          {this.renderBetaLink()}
        </DialogContent>
        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
