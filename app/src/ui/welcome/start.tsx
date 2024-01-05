import * as React from 'react'
import { WelcomeStep } from './welcome'
import { LinkButton } from '../lib/link-button'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { BrowserRedirectMessage } from '../lib/authentication-form'
import { SamplesURL } from '../../lib/stats'

/**
 * The URL to the sign-up page on GitHub.com. Used in conjunction
 * with account actions in the app where the user might want to
 * consider signing up.
 */
export const CreateAccountURL = 'https://github.com/join?source=github-desktop'

interface IStartProps {
  readonly advance: (step: WelcomeStep) => void
  readonly dispatcher: Dispatcher
  readonly loadingBrowserAuth: boolean
}

/** The first step of the Welcome flow. */
export class Start extends React.Component<IStartProps, {}> {
  public render() {
    return (
      <section
        id="start"
        aria-label="Welcome to GitHub Desktop"
        aria-describedby="start-description"
      >
        <h1 className="welcome-title">欢迎使用 GitHub&nbsp;Desktop</h1>
        {!this.props.loadingBrowserAuth ? (
          <>
            <p id="start-description" className="welcome-text">
              GitHub Desktop 可以无缝对接 GitHub 与 GitHub
              企业版的项目。登录账号，开始处理您已有的项目吧。
            </p>
          </>
        ) : (
          <p>{BrowserRedirectMessage}</p>
        )}

        <div className="welcome-main-buttons">
          <Button
            type="submit"
            className="button-with-icon"
            disabled={this.props.loadingBrowserAuth}
            onClick={this.signInWithBrowser}
            autoFocus={true}
            role="link"
          >
            {this.props.loadingBrowserAuth && <Loading />}
            登录 GitHub.com
            <Octicon symbol={octicons.linkExternal} />
          </Button>
          {this.props.loadingBrowserAuth ? (
            <Button onClick={this.cancelBrowserAuth}>Cancel</Button>
          ) : (
            <Button onClick={this.signInToEnterprise}>
              登录 GitHub 企业版
            </Button>
          )}
        </div>
        <div className="skip-action-container">
          <p className="welcome-text">
            GitHub 新用户吗？{' '}
            <LinkButton uri={CreateAccountURL} className="create-account-link">
              点击免费创建账号
            </LinkButton>
            。
          </p>
          <LinkButton className="skip-button" onClick={this.skip}>
            跳过
          </LinkButton>
        </div>
        <div className="welcome-start-disclaimer-container">
          <p>
            创建账号即表示您同意{' '}
            <LinkButton uri={'https://github.com/site/terms'}>
              服务条款
            </LinkButton>
            。关于 GitHub 的详细隐私政策，请参阅{' '}
            <LinkButton uri={'https://github.com/site/privacy'}>
              隐私声明
            </LinkButton>
            。
          </p>
          <p>
            GitHub Desktop 会发送使用情况数据来帮助优化产品和调整功能。{' '}
            <LinkButton uri={SamplesURL}>
            了解使用情况数据
            </LinkButton>。
          </p>
        </div>
      </section>
    )
  }

  private signInWithBrowser = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }

    this.props.advance(WelcomeStep.SignInToDotComWithBrowser)
    this.props.dispatcher.requestBrowserAuthenticationToDotcom()
  }

  private cancelBrowserAuth = () => {
    this.props.advance(WelcomeStep.Start)
  }

  private signInToEnterprise = () => {
    this.props.advance(WelcomeStep.SignInToEnterprise)
  }

  private skip = () => {
    this.props.advance(WelcomeStep.ConfigureGit)
  }
}
