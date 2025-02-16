> [!TIP]
> This is the community Chinese localized version of GitHub Desktop, please visit [desktop/desktop](https://github.com/desktop/desktop).<br>
> 这是 GitHub Desktop 的社区汉化版，原版请访问 [desktop/desktop](https://github.com/desktop/desktop)。

# GitHub Desktop 中文版

[GitHub Desktop](https://desktop.github.com/) 是一个开源的 GitHub 客户端，基于 [Electron](https://www.electronjs.org/) 技术，使用 [React](https://reactjs.org/) 框架，以 [TypeScript](https://www.typescriptlang.org) 编写。

汉化版基于原版源码，将界面元素和控制逻辑修改为中文，而后重新构建发布。<br>
此方法与文本替换补丁相比，汉化更加彻底。

<picture>
  <source
    srcset="https://user-images.githubusercontent.com/634063/202742848-63fa1488-6254-49b5-af7c-96a6b50ea8af.png"
    media="(prefers-color-scheme: dark)"
  />
  <img
    width="1072"
    src="https://user-images.githubusercontent.com/634063/202742985-bb3b3b94-8aca-404a-8d8a-fd6a6f030672.png"
    alt="GitHub Desktop 软件截图，其中显示了两位协作者正在查看和准备提交一些改动"
  />
</picture>

## 安装

[**前往 GitHub 发行版**](https://github.com/zetaloop/desktop/releases/latest) 下载对应系统的中文版安装包：

 - macOS --> `GitHubDesktop-macOS-x64.zip`
 - macOS (Apple Silicon) --> `GitHubDesktop-macOS-arm64.zip`
 - Windows --> `GitHubDesktop-Windows-x64.exe`
 - Windows 为所有用户安装 --> `GitHubDesktop-Windows-x64.msi`

暂未支持 Linux 系统，但是有第三方维护的分支可供使用，见 [社区发布版](https://github.com/zetaloop/Desktop#社区发布版) 一节。

### Beta 测试版

想要更早体验到新功能和问题修复吗？[安装 Beta 测试版](https://github.com/zetaloop/desktop/releases) 即可提前体验开发中的早期版本：

 - macOS --> `GitHubDesktop-macOS-x64.zip`
 - macOS (Apple Silicon) --> `GitHubDesktop-macOS-arm64.zip`
 - Windows --> `GitHubDesktop-Windows-x64.exe`
 - Windows 为所有用户安装 --> `GitHubDesktop-Windows-x64.msi`

查看 [测试版更新日志](https://desktop.github.com/release-notes/?env=beta)。

### 旧的版本
可在 [GitHub 发行版](https://github.com/zetaloop/desktop/releases) 下载中文版旧版。旧版本将会在安装后尝试自动更新到最新版本。

### 社区发布版（英文原版）

可以使用一些社区维护的包管理器来安装 GitHub Desktop 英文原版：
 - Windows 用户可以用 [winget](https://docs.microsoft.com/en-us/windows/package-manager/winget/) `c:\> winget install github-desktop` 或者 [Chocolatey](https://chocolatey.org/) `c:\> choco install github-desktop`
 - macOS 用户可以用 [Homebrew](https://brew.sh/) `$ brew install --cask github`

各 Linux 发行版的安装包可在 [`shiftkey/desktop`](https://github.com/shiftkey/desktop) 分支中下载。

## GitHub Desktop 适合我吗？这款软件的开发重心是什么？

[阅读我们的设计理念](https://github.com/zetaloop/Desktop/blob/development/docs/process/what-is-desktop.md)，了解 GitHub Desktop 软件的开发重心和目标用户。

对于该汉化版，我的翻译理念是，尽可能让用户更好理解如何使用它。不会追求符合原文、符合惯例。

如果您觉得有些译文不好、不符合您的习惯、~~译者简直是大坏蛋~~，欢迎 [创建议题](https://github.com/zetaloop/desktop/issues/new/choose) 告诉我 :3

## 使用时遇到问题

> [!NOTE]
> 如要向官方反馈程序问题，请使用 **英文原版** 来复现。<br>
> 下列说明均为英文原版相关说明。如有翻译问题请联系 zetaloop。

注意：参与此项目时需要遵守 [GitHub Desktop 行为准则](https://github.com/desktop/desktop/blob/development/CODE_OF_CONDUCT.md)。

首先，请在 [打开的议题](https://github.com/desktop/desktop/issues?q=is%3Aopen) 和 [关闭的议题](https://github.com/desktop/desktop/issues?q=is%3Aclosed) 中搜索，看看你的问题是否已经有人反馈过，或者刚修复。

也可在 [已知问题列表](https://github.com/desktop/desktop/blob/development/docs/known-issues.md) 中查看我们正在跟踪的问题，它可能已经有解决方法了。

如果没有找到和你一样的问题，请 [创建议题](https://github.com/desktop/desktop/issues/new/choose)，选择合适的模板，并提供足够的信息以便我们进一步调查。

## 我反馈的问题一直没修复，我该怎么办？

如果议题发出之后几天没人回复，你可以在议题中友好地 “@” 提醒一下维护者，但是不要超过两次。维护者们时间与资源有限，而分析一个问题可能又困难又耗时。我们会尽力为你指明方向，但无法保证能够深入研究每一个问题。

## 如何为 GitHub Desktop 做出贡献？

阅读 [`CONTRIBUTING.md`](./.github/CONTRIBUTING.md) 来了解如何配置并熟悉项目代码。[文档](docs/) 文件夹里还有更多相关文档可供参考。

如果你在寻找任务，可以查看带有 [help wanted（请求帮助）](https://github.com/desktop/desktop/issues?q=is%3Aissue+is%3Aopen+label%3A%22help%20wanted%22) 标签的议题。

## 编译 Desktop

阅读 [`setup.md`](./docs/contributing/setup.md) 来了解如何配置 Desktop 的开发环境。

## 更多资源

访问 [desktop.github.com](https://desktop.github.com) 官网获取更多关于 GitHub Desktop 的产品信息。

查看 [入门文档](https://docs.github.com/zh-cn/desktop/overview/getting-started-with-github-desktop) 了解如何安装、登录和配置 GitHub Desktop。

## 许可证

**[MIT 许可证](LICENSE)**

MIT 许可证所授予的权利不适用于 GitHub 的商标，包括但不限于标志设计。GitHub 对其所有商标拥有完整的商标权和著作权保护。GitHub 的标志包含，例如，在 [logos](app/static/logos) 文件夹中的，文件名含有 "logo" 的 Invertocat（章鱼猫剪影）风格化设计图。

GitHub® 及其风格化变体，以及 Invertocat 标志，均为 GitHub 的商标或已注册商标。使用 GitHub 的标志时，请务必遵守 GitHub 的 [标志使用指南](https://github.com/logos)。
