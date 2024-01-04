import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { CallToAction } from '../lib/call-to-action'

// const HelpURL = 'https://help.github.com/articles/about-remote-repositories/'
const HelpURL =
  'https://docs.github.com/zh/get-started/getting-started-with-git/about-remote-repositories'

interface INoRemoteProps {
  /** The function to call when the users chooses to publish. */
  readonly onPublish: () => void
}

/** The component for when a repository has no remote. */
export class NoRemote extends React.Component<INoRemoteProps, {}> {
  public render() {
    return (
      <DialogContent>
        <CallToAction actionTitle="发布" onAction={this.props.onPublish}>
          <div className="no-remote-publish-message">
            把仓库发布到 GitHub 吧。是否需要帮助？
            <LinkButton uri={HelpURL}>点击了解远程仓库</LinkButton>。
          </div>
        </CallToAction>
      </DialogContent>
    )
  }
}
