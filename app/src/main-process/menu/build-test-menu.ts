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
      label: 'Confirm Committing Conflicted Files',
      click: emit('test-confirm-committing-conflicted-files'),
    },
    {
      label: 'Discarded Changes Will Be Unrecoverable',
      click: emit('test-discarded-changes-will-be-unrecoverable'),
    },
    {
      label: 'Do you want to fork this repository?',
      click: emit('test-do-you-want-fork-this-repository'),
    },
    {
      label: 'Newer Commits On Remote',
      click: emit('test-newer-commits-on-remote'),
    },
    {
      label: 'Files Too Large',
      click: emit('test-files-too-large'),
    },
    {
      label: 'Generic Git Authentication',
      click: emit('test-generic-git-authentication'),
    },
    {
      label: 'Invalidated Account Token',
      click: emit('test-invalidated-account-token'),
    },
  ]

  if (__DARWIN__) {
    errorDialogsSubmenu.push({
      label: 'Move to Application Folder',
      click: emit('test-move-to-application-folder'),
    })
  }

  errorDialogsSubmenu.push(
    {
      label: 'Push Rejected',
      click: emit('test-push-rejected'),
    },
    {
      label: 'Re-Authorization Required',
      click: emit('test-re-authorization-required'),
    },
    {
      label: 'Unable to Locate Git',
      click: emit('test-unable-to-locate-git'),
    },
    {
      label: 'Unable to Open External Editor',
      click: emit('test-no-external-editor'),
    },
    {
      label: 'Unable to Open Shell',
      click: emit('test-unable-to-open-shell'),
    },
    {
      label: 'Untrusted Server',
      click: emit('test-untrusted-server'),
    },
    {
      label: 'Update Existing Git LFS Filters?',
      click: emit('test-update-existing-git-lfs-filters'),
    },
    {
      label: 'Upstream Already Exists',
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
          label: 'OS Version No Longer Supported',
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
