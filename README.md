> [!WARNING]
> ### 汉化尚未完工，预览版请前往 [Actions 工作流](https://github.com/zetaloop/Desktop-CN/actions) 下载，不定时更新
> ### 翻译内容全部完成后，将会跟随官方 Beta 版持续发布
> ##### （随上游同步更新正是源码汉化的优势，Desktop 这种频繁更新的软件还每一版重制一份汉化的真是浪费力气）
# GitHub Desktop 中文版

[GitHub Desktop](https://desktop.github.com/) 是一个开源的 GitHub 客户端，基于 [Electron](https://www.electronjs.org/) 技术，使用 [React](https://reactjs.org/) 框架，以 [TypeScript](https://www.typescriptlang.org) 编写。

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

下载对应系统的官方安装包：

 - [macOS](https://central.github.com/deployments/desktop/desktop/latest/darwin)
 - [macOS (Apple Silicon)](https://central.github.com/deployments/desktop/desktop/latest/darwin-arm64)
 - [Windows](https://central.github.com/deployments/desktop/desktop/latest/win32)
 - [Windows 为所有用户安装](https://central.github.com/deployments/desktop/desktop/latest/win32?format=msi)

暂未支持 Linux 系统，但是有第三方维护的分支可供使用，见 [社区发布版](https://github.com/zetaloop/Desktop-CN#社区发布版) 一节。

### Beta 测试版

想要更早体验到新功能和问题修复吗？安装 Beta 测试版即可提前体验开发中的早期版本：

 - [macOS](https://central.github.com/deployments/desktop/desktop/latest/darwin?env=beta)
 - [macOS (Apple Silicon)](https://central.github.com/deployments/desktop/desktop/latest/darwin-arm64?env=beta)
 - [Windows](https://central.github.com/deployments/desktop/desktop/latest/win32?env=beta)
 - [Windows (ARM64)](https://central.github.com/deployments/desktop/desktop/latest/win32-arm64?env=beta)

查看 [测试版更新日志](https://desktop.github.com/release-notes/?env=beta)。

### 社区发布版

一些社区维护的包管理器可用于安装 GitHub Desktop：
 - Windows 用户可以用 [winget](https://docs.microsoft.com/en-us/windows/package-manager/winget/) `c:\> winget install github-desktop` 或者 [Chocolatey](https://chocolatey.org/) `c:\> choco install github-desktop`
 - macOS 用户可以用 [Homebrew](https://brew.sh/) `$ brew install --cask github`

各 Linux 发行版的安装包可在 [`shiftkey/desktop`](https://github.com/shiftkey/desktop) 分支中下载。

## GitHub Desktop 适合我吗？该软件的开发重心是什么？

[此文档](https://github.com/zetaloop/desktop/blob/development/docs/process/what-is-desktop.md) 描述了 GitHub Desktop 软件的开发重心和目标用户。

## I have a problem with GitHub Desktop

Note: The [GitHub Desktop Code of Conduct](https://github.com/desktop/desktop/blob/development/CODE_OF_CONDUCT.md) applies in all interactions relating to the GitHub Desktop project.

First, please search the [open issues](https://github.com/desktop/desktop/issues?q=is%3Aopen)
and [closed issues](https://github.com/desktop/desktop/issues?q=is%3Aclosed)
to see if your issue hasn't already been reported (it may also be fixed).

There is also a list of [known issues](https://github.com/desktop/desktop/blob/development/docs/known-issues.md)
that are being tracked against Desktop, and some of these issues have workarounds.

If you can't find an issue that matches what you're seeing, open a [new issue](https://github.com/desktop/desktop/issues/new/choose),
choose the right template and provide us with enough information to investigate
further.

## The issue I reported isn't fixed yet. What can I do?

If nobody has responded to your issue in a few days, you're welcome to respond to it with a friendly ping in the issue. Please do not respond more than a second time if nobody has responded. The GitHub Desktop maintainers are constrained in time and resources, and diagnosing individual configurations can be difficult and time consuming. While we'll try to at least get you pointed in the right direction, we can't guarantee we'll be able to dig too deeply into any one person's issue.

## 如何为 GitHub Desktop 做出贡献？

阅读 [CONTRIBUTING.md](./.github/CONTRIBUTING.md) 了解如何document will help you get setup and
familiar with the source. The [documentation](docs/) folder also contains more
resources relevant to the project.

If you're looking for something to work on, check out the [help wanted](https://github.com/desktop/desktop/issues?q=is%3Aissue+is%3Aopen+label%3A%22help%20wanted%22) label.

## 编译 Desktop

阅读 [`setup.md`](./docs/contributing/setup.md) 来了解如何配置 Desktop 的开发环境。

## 更多资源

访问 [desktop.github.com](https://desktop.github.com) 官网获取更多关于 GitHub Desktop 的产品信息。

查看 [入门文档](https://docs.github.com/zh-cn/desktop/overview/getting-started-with-github-desktop) 了解如何安装、登录和配置 GitHub Desktop。

## 许可证

**[MIT 许可证](LICENSE)**

MIT 许可证所授予的权利不适用于 GitHub 的商标，包括但不限于标志设计。GitHub 对其所有商标拥有完整的商标权和著作权保护。GitHub 的标志包含，例如，在 [logos](app/static/logos) 文件夹中的，文件名含有 "logo" 的 Invertocat（章鱼猫剪影）风格化设计图。

GitHub® 及其风格化变体，以及 Invertocat 标志，均为 GitHub 的商标或已注册商标。使用 GitHub 的标志时，请务必遵守 GitHub 的 [标志使用指南](https://github.com/logos)。
