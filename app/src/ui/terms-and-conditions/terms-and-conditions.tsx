import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'

interface ITermsAndConditionsProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
}

const contact = 'https://github.com/contact'
const logos = 'https://github.com/logos'
const privacyStatement =
  'https://docs.github.com/zh/site-policy/privacy-policies/github-general-privacy-statement'
const license = 'https://creativecommons.org/licenses/by/4.0/'

export class TermsAndConditions extends React.Component<
  ITermsAndConditionsProps,
  {}
> {
  public render() {
    return (
      <Dialog
        id="terms-and-conditions"
        title="GitHub 开源应用条款与条件"
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            译者注：本中文版本仅供参考，若与英文原版有任何不一致之处，请以英文原版为准。
          </p>

          <p>
            GitHub
            开源应用程序条款和条件（“应用程序条款”）是您（无论是个人还是代表一个实体）与
            GitHub 公司之间关于您使用 GitHub 应用程序（如 GitHub
            Desktop™）及相关文档（“软件”）的法律协议。本应用程序条款适用于软件的可执行代码版本。软件的源代码可在开源软件许可证协议下单独免费获取。如果您不同意本应用程序条款中的所有条款，请勿下载、安装、使用或复制该软件。
          </p>

          <h2>连接到 GitHub</h2>

          <p>
            如果您将软件配置为与 GitHub.com 网站上的一个或多个账户或 GitHub
            Enterprise Server 的实例一起使用，您对该软件的使用也将受适用于您的
            GitHub.com 网站服务条款和/或适用于您 GitHub Enterprise
            实例的许可协议（“GitHub 条款”）的约束。
          </p>

          <p>
            任何违反适用的 GitHub
            条款而使用该软件的行为，也将构成对本应用程序条款的违反。
          </p>

          <h2>开源许可证和通知</h2>

          <p>
            软件的开源许可证包含在随软件提供的“开源许可”文档中。该文档还包括所有适用开源许可证的副本。
          </p>

          <p>
            在适用的开源组件许可证条款要求 GitHub
            提供与软件相关的源代码的范围内，此类要约特此提出，您可通过联系
            GitHub 来行使：
            <LinkButton uri={contact}>联系</LinkButton>。
          </p>

          <p>
            除非与 GitHub 有书面约定，您与 GitHub
            的协议始终至少包括本应用程序条款。软件源代码的开源软件许可证构成单独的书面协议。在开源软件许可证明确取代本应用程序条款的有限范围内，开源许可证将管辖您与
            GitHub 之间关于使用软件或特定包含组件的协议。
          </p>

          <h2>GitHub 的商标</h2>

          <p>
            软件中包含的许可授予不适用于 GitHub
            的商标，包括软件的徽标设计。GitHub 保留所有 GitHub
            商标的商标和版权。GitHub 的徽标包括，例如，在 “logos”
            文件夹中文件名称包含 “logo” 的风格化设计。
          </p>

          <p>
            “GitHub”、“GitHub Desktop”、“GitHub for Mac”、“GitHub for
            Windows”、“Atom”、“Octocat” 以及相关的 GitHub 徽标和/或风格化名称是
            GitHub 的商标。除非{' '}
            <LinkButton uri={logos}>GitHub 的徽标和使用政策</LinkButton>{' '}
            允许，或者获得 GitHub
            事先的书面许可，您同意不以任何方式展示或使用这些商标。
          </p>

          <h2>隐私</h2>

          <p>
            软件可能会收集个人信息。您可以在设置面板中控制软件收集的信息。如果软件代表
            GitHub 收集个人信息，GitHub 将按照{' '}
            <LinkButton uri={privacyStatement}>GitHub 隐私声明</LinkButton>{' '}
            处理这些信息。
          </p>

          <h2>附加服务</h2>

          <h3>自动更新服务</h3>

          <p>
            软件可能包含自动更新服务（“服务”）。如果您选择使用该服务，或下载自动启用该服务的软件，GitHub
            将在有新版本可用时自动更新软件。
          </p>

          <h3>免责声明和责任限制</h3>

          <p>
            该服务按“现状”提供，不提供任何明示或暗示的保证。您使用该服务的风险由您自行承担。GitHub
            不保证：(1) 服务将满足您的特定需求；(2)
            服务与任何特定平台完全兼容；(3)
            您对服务的使用将不间断、及时、安全或无错误；(4)
            通过使用服务可能获得的结果是准确或可靠的；(5)
            您通过服务购买或获得的任何产品、服务、信息或其他材料的质量将符合您的期望；(6)
            服务中的任何错误将得到纠正。
          </p>

          <p>
            您明确理解并同意，GitHub
            对与服务相关的任何直接、间接、附带、特殊、后果性或惩罚性损害不承担责任，包括但不限于利润、商誉、使用、数据或其他无形损失的损害（即使
            GitHub 已被告知此类损害的可能性），包括但不限于：(1)
            使用或无法使用服务；(2)
            通过服务购买或获得的任何商品、数据、信息或服务，或通过服务收到的消息或进入的交易导致的替代商品和服务的采购成本；(3)
            未经授权访问或更改您的传输或数据；(4)
            服务上任何第三方的声明或行为；(5) 与服务相关的任何其他事项。
          </p>

          <p>
            GitHub
            保留随时修改或终止（暂时或永久）服务（或其任何部分）的权利，恕不另行通知。对于服务的任何价格变动、暂停或终止，GitHub
            对您或任何第三方不承担责任。
          </p>

          <h2>杂项</h2>

          <ol>
            <li>
              不放弃权利。GitHub
              未能行使或执行本应用程序条款的任何权利或规定，不构成对该权利或规定的放弃。
            </li>

            <li>
              完整协议。本应用程序条款，连同任何适用的隐私声明，构成您与 GitHub
              之间的完整协议，并管辖您对软件的使用，取代您与 GitHub
              之间的任何先前协议（包括但不限于任何先前版本的应用程序条款）。
            </li>

            <li>
              适用法律。您同意本应用程序条款及您对软件的使用受加利福尼亚州法律管辖，任何与软件相关的争议必须在位于加利福尼亚州旧金山或附近的有管辖权的法庭提出。
            </li>

            <li>
              第三方软件包。软件支持第三方
              “软件包”，这些软件包可能修改、添加、删除或更改软件的功能。这些软件包不受本应用程序条款的约束，可能包含其自己的许可证来管辖您对该特定软件包的使用。
            </li>

            <li>
              不可修改；完整协议。除非由 GitHub 授权代表签署的书面修订，或由
              GitHub
              发布的修订版本，否则本应用程序条款不得修改。本应用程序条款，连同任何适用的开源许可证和通知以及
              GitHub
              的隐私声明，构成您与我们之间协议的完整和独占声明。本应用程序条款取代任何提议或先前的口头或书面协议，以及您与
              GitHub 之间与这些条款主题相关的任何其他通信。
            </li>

            <li>
              GitHub 政策的许可证。本应用程序条款根据{' '}
              <LinkButton uri={license}>知识共享署名许可协议</LinkButton>{' '}
              授权。您可以根据知识共享许可协议的条款自由使用它。
            </li>

            <li>
              联系我们。请将关于本应用程序条款的任何问题发送至{' '}
              <LinkButton uri={contact}>support@github.com</LinkButton>。
            </li>
          </ol>

          <p>
            These GitHub Open Source Applications Terms and Conditions
            ("Application Terms") are a legal agreement between you (either as
            an individual or on behalf of an entity) and GitHub, Inc. regarding
            your use of GitHub's applications, such as GitHub Desktop™ and
            associated documentation ("Software"). These Application Terms apply
            to the executable code version of the Software. Source code for the
            Software is available separately and free of charge under open
            source software license agreements. If you do not agree to all of
            the terms in these Application Terms, do not download, install, use,
            or copy the Software.
          </p>

          <h2>Connecting to GitHub</h2>

          <p>
            If you configure the Software to work with one or more accounts on
            the GitHub.com website or with an instance of GitHub Enterprise
            Server, your use of the Software will also be governed your
            applicable GitHub.com website Terms of Service and/or the license
            agreement applicable to your instance of GitHub Enterprise ("GitHub
            Terms").
          </p>

          <p>
            Any use of the Software that violates your applicable GitHub Terms
            will also be a violation of these Application Terms.
          </p>

          <h2>Open Source Licenses and Notices</h2>

          <p>
            The open source license for the Software is included in the "Open
            Source Notices" documentation that is included with the Software.
            That documentation also includes copies of all applicable open
            source licenses.
          </p>

          <p>
            To the extent the terms of the licenses applicable to open source
            components require GitHub to make an offer to provide source code in
            connection with the Software, such offer is hereby made, and you may
            exercise it by contacting GitHub:{' '}
            <LinkButton uri={contact}>contact</LinkButton>.
          </p>

          <p>
            Unless otherwise agreed to in writing with GitHub, your agreement
            with GitHub will always include, at a minimum, these Application
            Terms. Open source software licenses for the Software's source code
            constitute separate written agreements. To the limited extent that
            the open source software licenses expressly supersede these
            Application Terms, the open source licenses govern your agreement
            with GitHub for the use of the Software or specific included
            components of the Software.
          </p>

          <h2>GitHub's Logos</h2>

          <p>
            The license grant included with the Software is not for GitHub's
            trademarks, which include the Software logo designs. GitHub reserves
            all trademark and copyright rights in and to all GitHub trademarks.
            GitHub's logos include, for instance, the stylized designs that
            include "logo" in the file title in the "logos" folder.
          </p>

          <p>
            The names GitHub, GitHub Desktop, GitHub for Mac, GitHub for
            Windows, Atom, the Octocat, and related GitHub logos and/or stylized
            names are trademarks of GitHub. You agree not to display or use
            these trademarks in any manner without GitHub's prior, written
            permission, except as allowed by GitHub's Logos and Usage Policy:{' '}
            <LinkButton uri={logos}>logos</LinkButton>.
          </p>

          <h2>Privacy</h2>

          <p>
            The Software may collect personal information. You may control what
            information the Software collects in the settings panel. If the
            Software does collect personal information on GitHub's behalf,
            GitHub will process that information in accordance with the
            <LinkButton uri={privacyStatement}>
              GitHub Privacy Statement
            </LinkButton>
            .
          </p>

          <h2>Additional Services</h2>

          <h3>Auto-Update Services</h3>

          <p>
            The Software may include an auto-update service ("Service"). If you
            choose to use the Service or you download Software that
            automatically enables the Service, GitHub will automatically update
            the Software when a new version is available.
          </p>

          <h3>Disclaimers and Limitations of Liability</h3>

          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" BASIS, AND NO WARRANTY, EITHER
            EXPRESS OR IMPLIED, IS GIVEN. YOUR USE OF THE SERVICE IS AT YOUR
            SOLE RISK. GitHub does not warrant that (i) the Service will meet
            your specific requirements; (ii) the Service is fully compatible
            with any particular platform; (iii) your use of the Service will be
            uninterrupted, timely, secure, or error-free; (iv) the results that
            may be obtained from the use of the Service will be accurate or
            reliable; (v) the quality of any products, services, information, or
            other material purchased or obtained by you through the Service will
            meet your expectations; or (vi) any errors in the Service will be
            corrected.
          </p>

          <p>
            YOU EXPRESSLY UNDERSTAND AND AGREE THAT GITHUB SHALL NOT BE LIABLE
            FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR
            EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO, DAMAGES FOR LOSS OF
            PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES (EVEN IF
            GITHUB HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES) RELATED
            TO THE SERVICE, including, for example: (i) the use or the inability
            to use the Service; (ii) the cost of procurement of substitute goods
            and services resulting from any goods, data, information or services
            purchased or obtained or messages received or transactions entered
            into through or from the Service; (iii) unauthorized access to or
            alteration of your transmissions or data; (iv) statements or conduct
            of any third-party on the Service; (v) or any other matter relating
            to the Service.
          </p>

          <p>
            GitHub reserves the right at any time and from time to time to
            modify or discontinue, temporarily or permanently, the Service (or
            any part thereof) with or without notice. GitHub shall not be liable
            to you or to any third-party for any price change, suspension or
            discontinuance of the Service.
          </p>

          <h2>Miscellanea</h2>

          <ol>
            <li>
              No Waiver. The failure of GitHub to exercise or enforce any right
              or provision of these Application Terms shall not constitute a
              waiver of such right or provision.
            </li>

            <li>
              Entire Agreement. These Application Terms, together with any
              applicable Privacy Notices, constitutes the entire agreement
              between you and GitHub and governs your use of the Software,
              superseding any prior agreements between you and GitHub
              (including, but not limited to, any prior versions of the
              Application Terms).
            </li>

            <li>
              Governing Law. You agree that these Application Terms and your use
              of the Software are governed under California law and any dispute
              related to the Software must be brought in a tribunal of competent
              jurisdiction located in or near San Francisco, California.
            </li>

            <li>
              Third-Party Packages. The Software supports third-party "Packages"
              which may modify, add, remove, or alter the functionality of the
              Software. These Packages are not covered by these Application
              Terms and may include their own license which governs your use of
              that particular package.
            </li>

            <li>
              No Modifications; Complete Agreement. These Application Terms may
              only be modified by a written amendment signed by an authorized
              representative of GitHub, or by the posting by GitHub of a revised
              version. These Application Terms, together with any applicable
              Open Source Licenses and Notices and GitHub's Privacy Statement,
              represent the complete and exclusive statement of the agreement
              between you and us. These Application Terms supersede any proposal
              or prior agreement oral or written, and any other communications
              between you and GitHub relating to the subject matter of these
              terms.
            </li>

            <li>
              License to GitHub Policies. These Application Terms are licensed
              under the{' '}
              <LinkButton uri={license}>
                Creative Commons Attribution license
              </LinkButton>
              . You may use it freely under the terms of the Creative Commons
              license.
            </li>

            <li>
              Contact Us. Please send any questions about these Application
              Terms to <LinkButton uri={contact}>support@github.com</LinkButton>
              .
            </li>
          </ol>
        </DialogContent>

        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
