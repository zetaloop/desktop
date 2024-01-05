import * as React from 'react'
import { Dispatcher } from '../dispatcher/index'
import { LinkButton } from '../lib/link-button'
import {
  UpdateStatus,
  lastShowCaseVersionSeen,
  updateStore,
} from '../lib/update-store'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { PopupType } from '../../models/popup'
import { shell } from '../../lib/app-shell'

import { ReleaseSummary } from '../../models/release-notes'
import { Banner } from './banner'
import { ReleaseNotesUri } from '../lib/releases'
import { RichText } from '../lib/rich-text'

interface IUpdateAvailableProps {
  readonly dispatcher: Dispatcher
  readonly newReleases: ReadonlyArray<ReleaseSummary> | null
  readonly isX64ToARM64ImmediateAutoUpdate: boolean
  readonly isUpdateShowcaseVisible: boolean
  readonly emoji: Map<string, string>
  readonly onDismissed: () => void
}

/**
 * A component which tells the user an update is available and gives them the
 * option of moving into the future or being a luddite.
 */
export class UpdateAvailable extends React.Component<
  IUpdateAvailableProps,
  {}
> {
  public render() {
    return (
      <Banner id="update-available" onDismissed={this.props.onDismissed}>
        {!this.props.isUpdateShowcaseVisible && (
          <Octicon
            className="download-icon"
            symbol={octicons.desktopDownload}
          />
        )}

        {this.renderMessage()}
      </Banner>
    )
  }

  private renderMessage = () => {
    if (this.props.isX64ToARM64ImmediateAutoUpdate) {
      return (
        <span onSubmit={this.updateNow}>
          为您 {__DARWIN__ ? 'Apple Silicon' : 'Arm64'} 电脑特别优化的 GitHub
          Desktop 版本已经准备好在下次打开时安装，或者您也可以{' '}
          <LinkButton onClick={this.updateNow}>
            立刻重启 GitHub Desktop
          </LinkButton>
          。
        </span>
      )
    }

    if (this.props.isUpdateShowcaseVisible) {
      const version =
        this.props.newReleases !== null
          ? `在 GitHub Desktop ${this.props.newReleases[0].latestVersion} 中，`
          : ''

      return (
        <span>
          <RichText
            className="banner-emoji"
            text={':tada:'}
            emoji={this.props.emoji}
          />
          {version}我们添加了很棒的新功能。
          <LinkButton onClick={this.showReleaseNotes}>
            查看更新日志
          </LinkButton>{' '}
          或者{' '}
          <LinkButton onClick={this.dismissUpdateShowCaseVisibility}>
            忽略
          </LinkButton>
          。
        </span>
      )
    }

    return (
      <span onSubmit={this.updateNow}>
        GitHub Desktop 版本更新已经准备好在下次打开时安装。
        <LinkButton onClick={this.showReleaseNotes}>
          查看更新日志
        </LinkButton>{' '}
        或者{' '}
        <LinkButton onClick={this.updateNow}>
          立刻重启 GitHub Desktop
        </LinkButton>
        。
      </span>
    )
  }

  private dismissUpdateShowCaseVisibility = () => {
    // Note: under that scenario that this is being dismissed due to clicking
    // what's new on a pending release and for some reason we don't have the
    // releases. We will end up showing the showcase banner after restart. This
    // shouldn't happen but even if it did it would just be a minor annoyance as
    // user would need to dismiss it again.
    const versionSeen =
      this.props.newReleases === null
        ? __APP_VERSION__
        : this.props.newReleases[0].latestVersion

    localStorage.setItem(lastShowCaseVersionSeen, versionSeen)
    this.props.dispatcher.setUpdateShowCaseVisibility(false)
  }

  private showReleaseNotes = () => {
    if (this.props.newReleases == null) {
      // if, for some reason we're not able to render the release notes we
      // should redirect the user to the website so we do _something_
      shell.openExternal(ReleaseNotesUri)
    } else {
      this.props.dispatcher.showPopup({
        type: PopupType.ReleaseNotes,
        newReleases: this.props.newReleases,
      })
    }

    this.dismissUpdateShowCaseVisibility()
  }

  private updateNow = () => {
    if (
      (__RELEASE_CHANNEL__ === 'development' ||
        __RELEASE_CHANNEL__ === 'test') &&
      updateStore.state.status !== UpdateStatus.UpdateReady
    ) {
      this.props.onDismissed()
      return // causes a crash.. if no update is available
    }

    updateStore.quitAndInstallUpdate()
  }
}
