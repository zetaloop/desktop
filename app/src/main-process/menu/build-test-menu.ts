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
      label: 'Command Line Tool',
      submenu: [
        {
          label: 'Install',
          click: emit('install-windows-cli'),
        },
        {
          label: 'Uninstall',
          click: emit('uninstall-windows-cli'),
        },
      ],
    })
  }

  testMenuItems.push(
    separator,
    {
      label: 'Crash main process…',
      click() {
        throw new Error('Boomtown!')
      },
    },
    {
      label: 'Crash renderer process…',
      click: emit('boomtown'),
    },
    {
      label: 'Prune branches',
      click: emit('test-prune-branches'),
    },
    {
      label: 'Show notification',
      click: emit('test-notification'),
    },
    {
      label: 'Show popup',
      submenu: [
        {
          label: 'Release notes',
          click: emit('test-release-notes-popup'),
        },
        {
          label: 'Thank you',
          click: emit('test-thank-you-popup'),
        },
        {
          label: 'Show App Error',
          click: emit('test-app-error'),
        },
        {
          label: 'Octicons',
          click: emit('test-icons'),
        },
      ],
    },
    {
      label: 'Show banner',
      submenu: [
        {
          label: 'Update banner',
          click: emit('test-update-banner'),
        },
        {
          label: `Showcase Update banner`,
          click: emit('test-showcase-update-banner'),
        },
        {
          label: `${__DARWIN__ ? 'Apple silicon' : 'Arm64'} banner`,
          click: emit('test-arm64-banner'),
        },
        {
          label: 'Thank you',
          click: emit('test-thank-you-banner'),
        },
        {
          label: 'Reorder Successful',
          click: emit('test-reorder-banner'),
        },
        {
          label: 'Reorder Undone',
          click: emit('test-undone-banner'),
        },
        {
          label: 'Cherry Pick Conflicts',
          click: emit('test-cherry-pick-conflicts-banner'),
        },
        {
          label: 'Merge Successful',
          click: emit('test-merge-successful-banner'),
        },
      ],
    },
    {
      label: 'Show Error Dialogs',
      submenu: [
        {
          label: 'No External Editor',
          click: emit('test-no-external-editor'),
        },
        {
          label: 'Generic Git Authentication',
          click: emit('test-generic-git-authentication'),
        },
        {
          label: 'Newer Commits On Remote',
          click: emit('test-newer-commits-on-remote'),
        },
        {
          label: 'Update Existing Git LFS Filters?',
          click: emit('test-update-existing-git-lfs-filters'),
        },
        {
          label: 'Upstream Already Exists',
          click: emit('test-upstream-already-exists'),
        },
      ],
    }
  )

  return testMenuItems
}
