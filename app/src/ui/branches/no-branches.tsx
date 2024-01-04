import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Button } from '../lib/button'
import { KeyboardShortcut } from '../keyboard-shortcut/keyboard-shortcut'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-branches.svg'
)

interface INoBranchesProps {
  /** The callback to invoke when the user wishes to create a new branch */
  readonly onCreateNewBranch: () => void
  /** True to display the UI elements for creating a new branch, false to hide them */
  readonly canCreateNewBranch: boolean
  /** Optional: No branches message */
  readonly noBranchesMessage?: string | JSX.Element
}

export class NoBranches extends React.Component<INoBranchesProps> {
  public render() {
    if (this.props.canCreateNewBranch) {
      return (
        <div className="no-branches">
          <img src={BlankSlateImage} className="blankslate-image" alt="" />

          <div className="title">抱歉，找不到该分支</div>

          <div className="subtitle">您想创建这个分支吗？</div>

          <Button
            className="create-branch-button"
            onClick={this.props.onCreateNewBranch}
            type="submit"
          >
            {__DARWIN__ ? '新建分支' : '新建分支'}
          </Button>

          <div className="protip">
            小技巧！在软件里按{' '}
            <KeyboardShortcut
              darwinKeys={['⌘', '⇧', 'N']}
              keys={['Ctrl', 'Shift', 'N']}
            />{' '}
            可以新建分支
          </div>
        </div>
      )
    }

    return (
      <div className="no-branches">
        {this.props.noBranchesMessage ?? '抱歉，找不到该分支'}
      </div>
    )
  }
}
