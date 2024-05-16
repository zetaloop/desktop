import * as React from 'react'

import { assertNever } from '../../lib/fatal-error'
import { encodePathAsUrl } from '../../lib/path'

import { Repository } from '../../models/repository'
import {
  CommittedFileChange,
  WorkingDirectoryFileChange,
  AppFileStatusKind,
  isManualConflict,
  isConflictedFileStatus,
} from '../../models/status'
import {
  DiffSelection,
  DiffType,
  IDiff,
  IImageDiff,
  ITextDiff,
  ILargeTextDiff,
  ImageDiffType,
  ISubmoduleDiff,
} from '../../models/diff'
import { Button } from '../lib/button'
import {
  NewImageDiff,
  ModifiedImageDiff,
  DeletedImageDiff,
} from './image-diffs'
import { BinaryFile } from './binary-file'
import { TextDiff } from './text-diff'
import { SideBySideDiff } from './side-by-side-diff'
import { enableExperimentalDiffViewer } from '../../lib/feature-flag'
import { IFileContents } from './syntax-highlighting'
import { SubmoduleDiff } from './submodule-diff'

// image used when no diff is displayed
const NoDiffImage = encodePathAsUrl(__dirname, 'static/ufo-alert.svg')

type ChangedFile = WorkingDirectoryFileChange | CommittedFileChange

/** The props for the Diff component. */
interface IDiffProps {
  readonly repository: Repository

  /**
   * Whether the diff is readonly, e.g., displaying a historical diff, or the
   * diff's lines can be selected, e.g., displaying a change in the working
   * directory.
   */
  readonly readOnly: boolean

  /** The file whose diff should be displayed. */
  readonly file: ChangedFile

  /** Called when the includedness of lines or a range of lines has changed. */
  readonly onIncludeChanged?: (diffSelection: DiffSelection) => void

  /** The diff that should be rendered */
  readonly diff: IDiff

  /**
   * Contents of the old and new files related to the current text diff.
   */
  readonly fileContents: IFileContents | null

  /** The type of image diff to display. */
  readonly imageDiffType: ImageDiffType

  /** Hiding whitespace in diff. */
  readonly hideWhitespaceInDiff: boolean

  /** Whether we should display side by side diffs. */
  readonly showSideBySideDiff: boolean

  /** Whether we should show a confirmation dialog when the user discards changes */
  readonly askForConfirmationOnDiscardChanges?: boolean

  /** Whether or not to show the diff check marks indicating inclusion in a commit */
  readonly showDiffCheckMarks: boolean

  /**
   * Called when the user requests to open a binary file in an the
   * system-assigned application for said file type.
   */
  readonly onOpenBinaryFile: (fullPath: string) => void

  /** Called when the user requests to open a submodule. */
  readonly onOpenSubmodule?: (fullPath: string) => void

  /**
   * Called when the user is viewing an image diff and requests
   * to change the diff presentation mode.
   */
  readonly onChangeImageDiffType: (type: ImageDiffType) => void

  /*
   * Called when the user wants to discard a selection of the diff.
   * Only applicable when readOnly is false.
   */
  readonly onDiscardChanges?: (
    diff: ITextDiff,
    diffSelection: DiffSelection
  ) => void

  /** Called when the user changes the hide whitespace in diffs setting. */
  readonly onHideWhitespaceInDiffChanged: (checked: boolean) => void
}

interface IDiffState {
  readonly forceShowLargeDiff: boolean
}

/** A component which renders a diff for a file. */
export class Diff extends React.Component<IDiffProps, IDiffState> {
  public constructor(props: IDiffProps) {
    super(props)

    this.state = {
      forceShowLargeDiff: false,
    }
  }

  public render() {
    const diff = this.props.diff

    switch (diff.kind) {
      case DiffType.Text:
        return this.renderText(diff)
      case DiffType.Binary:
        return this.renderBinaryFile()
      case DiffType.Submodule:
        return this.renderSubmoduleDiff(diff)
      case DiffType.Image:
        return this.renderImage(diff)
      case DiffType.LargeText: {
        return this.state.forceShowLargeDiff
          ? this.renderLargeText(diff)
          : this.renderLargeTextDiff()
      }
      case DiffType.Unrenderable:
        return this.renderUnrenderableDiff()
      default:
        return assertNever(diff, `Unsupported diff type: ${diff}`)
    }
  }

  private renderImage(imageDiff: IImageDiff) {
    if (imageDiff.current && imageDiff.previous) {
      return (
        <ModifiedImageDiff
          onChangeDiffType={this.props.onChangeImageDiffType}
          diffType={this.props.imageDiffType}
          current={imageDiff.current}
          previous={imageDiff.previous}
        />
      )
    }

    if (
      imageDiff.current &&
      (this.props.file.status.kind === AppFileStatusKind.New ||
        this.props.file.status.kind === AppFileStatusKind.Untracked)
    ) {
      return <NewImageDiff current={imageDiff.current} />
    }

    if (
      imageDiff.previous &&
      this.props.file.status.kind === AppFileStatusKind.Deleted
    ) {
      return <DeletedImageDiff previous={imageDiff.previous} />
    }

    return null
  }

  private renderLargeTextDiff() {
    return (
      <div className="panel empty large-diff">
        <img src={NoDiffImage} className="blankslate-image" alt="" />
        <div className="description">
          <p>文件差异大小超过默认限制。</p>
          <p>你仍可以选择显示，但可能比较卡顿。</p>
        </div>
        <Button onClick={this.showLargeDiff}>
          {__DARWIN__ ? '显示差异' : '显示差异'}
        </Button>
      </div>
    )
  }

  private renderUnrenderableDiff() {
    return (
      <div className="panel empty large-diff">
        <img src={NoDiffImage} alt="" />
        <p>文件差异大小过大，无法渲染。</p>
      </div>
    )
  }

  private renderLargeText(diff: ILargeTextDiff) {
    // guaranteed to be set since this function won't be called if text or hunks are null
    const textDiff: ITextDiff = {
      text: diff.text,
      hunks: diff.hunks,
      kind: DiffType.Text,
      lineEndingsChange: diff.lineEndingsChange,
      maxLineNumber: diff.maxLineNumber,
      hasHiddenBidiChars: diff.hasHiddenBidiChars,
    }

    return this.renderTextDiff(textDiff)
  }

  private renderText(diff: ITextDiff) {
    if (diff.hunks.length === 0) {
      if (
        this.props.file.status.kind === AppFileStatusKind.New ||
        this.props.file.status.kind === AppFileStatusKind.Untracked
      ) {
        return <div className="panel empty">文件为空</div>
      }

      if (this.props.file.status.kind === AppFileStatusKind.Renamed) {
        return <div className="panel renamed">文件重命名，内容未改动</div>
      }

      if (
        isConflictedFileStatus(this.props.file.status) &&
        isManualConflict(this.props.file.status)
      ) {
        return (
          <div className="panel empty">文件存在冲突，必须去命令行解决。</div>
        )
      }

      if (this.props.hideWhitespaceInDiff) {
        return <div className="panel empty">只有空白字符改动</div>
      }

      return <div className="panel empty">内容未改动</div>
    }

    return this.renderTextDiff(diff)
  }

  private renderSubmoduleDiff(diff: ISubmoduleDiff) {
    return (
      <SubmoduleDiff
        onOpenSubmodule={this.props.onOpenSubmodule}
        diff={diff}
        readOnly={this.props.readOnly}
      />
    )
  }

  private renderBinaryFile() {
    return (
      <BinaryFile
        path={this.props.file.path}
        repository={this.props.repository}
        onOpenBinaryFile={this.props.onOpenBinaryFile}
      />
    )
  }

  private renderTextDiff(diff: ITextDiff) {
    if (enableExperimentalDiffViewer() || this.props.showSideBySideDiff) {
      return (
        <SideBySideDiff
          file={this.props.file}
          diff={diff}
          fileContents={this.props.fileContents}
          hideWhitespaceInDiff={this.props.hideWhitespaceInDiff}
          showSideBySideDiff={this.props.showSideBySideDiff}
          onIncludeChanged={this.props.onIncludeChanged}
          onDiscardChanges={this.props.onDiscardChanges}
          askForConfirmationOnDiscardChanges={
            this.props.askForConfirmationOnDiscardChanges
          }
          onHideWhitespaceInDiffChanged={
            this.props.onHideWhitespaceInDiffChanged
          }
          showDiffCheckMarks={this.props.showDiffCheckMarks}
        />
      )
    }

    return (
      <TextDiff
        file={this.props.file}
        readOnly={this.props.readOnly}
        hideWhitespaceInDiff={this.props.hideWhitespaceInDiff}
        onIncludeChanged={this.props.onIncludeChanged}
        onDiscardChanges={this.props.onDiscardChanges}
        diff={diff}
        fileContents={this.props.fileContents}
        askForConfirmationOnDiscardChanges={
          this.props.askForConfirmationOnDiscardChanges
        }
        onHideWhitespaceInDiffChanged={this.props.onHideWhitespaceInDiffChanged}
      />
    )
  }

  private showLargeDiff = () => {
    this.setState({ forceShowLargeDiff: true })
  }
}
