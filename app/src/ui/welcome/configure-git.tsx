import * as React from 'react'
import { WelcomeStep } from './welcome'
import { Account } from '../../models/account'
import { ConfigureGitUser } from '../lib/configure-git-user'
import { Button } from '../lib/button'

interface IConfigureGitProps {
  readonly accounts: ReadonlyArray<Account>
  readonly advance: (step: WelcomeStep) => void
  readonly done: () => void
}

/** The Welcome flow step to configure git. */
export class ConfigureGit extends React.Component<IConfigureGitProps, {}> {
  public render() {
    return (
      <section id="configure-git" aria-label="Configure Git">
        <h1 className="welcome-title">配置 Git</h1>
        <p className="welcome-text">
          用于标记您的提交。如果您发布提交，任何人都可以看到这个信息。
        </p>

        <ConfigureGitUser
          accounts={this.props.accounts}
          onSave={this.props.done}
          saveLabel="完成"
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
