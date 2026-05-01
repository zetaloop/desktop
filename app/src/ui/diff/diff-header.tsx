import * as React from 'react'
import { PathLabel } from '../lib/path-label'
import { AppFileStatus } from '../../models/status'
import {
  IDiff,
  DiffType,
  getDifftRenderFailure,
  getDifftRenderedLanguage,
  isDifftRenderedDiff,
} from '../../models/diff'
import { Octicon, iconForStatus } from '../octicons'
import { mapStatus } from '../../lib/status'
import { DiffOptions } from './diff-options'
import * as octicons from '../octicons/octicons.generated'

interface IDiffHeaderProps {
  readonly path: string
  readonly status: AppFileStatus
  readonly diff: IDiff | null

  /** Whether we should display side by side diffs. */
  readonly showSideBySideDiff: boolean

  /** Called when the user changes the side by side diffs setting. */
  readonly onShowSideBySideDiffChanged: (checked: boolean) => void

  /** Whether we should hide whitespace in diffs. */
  readonly hideWhitespaceInDiff: boolean

  /** Called when the user changes the hide whitespace in diffs setting. */
  readonly onHideWhitespaceInDiffChanged: (checked: boolean) => Promise<void>

  readonly enableDifftastic: boolean
  readonly onEnableDifftasticChanged: (checked: boolean) => void

  /** Called when the user opens the diff options popover */
  readonly onDiffOptionsOpened: () => void
}

/** Displays information about a file */
export class DiffHeader extends React.Component<IDiffHeaderProps, {}> {
  public render() {
    const status = this.props.status
    const fileStatus = mapStatus(status)

    return (
      <div className="header">
        <PathLabel path={this.props.path} status={this.props.status} />

        {this.renderDiffOptions()}

        {this.renderDifftIndicator()}

        <Octicon
          symbol={iconForStatus(status)}
          className={'status status-' + fileStatus.toLowerCase()}
          title={mapStatus(status, true)} // cn
        />
      </div>
    )
  }

  private renderDiffOptions() {
    if (this.props.diff?.kind === DiffType.Submodule) {
      return null
    }

    return (
      <DiffOptions
        isInteractiveDiff={true}
        onHideWhitespaceChangesChanged={
          this.props.onHideWhitespaceInDiffChanged
        }
        hideWhitespaceChanges={this.props.hideWhitespaceInDiff}
        onShowSideBySideDiffChanged={this.props.onShowSideBySideDiffChanged}
        showSideBySideDiff={this.props.showSideBySideDiff}
        enableDifftastic={this.props.enableDifftastic}
        onEnableDifftasticChanged={this.props.onEnableDifftasticChanged}
        onDiffOptionsOpened={this.props.onDiffOptionsOpened}
      />
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
}
