import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { PathText } from '../lib/path-text'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { UnknownAuthor } from '../../models/author'

interface IUnknownAuthorsProps {
  readonly authors: ReadonlyArray<UnknownAuthor>
  readonly onCommit: () => void
  readonly onDismissed: () => void
}

/**
 * Don't list more than this number of authors.
 */
const MaxAuthorsToList = 10

/** A component to confirm commit when unknown co-authors were added. */
export class UnknownAuthors extends React.Component<IUnknownAuthorsProps> {
  public constructor(props: IUnknownAuthorsProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        id="unknown-authors"
        title={__DARWIN__ ? '未知协作者' : '未知协作者'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.commit}
        type="warning"
      >
        <DialogContent>{this.renderAuthorList()}</DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? '仍要提交' : '仍要提交'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderAuthorList() {
    if (this.props.authors.length > MaxAuthorsToList) {
      return (
        <p>
          有{this.props.authors.length}
          个用户未找到，他们不能被添加为此次提交的协作者。确定要提交吗？
        </p>
      )
    } else {
      return (
        <div>
          <p>
            以下用户未找到，他们不能被添加为此次提交的协作者。确定要提交吗？
          </p>
          <div className="author-list">
            <ul>
              {this.props.authors.map(a => (
                <li key={a.username}>
                  <PathText path={a.username} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }
  }

  private commit = async () => {
    this.props.onCommit()
    this.props.onDismissed()
  }
}
