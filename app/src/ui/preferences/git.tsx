import * as React from 'react'
import { DialogContent } from '../dialog'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'

interface IGitProps {
  readonly name: string
  readonly email: string
  readonly defaultBranch: string
  readonly isLoadingGitConfig: boolean
  readonly globalGitConfigPath: string | null

  readonly dotComAccount: Account | null
  readonly enterpriseAccount: Account | null

  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
  readonly onDefaultBranchChanged: (defaultBranch: string) => void

  readonly selectedExternalEditor: string | null
  readonly onOpenFileInExternalEditor: (path: string) => void
}

export class Git extends React.Component<IGitProps> {
  public render() {
    return (
      <DialogContent>
        {this.renderGitConfigAuthorInfo()}
        {this.renderDefaultBranchSetting()}
      </DialogContent>
    )
  }

  private renderGitConfigAuthorInfo() {
    return (
      <GitConfigUserForm
        email={this.props.email}
        name={this.props.name}
        isLoadingGitConfig={this.props.isLoadingGitConfig}
        enterpriseAccount={this.props.enterpriseAccount}
        dotComAccount={this.props.dotComAccount}
        onEmailChanged={this.props.onEmailChanged}
        onNameChanged={this.props.onNameChanged}
      />
    )
  }

  private renderDefaultBranchSetting() {
    return (
      <div className="default-branch-component">
        <h2 id="default-branch-heading">新建仓库默认分支名</h2>

        <RefNameTextBox
          initialValue={this.props.defaultBranch}
          onValueChange={this.props.onDefaultBranchChanged}
          ariaLabelledBy={'default-branch-heading'}
          ariaDescribedBy="default-branch-description"
          warningMessageVerb="saved"
        />

        <p id="default-branch-description" className="git-settings-description">
          GitHub 的默认分支名是 <Ref>main</Ref>
          。如果您的开发规范有特殊要求，或某些工具仍依赖旧的默认分支名{' '}
          <Ref>master</Ref>，可以在此设定所需名称。
        </p>

        <p className="git-settings-description">
          以上设置将会{' '}
          {this.props.selectedExternalEditor &&
          this.props.globalGitConfigPath ? (
            <LinkButton onClick={this.openGlobalGitConfigInEditor}>
              修改您的全局 Git 配置文件
            </LinkButton>
          ) : (
            '修改您的全局 Git 配置文件'
          )}
          。
        </p>
      </div>
    )
  }

  // This function is called to open the global git config file in the
  // user's default editor.
  private openGlobalGitConfigInEditor = () => {
    if (this.props.globalGitConfigPath) {
      this.props.onOpenFileInExternalEditor(this.props.globalGitConfigPath)
    }
  }
}
