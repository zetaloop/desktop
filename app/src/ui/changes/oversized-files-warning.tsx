import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { PathText } from '../lib/path-text'
import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { ICommitContext } from '../../models/commit'
import { DefaultCommitMessage } from '../../models/commit-message'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

const GitLFSWebsiteURL =
  // 'https://help.github.com/articles/versioning-large-files/'
  'https://docs.github.com/zh/repositories/working-with-files/managing-large-files' // cn, 注意地址更新

interface IOversizedFilesProps {
  readonly oversizedFiles: ReadonlyArray<string>
  readonly onDismissed: () => void
  readonly dispatcher: Dispatcher
  readonly context: ICommitContext
  readonly repository: Repository
}

/** A dialog to display a list of files that are too large to commit. */
export class OversizedFiles extends React.Component<IOversizedFilesProps> {
  public constructor(props: IOversizedFilesProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        id="oversized-files"
        title={__DARWIN__ ? '文件过大' : '文件过大'}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        type="warning"
      >
        <DialogContent>
          <p>
            以下文件大小超过 100MB。
            <strong>
              如果您提交这些文件，那就没办法推送到 GitHub.com 了。
            </strong>
          </p>
          {this.renderFileList()}
          <p className="recommendation">
            推荐不要提交这么大的文件，或者可以使用{' '}
            <LinkButton uri={GitLFSWebsiteURL}>Git LFS</LinkButton> 来在 GitHub
            上储存大文件。
          </p>
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? '仍要提交' : '仍要提交'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderFileList() {
    return (
      <div className="files-list">
        <ul>
          {this.props.oversizedFiles.map(fileName => (
            <li key={fileName}>
              <PathText path={fileName} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  private onSubmit = async () => {
    this.props.onDismissed()

    await this.props.dispatcher.commitIncludedChanges(
      this.props.repository,
      this.props.context
    )

    this.props.dispatcher.setCommitMessage(
      this.props.repository,
      DefaultCommitMessage
    )
  }
}
