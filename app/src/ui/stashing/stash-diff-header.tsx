import * as React from 'react'
import { IStashEntry } from '../../models/stash-entry'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { PopupType } from '../../models/popup'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { ErrorWithMetadata } from '../../lib/error-with-metadata'
import {
  IDiff,
  getDifftRenderFailure,
  getDifftRenderedLanguage,
  isDifftRenderedDiff,
} from '../../models/diff'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface IStashDiffHeaderProps {
  readonly stashEntry: IStashEntry
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly askForConfirmationOnDiscardStash: boolean
  readonly diff: IDiff | null
}

interface IStashDiffHeaderState {
  readonly isRestoring: boolean
  readonly isDiscarding: boolean
}

/**
 * Component to provide the actions that can be performed
 * on a stash while viewing a stash diff
 */
export class StashDiffHeader extends React.Component<
  IStashDiffHeaderProps,
  IStashDiffHeaderState
> {
  public constructor(props: IStashDiffHeaderProps) {
    super(props)

    this.state = {
      isRestoring: false,
      isDiscarding: false,
    }
  }

  public render() {
    const { isRestoring, isDiscarding } = this.state

    return (
      <div className="header">
        <h3>暂存的改动</h3>
        <div className="row">
          {this.renderDifftIndicator()}
          <OkCancelButtonGroup
            okButtonText="恢复"
            okButtonDisabled={isRestoring || isDiscarding}
            onOkButtonClick={this.onRestoreClick}
            cancelButtonText="放弃"
            cancelButtonDisabled={isRestoring || isDiscarding}
            onCancelButtonClick={this.onDiscardClick}
            okButtonAriaDescribedBy="restore-description"
          />
          <div className="explanatory-text" id="restore-description">
            <span className="text">
              点击 <strong>恢复</strong> 即可取回这些改动。
            </span>
          </div>
        </div>
      </div>
    )
  }

  private renderDifftIndicator() {
    const failure = getDifftRenderFailure(this.props.diff)
    if (!isDifftRenderedDiff(this.props.diff) && failure === null) {
      return null
    }

    const language = getDifftRenderedLanguage(this.props.diff)
    const title =
      failure !== null
        ? `差异使用 Difftastic 渲染失败：${failure}`
        : language === null
        ? '差异使用 Difftastic 渲染'
        : `差异使用 Difftastic 渲染：${language}`

    const className =
      failure === null
        ? 'status difft-rendered-indicator difft-rendered-indicator-success'
        : 'status difft-rendered-indicator difft-rendered-indicator-failure'

    return <Octicon symbol={octicons.zap} className={className} title={title} />
  }

  private onDiscardClick = async () => {
    const {
      dispatcher,
      repository,
      stashEntry,
      askForConfirmationOnDiscardStash,
    } = this.props

    if (!askForConfirmationOnDiscardStash) {
      this.setState({
        isDiscarding: true,
      })

      try {
        await dispatcher.dropStash(repository, stashEntry)
      } finally {
        this.setState({
          isDiscarding: false,
        })
      }
    } else {
      dispatcher.showPopup({
        type: PopupType.ConfirmDiscardStash,
        stash: stashEntry,
        repository,
      })
    }
  }

  private onRestoreClick = async () => {
    const { dispatcher, repository, stashEntry } = this.props

    try {
      this.setState({ isRestoring: true })
      await dispatcher.popStash(repository, stashEntry)
    } catch (err) {
      const errorWithMetadata = new ErrorWithMetadata(err, {
        repository: repository,
      })
      dispatcher.postError(errorWithMetadata)
    } finally {
      this.setState({ isRestoring: false })
    }
  }
}
