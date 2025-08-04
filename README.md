> [!TIP]
> This is the community Chinese localized version of GitHub Desktop, please visit [desktop/desktop](https://github.com/desktop/desktop).<br>
> 这是 GitHub Desktop 的社区汉化版，原版请访问 [desktop/desktop](https://github.com/desktop/desktop)。

# GitHub Desktop 中文版

一个开源的基于 [Electron](https://www.electronjs.org/) 的 Git 客户端。

<picture>
  <source
    srcset="https://github.com/user-attachments/assets/558a42a5-d41a-4790-94db-b5f943025ee7"
    media="(prefers-color-scheme: dark)"
  />
  <img
    width="1072"
    src="https://github.com/user-attachments/assets/a90d5aef-620d-49ab-9a72-3cd6e15a95ee"
    alt="GitHub Desktop 软件截图，其中显示了两位协作者正在查看和准备提交一些改动"
  />
</picture>

## 安装

请前往 [**最新发行版**](https://github.com/zetaloop/desktop/releases/latest) 中下载中文版安装包。

| 系统            | 下载哪个安装包                  | 说明           |
| --------------- | ------------------------------- | -------------- |
| Windows (x64)   | GitHubDesktop-Windows-x64.exe   | 一般请下载这个 |
| Windows (ARM64) | GitHubDesktop-Windows-arm64.exe |                |
| macOS (M)       | GitHubDesktop-macOS-arm64.zip   | 新款mac        |
| macOS (Intel)   | GitHubDesktop-macOS-x64.zip     | 旧款mac        |
| Linux           | 暂未汉化                        |                |

\* macOS 安装后如提示损坏，请运行 `xattr -rd com.apple.quarantine "GitHub Desktop.app"`。

\* Linux 可以试试这些英文版：[shiftkey/desktop](https://github.com/shiftkey/desktop)、[pol-rivero/github-desktop-plus](https://github.com/pol-rivero/github-desktop-plus)

## 特色

彻底的简中汉化，深入到
- 日期时间
- 报错内容
- 文档链接（改为官方中文版）
- 图片素材
- 无障碍读屏文本
- Git 命令行输出替换
- Electron 右键菜单替换
- 命令行工具汉化和 UTF8 编码问题修复

增强特性
- GitHub Copilot
  - 非 GitHub 仓库也能使用
  - 参考最近提交内容
  - 自定义提示词
  - 限制最大读取字数
- 基于 GitHub Pages 的自动更新渠道
- CI 自动构建

## 自动更新

更新服务器 [zetaloop/desktop-metadata](https://github.com/zetaloop/desktop-metadata) (GitHub Pages)

Windows：支持自动更新。<br>
macOS：支持自动更新。（签名问题已解决，下个版本开始支持）<br>
Linux：不支持，也许以后会开个软件包仓库。

## 问题

如果您发现有翻译文本造成误解，或者有功能异常的，请开启 Issue，或者邮箱联系。

## 许可证

**[MIT 许可证](LICENSE)**

MIT 许可证所授予的权利不适用于 GitHub 的商标，包括但不限于标志设计。GitHub 对其所有商标拥有完整的商标权和著作权保护。GitHub 的标志包含，例如，在 [logos](app/static/logos) 文件夹中的，文件名含有 "logo" 的 Invertocat（章鱼猫剪影）风格化设计图。

GitHub® 及其风格化变体，以及 Invertocat 标志，均为 GitHub 的商标或已注册商标。使用 GitHub 的标志时，请务必遵守 GitHub 的 [标志使用指南](https://github.com/logos)。
