import { MenuItemConstructorOptions } from 'electron'
import { enableTestMenuItems } from '../../lib/feature-flag'
import { emit, separator } from './build-default-menu'

export function buildTestMenu() {
  if (!enableTestMenuItems()) {
    return []
  }

  const testMenuItems: MenuItemConstructorOptions[] = []

  if (__WIN32__) {
    testMenuItems.push(separator, {
      label: '命令行工具',
      submenu: [
        {
          label: '安装',
          click: emit('install-windows-cli'),
        },
        {
          label: '卸载',
          click: emit('uninstall-windows-cli'),
        },
      ],
    })
  }

  const errorDialogsSubmenu: MenuItemConstructorOptions[] = [
    {
      label: '确定提交冲突文件',
      click: emit('test-confirm-committing-conflicted-files'),
    },
    {
      label: '放弃改动无法恢复',
      click: emit('test-discarded-changes-will-be-unrecoverable'),
    },
    {
      label: '是否分叉该仓库？',
      click: emit('test-do-you-want-fork-this-repository'),
    },
    {
      label: '远程端有更新',
      click: emit('test-newer-commits-on-remote'),
    },
    {
      label: '文件过大',
      click: emit('test-files-too-large'),
    },
    {
      label: '通用 Git 验证',
      click: emit('test-generic-git-authentication'),
    },
    {
      label: '账号令牌失效',
      click: emit('test-invalidated-account-token'),
    },
  ]

  if (__DARWIN__) {
    errorDialogsSubmenu.push({
      label: '移动到应用程序文件夹',
      click: emit('test-move-to-application-folder'),
    })
  }

  errorDialogsSubmenu.push(
    {
      label: '推送被拒绝',
      click: emit('test-push-rejected'),
    },
    {
      label: '需要重新授权',
      click: emit('test-re-authorization-required'),
    },
    {
      label: '找不到 Git',
      click: emit('test-unable-to-locate-git'),
    },
    {
      label: '无法打开自定义编辑器',
      click: emit('test-no-external-editor'),
    },
    {
      label: '无法打开终端',
      click: emit('test-unable-to-open-shell'),
    },
    {
      label: '服务器不可信',
      click: emit('test-untrusted-server'),
    },
    {
      label: '更新当前的 Git LFS 过滤器？',
      click: emit('test-update-existing-git-lfs-filters'),
    },
    {
      label: '上游已存在',
      click: emit('test-upstream-already-exists'),
    }
  )

  testMenuItems.push(
    separator,
    {
      label: '主进程爆炸…',
      click() {
        throw new Error('Boomtown!')
      },
    },
    {
      label: '渲染进程爆炸…',
      click: emit('boomtown'),
    },
    {
      label: '修剪分支',
      click: emit('test-prune-branches'),
    },
    {
      label: '通知',
      click: emit('test-notification'),
    },
    {
      label: '弹窗',
      submenu: [
        {
          label: '更新日志',
          click: emit('test-release-notes-popup'),
        },
        {
          label: '感谢小卡片',
          click: emit('test-thank-you-popup'),
        },
        {
          label: '软件报错',
          click: emit('test-app-error'),
        },
        {
          label: 'Octicons 图标',
          click: emit('test-icons'),
        },
      ],
    },
    {
      label: '横幅',
      submenu: [
        {
          label: '更新',
          click: emit('test-update-banner'),
        },
        {
          label: '更新（强调）',
          click: emit('test-prioritized-update-banner'),
        },
        {
          label: `更新亮点展示`,
          click: emit('test-showcase-update-banner'),
        },
        {
          label: `${__DARWIN__ ? 'Apple silicon' : 'Arm64'} 更新`,
          click: emit('test-arm64-banner'),
        },
        {
          label: '感谢小卡片',
          click: emit('test-thank-you-banner'),
        },
        {
          label: '重排成功',
          click: emit('test-reorder-banner'),
        },
        {
          label: '重排撤销',
          click: emit('test-undone-banner'),
        },
        {
          label: '摘取冲突',
          click: emit('test-cherry-pick-conflicts-banner'),
        },
        {
          label: '合并成功',
          click: emit('test-merge-successful-banner'),
        },
        {
          label: '系统版本过低',
          click: emit('test-os-version-no-longer-supported'),
        },
      ],
    },
    {
      label: '报错',
      submenu: errorDialogsSubmenu,
    }
  )

  return testMenuItems
}
