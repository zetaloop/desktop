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
  dispatcher: Dispatcher
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
      new Error('Test Error - to use default error handler' + uuid())
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
        `No suitable editors installed for GitHub Desktop to launch. Install ${suggestedExternalEditor.name} for your platform and restart GitHub Desktop to try again.`,
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
        message: 'A totally awesome fix that fixes something - #123. Thanks!',
      },
      {
        kind: 'added',
        message:
          'You can now do this new thing that was added here - #456. Thanks!',
      },
    ]

    const banner: Banner = {
      type: BannerType.OpenThankYouCard,
      // Grab emoji's by reference because we could still be loading emoji's
      emoji: new Map<string, Emoji>([
        [
          ':tada:',
          {
            emoji: '🎉',
            url: '',
            aliases: ['tada'],
          },
        ],
        [
          ':sob:',
          {
            emoji: '😭',
            url: '',
            aliases: ['sob'],
          },
        ],
      ]),
      onOpenCard: () =>
        dispatcher.showPopup({
          type: PopupType.ThankYou,
          userContributions,
          friendlyName: 'Test User',
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
          message: '[New] Added fake thank you dialog',
        },
      ],
      friendlyName: 'kind contributor',
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
