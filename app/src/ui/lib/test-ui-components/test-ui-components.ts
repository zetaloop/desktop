import uuid from 'uuid'
import { TestMenuEvent } from '../../../main-process/menu'
import { Repository } from '../../../models/repository'
import { Dispatcher } from '../../dispatcher'
import { assertNever } from '../../../lib/fatal-error'
import { Emitter } from 'event-kit'
import {
  ExternalEditorError,
  suggestedExternalEditor,
} from '../../../lib/editors/shared'

export function showTestUI(
  name: TestMenuEvent,
  repository: Repository | null,
  dispatcher: Dispatcher
) {
  switch (name) {
    case 'boomtown':
      return boomtown()
    case 'test-release-notes-popup':
      return showFakeReleaseNotesPopup()
    case 'test-thank-you-popup':
      return showFakeThankYouPopup()
    case 'test-notification':
      return testShowNotification()
    case 'test-prune-branches':
      return testPruneBranches()
    case 'test-app-error':
      return testAppError(dispatcher)
    case 'test-update-banner':
      return showFakeUpdateBanner()
    case 'test-arm64-banner':
      return showFakeUpdateBanner()
    case 'test-showcase-update-banner':
      return showFakeUpdateBanner()
    case 'test-thank-you-banner':
      return showFakeThankYouBanner()
    case 'test-reorder-banner':
      return showFakeReorderBanner()
    case 'test-undone-banner':
      return showFakeUpdateBanner()
    case 'test-cherry-pick-conflicts-banner':
      return showFakeCherryPickConflictBanner()
    case 'test-merge-successful-banner':
      return showFakeMergeSuccessfulBanner()
    case 'test-icons':
      return showIconTestDialog()
    case 'test-no-external-editor':
      return showTestNoExternalEditor(repository, dispatcher)
    default:
      return assertNever(name, `Unknown menu event name: ${name}`)
  }
}

function boomtown() {
  setImmediate(() => {
    throw new Error('Boomtown!')
  })
}

function showFakeReleaseNotesPopup() {
  throw new Error('Function not implemented.')
}

function showFakeThankYouPopup() {
  throw new Error('Function not implemented.')
}

function testShowNotification() {
  throw new Error('Function not implemented.')
}

function testPruneBranches() {
  throw new Error('Function not implemented.')
}

function testAppError(dispatcher: Dispatcher) {
  return dispatcher.postError(
    new Error('Test Error - to use default error handler' + uuid())
  )
}

function showFakeUpdateBanner() {
  throw new Error('Function not implemented.')
}

function showFakeThankYouBanner() {
  throw new Error('Function not implemented.')
}

function showFakeReorderBanner() {
  throw new Error('Function not implemented.')
}

function showFakeCherryPickConflictBanner() {
  throw new Error('Function not implemented.')
}

function showFakeMergeSuccessfulBanner() {
  throw new Error('Function not implemented.')
}

function showIconTestDialog() {
  throw new Error('Function not implemented.')
}

function showTestNoExternalEditor(
  repository: Repository | null,
  dispatcher: Dispatcher
) {
  const emitter = new Emitter()
  emitter.emit(
    'did-error',
    new ExternalEditorError(
      `No suitable editors installed for GitHub Desktop to launch. Install ${suggestedExternalEditor.name} for your platform and restart GitHub Desktop to try again.`,
      { suggestDefaultEditor: true }
    )
  )
}
