import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

export class TutorialWelcome extends React.Component {
  public render() {
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>欢迎使用 GitHub Desktop</h1>
          <p>通过该教程来让您熟悉 Git、GitHub 和 GitHub Desktop。</p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} alt="Html 语法图标" />
            <p>
              <strong>Git</strong> 是一个代码的版本管理系统。
            </p>
          </li>
          <li>
            <img src={TeamDiscussionImage} alt="头顶着讨论气泡的人的图像" />
            <p>
              <strong>GitHub</strong> 是您储存代码、与他人协作的网站。
            </p>
          </li>
          <li>
            <img src={CloudServerImage} alt="云上的服务器机架图像" />
            <p>
              <strong>GitHub Desktop</strong> 软件安装在电脑上方便您与 GitHub
              交互。
            </p>
          </li>
        </ul>
      </div>
    )
  }
}
