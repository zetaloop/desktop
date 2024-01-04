import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'
import { Ref } from '../lib/ref'

interface IGitIgnoreProps {
  readonly text: string | null
  readonly onIgnoreTextChanged: (text: string) => void
  readonly onShowExamples: () => void
}

/** A view for creating or modifying the repository's gitignore file */
export class GitIgnore extends React.Component<IGitIgnoreProps, {}> {
  public render() {
    return (
      <DialogContent>
        <p>
          编辑 <Ref>.gitignore</Ref> 文件，这个文件告诉 Git
          需要忽略哪些文件。已经被跟踪的文件不受影响。
          <LinkButton onClick={this.props.onShowExamples}>
            阅读 gitignore 的说明文档
          </LinkButton>
        </p>

        <TextArea
          placeholder="忽略的文件"
          value={this.props.text || ''}
          onValueChanged={this.props.onIgnoreTextChanged}
          textareaClassName="gitignore"
        />
      </DialogContent>
    )
  }
}
