import * as React from 'react'
import { IRemote } from '../../models/remote'
import { TextBox } from '../lib/text-box'
import { DialogContent } from '../dialog'

interface IRemoteProps {
  /** The remote being shown. */
  readonly remote: IRemote

  /** The function to call when the remote URL is changed by the user. */
  readonly onRemoteUrlChanged: (url: string) => void
}

/** The Remote component. */
export class Remote extends React.Component<IRemoteProps, {}> {
  public render() {
    const remote = this.props.remote
    return (
      <DialogContent>
        <TextBox
          placeholder="远程地址"
          label={
            __DARWIN__
              ? `主要远程仓库 (${remote.name}) 地址`
              : `主要远程仓库 (${remote.name}) 地址`
          }
          value={remote.url}
          onValueChanged={this.props.onRemoteUrlChanged}
        />
      </DialogContent>
    )
  }
}
