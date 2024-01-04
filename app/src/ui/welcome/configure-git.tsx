import * as React from 'react'
import { WelcomeStep } from './welcome'
import { Account } from '../../models/account'
import { ConfigureGitUser } from '../lib/configure-git-user'
import { Button } from '../lib/button'

interface IConfigureGitProps {
  readonly accounts: ReadonlyArray<Account>
  readonly advance: (step: WelcomeStep) => void
  readonly done: () => void
  readonly globalUserName: string | undefined
  readonly globalUserEmail: string | undefined
}

/** The Welcome flow step to configure git. */
export class ConfigureGit extends React.Component<IConfigureGitProps, {}> {
  public render() {
    return (
      <section id="configure-git" aria-label="配置 Git">
        <h1 className="welcome-title">配置 Git</h1>
        <p className="welcome-text">
          这些信息会标记在您的提交上。发布提交后，所有人都能看到作者是谁。
        </p>

        <ConfigureGitUser
          accounts={this.props.accounts}
          onSave={this.props.done}
          saveLabel="完成"
          globalUserName={this.props.globalUserName}
          globalUserEmail={this.props.globalUserEmail}
        >
          <Button onClick={this.cancel}>取消</Button>
        </ConfigureGitUser>
      </section>
    )
  }

  private cancel = () => {
    this.props.advance(WelcomeStep.Start)
  }
}
