import uuid from 'uuid'
import { TestMenuEvent } from '../../../main-process/menu'
import {
  isRepositoryWithGitHubRepository,
  Repository,
} from '../../../models/repository'
import { Dispatcher } from '../../dispatcher'
import { assertNever } from '../../../lib/fatal-error'
import { Emitter } from 'event-kit'
import {
  ExternalEditorError,
  suggestedExternalEditor,
} from '../../../lib/editors/shared'
import { updateStore } from '../update-store'
import { enableTestMenuItems } from '../../../lib/feature-flag'
import { BannerType } from '../../../models/banner'
import { PopupType } from '../../../models/popup'
import { CloningRepository } from '../../../models/cloning-repository'

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
      return testAppError(dispatcher)
    case 'test-arm64-banner':
      return showFakeUpdateBanner(dispatcher, { isArm64: true })
    case 'test-cherry-pick-conflicts-banner':
      return showFakeCherryPickConflictBanner(dispatcher)
    case 'test-icons':
      return showIconTestDialog(dispatcher)
    case 'test-merge-successful-banner':
      return showFakeMergeSuccessfulBanner(dispatcher)
    case 'test-no-external-editor':
      return showTestNoExternalEditor()
    case 'test-notification':
      return testShowNotification(repository, dispatcher)
    case 'test-prune-branches':
      return testPruneBranches()

    case 'test-release-notes-popup':
      return showFakeReleaseNotesPopup()

    case 'test-reorder-banner':
      return showFakeReorderBanner()

    case 'test-showcase-update-banner':
      return showFakeUpdateBanner(dispatcher, { isShowcase: true })

    case 'test-thank-you-banner':
      return showFakeThankYouBanner()

    case 'test-thank-you-popup':
      return showFakeThankYouPopup()

    case 'test-undone-banner':
      return showFakeUndoneBanner()

    case 'test-update-banner':
      return showFakeUpdateBanner(dispatcher, {})

    default:
      return assertNever(name, `Unknown menu event name: ${name}`)
  }
}

function boomtown() {
  setImmediate(() => {
    throw new Error('Boomtown!')
  })
}

function testAppError(dispatcher: Dispatcher) {
  return dispatcher.postError(
    new Error('Test Error - to use default error handler' + uuid())
  )
}

function showFakeUpdateBanner(
  dispatcher: Dispatcher,
  options: {
    isArm64?: boolean
    isShowcase?: boolean
  }
) {
  updateStore.setIsx64ToARM64ImmediateAutoUpdate(options.isArm64 === true)

  if (options.isShowcase) {
    dispatcher.setUpdateShowCaseVisibility(true)
    return
  }

  dispatcher.setUpdateBannerVisibility(true)
}

function showFakeCherryPickConflictBanner(dispatcher: Dispatcher) {
  dispatcher.setBanner({
    type: BannerType.CherryPickConflictsFound,
    targetBranchName: 'fake-branch',
    onOpenConflictsDialog: () => {},
  })
}

function showIconTestDialog(dispatcher: Dispatcher) {
  dispatcher.showPopup({
    type: PopupType.TestIcons,
  })
}

function showFakeMergeSuccessfulBanner(dispatcher: Dispatcher) {
  dispatcher.setBanner({
    type: BannerType.SuccessfulMerge,
    ourBranch: 'fake-branch',
  })
}

function showTestNoExternalEditor() {
  const emitter = new Emitter()
  emitter.emit(
    'did-error',
    new ExternalEditorError(
      `No suitable editors installed for GitHub Desktop to launch. Install ${suggestedExternalEditor.name} for your platform and restart GitHub Desktop to try again.`,
      { suggestDefaultEditor: true }
    )
  )
}

function testShowNotification(
  repository: Repository | CloningRepository | null,
  dispatcher: Dispatcher
) {
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
  throw new Error('Function not implemented.')
}

function showFakeReleaseNotesPopup() {
  throw new Error('Function not implemented.')
}

function showFakeReorderBanner() {
  throw new Error('Function not implemented.')
}

function showFakeThankYouBanner() {
  throw new Error('Function not implemented.')
}

function showFakeThankYouPopup() {
  throw new Error('Function not implemented.')
}

function showFakeUndoneBanner() {
  throw new Error('Function not implemented.')
}
