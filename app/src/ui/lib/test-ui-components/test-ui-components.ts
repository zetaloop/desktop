import uuid from 'uuid'
import { TestMenuEvent } from '../../../main-process/menu'
import {
  isRepositoryWithGitHubRepository,
  Repository,
} from '../../../models/repository'
import { Dispatcher } from '../../dispatcher'
import { assertNever } from '../../../lib/fatal-error'
import {
  ExternalEditorError,
  suggestedExternalEditor,
} from '../../../lib/editors/shared'
import { updateStore } from '../update-store'
import { enableTestMenuItems } from '../../../lib/feature-flag'
import { Banner, BannerType } from '../../../models/banner'
import { PopupType } from '../../../models/popup'
import { CloningRepository } from '../../../models/cloning-repository'
import { generateDevReleaseSummary } from '../../../lib/release-notes'
import { ReleaseNote } from '../../../models/release-notes'
import { getVersion } from '../app-proxy'
import { Emoji } from '../../../lib/emoji'

export function showTestUI(
  name: TestMenuEvent,
  repository: Repository | CloningRepository | null,
  dispatcher: Dispatcher,
  emoji: Map<string, Emoji>
) {
  if (!__DEV__ && !enableTestMenuItems()) {
    return
  }

  switch (name) {
    case 'boomtown':
      return boomtown()
    case 'test-app-error':
      return testAppError()
    case 'test-arm64-banner':
      return showFakeUpdateBanner({ isArm64: true })
    case 'test-cherry-pick-conflicts-banner':
      return showFakeCherryPickConflictBanner()
    case 'test-icons':
      return showIconTestDialog()
    case 'test-merge-successful-banner':
      return showFakeMergeSuccessfulBanner()
    case 'test-no-external-editor':
      return showTestNoExternalEditor()
    case 'test-notification':
      return testShowNotification()
    case 'test-prune-branches':
      return testPruneBranches()
    case 'test-release-notes-popup':
      return showFakeReleaseNotesPopup()
    case 'test-reorder-banner':
      return showFakeReorderBanner()
    case 'test-showcase-update-banner':
      return showFakeUpdateBanner({ isShowcase: true })
    case 'test-thank-you-banner':
      return showFakeThankYouBanner()
    case 'test-thank-you-popup':
      return showFakeThankYouPopup()
    case 'test-undone-banner':
      return showFakeUndoneBanner()
    case 'test-update-banner':
      return showFakeUpdateBanner({})
    default:
      return assertNever(name, `Unknown menu event name: ${name}`)
  }

  function boomtown() {
    setImmediate(() => {
      throw new Error('Boomtown!')
    })
  }

  function testAppError() {
    return dispatcher.postError(
      new Error('错误测试 - 使用默认错误处理方式 ' + uuid())
    )
  }

  function showFakeUpdateBanner(options: {
    isArm64?: boolean
    isShowcase?: boolean
  }) {
    updateStore.setIsx64ToARM64ImmediateAutoUpdate(options.isArm64 === true)

    if (options.isShowcase) {
      dispatcher.setUpdateShowCaseVisibility(true)
      return
    }

    dispatcher.setUpdateBannerVisibility(true)
  }

  function showFakeCherryPickConflictBanner() {
    dispatcher.setBanner({
      type: BannerType.CherryPickConflictsFound,
      targetBranchName: 'fake-branch',
      onOpenConflictsDialog: () => {},
    })
  }

  function showIconTestDialog() {
    dispatcher.showPopup({
      type: PopupType.TestIcons,
    })
  }

  function showFakeMergeSuccessfulBanner() {
    dispatcher.setBanner({
      type: BannerType.SuccessfulMerge,
      ourBranch: 'fake-branch',
    })
  }

  function showTestNoExternalEditor() {
    dispatcher.postError(
      new ExternalEditorError(
        `未找到合适的编辑器。在电脑上安装 ${suggestedExternalEditor.name} 并重启 GitHub Desktop 再试一次吧。`,
        { suggestDefaultEditor: true }
      )
    )
  }

  function testShowNotification() {
    // if current repository is not repository with github repository, return
    if (
      repository == null ||
      repository instanceof CloningRepository ||
      !isRepositoryWithGitHubRepository(repository)
    ) {
      return
    }

    dispatcher.showPopup({
      type: PopupType.TestNotifications,
      repository,
    })
  }

  function testPruneBranches() {
    dispatcher.testPruneBranches()
  }

  async function showFakeReleaseNotesPopup() {
    dispatcher.showPopup({
      type: PopupType.ReleaseNotes,
      newReleases: await generateDevReleaseSummary(),
    })
  }

  function showFakeReorderBanner() {
    dispatcher.setBanner({
      type: BannerType.SuccessfulReorder,
      count: 1,
      onUndo: () => {
        dispatcher.setBanner({
          type: BannerType.ReorderUndone,
          commitsCount: 1,
        })
      },
    })
  }

  function showFakeThankYouBanner() {
    const userContributions: ReadonlyArray<ReleaseNote> = [
      {
        kind: 'fixed',
        message: '一个特别棒的bug修复，修好了某个问题 - #123。谢谢！',
      },
      {
        kind: 'added',
        message: '这个新功能它真是又新又功能啊 - #456。谢谢！',
      },
    ]

    const banner: Banner = {
      type: BannerType.OpenThankYouCard,
      // Grab emoji's by reference because we could still be loading emoji's
      emoji,
      onOpenCard: () =>
        dispatcher.showPopup({
          type: PopupType.ThankYou,
          userContributions,
          friendlyName: '测试用户',
          latestVersion: getVersion(),
        }),
      onThrowCardAway: () => {
        console.log('Thrown away :(....')
      },
    }
    dispatcher.setBanner(banner)
  }

  function showFakeThankYouPopup() {
    dispatcher.showPopup({
      type: PopupType.ThankYou,
      userContributions: [
        {
          kind: 'new',
          message: '[新功能] 假的感谢小卡片',
        },
      ],
      friendlyName: '某位心善的开发者',
      latestVersion: '3.0.0',
    })
  }

  function showFakeUndoneBanner() {
    dispatcher.setBanner({
      type: BannerType.ReorderUndone,
      commitsCount: 1,
    })
  }
}
