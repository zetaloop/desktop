import * as React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Banner } from './banner'
import { LinkButton } from '../lib/link-button'
import { setNumber } from '../../lib/local-storage'

export const UnsupportedOSBannerDismissedAtKey =
  'unsupported-os-banner-dismissed-at'

export class OSVersionNoLongerSupportedBanner extends React.Component<{
  onDismissed: () => void
}> {
  private onDismissed = () => {
    setNumber(UnsupportedOSBannerDismissedAtKey, Date.now())
    this.props.onDismissed()
  }

  public render() {
    return (
      <Banner
        id="conflicts-found-banner"
        dismissable={true}
        onDismissed={this.onDismissed}
      >
        <Octicon className="alert-icon" symbol={octicons.alert} />
        <div className="banner-message">
          <span>您的系统版本太低，软件将停止更新。</span>
          <LinkButton uri="https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
            支持的操作系统
          </LinkButton>
        </div>
      </Banner>
    )
  }
}
