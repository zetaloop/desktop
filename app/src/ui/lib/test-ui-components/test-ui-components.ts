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
import { GitHubRepository } from '../../../models/github-repository'
import { Account } from '../../../models/account'
import { ShellError } from '../../../lib/shells/error'
import { RetryActionType } from '../../../models/retry-actions'
import {
  AppFileStatusKind,
  WorkingDirectoryFileChange,
} from '../../../models/status'
import { DiffSelection, DiffSelectionType } from '../../../models/diff'

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
    case 'test-confirm-committing-conflicted-files':
      return showFakeConfirmCommittingConflictedFiles()
    case 'test-cherry-pick-conflicts-banner':
      return showFakeCherryPickConflictBanner()
    case 'test-discarded-changes-will-be-unrecoverable':
      return showFakeDiscardedChangesWillBeUnrecoverable()
    case 'test-do-you-want-fork-this-repository':
      return showFakeDoYouWantForkThisRepository()
    case 'test-files-too-large':
      return showFakeFilesTooLarge()
    case 'test-generic-git-authentication':
      return dispatcher.showPopup({
        type: PopupType.GenericGitAuthentication,
        remoteUrl: 'test-github.com',
        onSubmit: (login: string, token: string) => {},
        onDismiss: () => {},
      })
    case 'test-icons':
      return showIconTestDialog()
    case 'test-invalidated-account-token':
      return dispatcher.showPopup({
        type: PopupType.InvalidatedToken,
        account: Account.anonymous(),
      })
    case 'test-merge-successful-banner':
      return showFakeMergeSuccessfulBanner()
    case 'test-move-to-application-folder':
      return dispatcher.showPopup({ type: PopupType.MoveToApplicationsFolder })
    case 'test-newer-commits-on-remote':
      return showNewerCommitsOnRemote()
    case 'test-no-external-editor':
      return showTestNoExternalEditor()
    case 'test-notification':
      return testShowNotification()
    case 'test-os-version-no-longer-supported':
      return dispatcher.setBanner({
        type: BannerType.OSVersionNoLongerSupported,
      })
    case 'test-prune-branches':
      return testPruneBranches()
    case 'test-push-rejected':
      return showFakePushRejected()
    case 'test-re-authorization-required':
      return dispatcher.showPopup({
        type: PopupType.SAMLReauthRequired,
        organizationName: 'test-org',
        endpoint: 'test-endpoint',
      })
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
    case 'test-unable-to-locate-git':
      return dispatcher.showPopup({
        type: PopupType.InstallGit,
        path: '/test/path/to/git',
      })
    case 'test-unable-to-open-shell':
      return dispatcher.postError(
        new ShellError(
          `找不到终端 '${
            __DARWIN__ ? '终端' : '终端'
          }' 的可执行文件 'some/invalid/path'。请打开${
            __DARWIN__ ? '设置' : '设置'
          }并选择一个可用的终端。`
        )
      )
    case 'test-undone-banner':
      return showFakeUndoneBanner()
    case 'test-untrusted-server':
      const mockIssuer = {
        commonName: 'asdf',
        country: 'asfd',
        locality: 'asd',
        organizations: ['org'],
        organizationUnits: ['orgUnit'],
        state: 'asdf',
      }

      const mockCert: any = {
        data: 'asdf',
        fingerprint: 'asdf',
        issuerName: 'asdf',
        issuer: mockIssuer,
        serialNumber: 'asdf',
        subject: mockIssuer,
        subjectName: 'asdf',
        validExpiry: 1731503528677,
        validStart: 1731503528677,
      }

      mockCert.issueCert = mockCert
      return dispatcher.showPopup({
        type: PopupType.UntrustedCertificate,
        certificate: mockCert,
        url: `https://www.github.com`,
      })
    case 'test-update-banner':
      return showFakeUpdateBanner({})
    case 'test-prioritized-update-banner':
      return showFakeUpdateBanner({
        isPriority: true,
        priorityInfoUrl: 'https://desktop.github.com',
      })
    case 'test-update-existing-git-lfs-filters':
      return dispatcher.showPopup({ type: PopupType.LFSAttributeMismatch })
    case 'test-upstream-already-exists':
      return showFakeUpstreamAlreadyExists()
    case 'test-about-dialog':
      return dispatcher.showPopup({ type: PopupType.TestAbout })
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
    isPriority?: boolean
    priorityInfoUrl?: string
  }) {
    updateStore.setIsx64ToARM64ImmediateAutoUpdate(options.isArm64 === true)

    if (options.isShowcase) {
      dispatcher.setUpdateShowCaseVisibility(true)
      return
    }

    if (options.isPriority !== undefined) {
      updateStore.setPrioritizeUpdate(options.isPriority)
    }

    updateStore.setPrioritizeUpdateInfoUrl(options.priorityInfoUrl)

    dispatcher.setUpdateBannerVisibility(true)
  }

  function showFakeConfirmCommittingConflictedFiles() {
    if (repository == null || repository instanceof CloningRepository) {
      return dispatcher.postError(
        new Error('无可测试仓库 - 请检出一个仓库再试')
      )
    }

    return dispatcher.showPopup({
      type: PopupType.CommitConflictsWarning,
      files: [
        new WorkingDirectoryFileChange(
          'test/test.md',
          { kind: AppFileStatusKind.New },
          DiffSelection.fromInitialSelection(DiffSelectionType.All)
        ),
        new WorkingDirectoryFileChange(
          'mock/mock.md',
          { kind: AppFileStatusKind.New },
          DiffSelection.fromInitialSelection(DiffSelectionType.All)
        ),
      ],
      repository,
      context: {
        summary: 'Test summary',
        description: 'Test description',
      },
    })
  }

  function showFakeCherryPickConflictBanner() {
    dispatcher.setBanner({
      type: BannerType.CherryPickConflictsFound,
      targetBranchName: 'fake-branch',
      onOpenConflictsDialog: () => {},
    })
  }

  function showFakeDiscardedChangesWillBeUnrecoverable() {
    if (repository == null || repository instanceof CloningRepository) {
      return dispatcher.postError(
        new Error('无可测试仓库 - 请检出一个仓库再试')
      )
    }

    return dispatcher.showPopup({
      type: PopupType.DiscardChangesRetry,
      retryAction: {
        type: RetryActionType.DiscardChanges,
        repository,
        files: [
          new WorkingDirectoryFileChange(
            'test/test.md',
            { kind: AppFileStatusKind.New },
            DiffSelection.fromInitialSelection(DiffSelectionType.All)
          ),
          new WorkingDirectoryFileChange(
            'mock/mock.md',
            { kind: AppFileStatusKind.New },
            DiffSelection.fromInitialSelection(DiffSelectionType.All)
          ),
        ],
      },
    })
  }

  function showFakeDoYouWantForkThisRepository() {
    if (
      repository == null ||
      repository instanceof CloningRepository ||
      !isRepositoryWithGitHubRepository(repository)
    ) {
      return dispatcher.postError(
        new Error('无可测试 GitHub 仓库 - 请检出一个 GitHub 仓库再试')
      )
    }

    return dispatcher.showPopup({
      type: PopupType.CreateFork,
      repository,
      account: Account.anonymous(),
    })
  }

  function showFakeFilesTooLarge() {
    if (
      repository == null ||
      repository instanceof CloningRepository ||
      !isRepositoryWithGitHubRepository(repository)
    ) {
      return dispatcher.postError(
        new Error('无可测试 GitHub 仓库 - 请检出一个 GitHub 仓库再试')
      )
    }

    return dispatcher.showPopup({
      type: PopupType.OversizedFiles,
      oversizedFiles: ['test/app.tsx', 'test/popup.tsx'],
      context: {
        summary: '测试摘要',
        description: '测试描述',
      },
      repository,
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

  function showNewerCommitsOnRemote() {
    if (repository == null || repository instanceof CloningRepository) {
      return
    }
    dispatcher.showPopup({ type: PopupType.PushNeedsPull, repository })
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

  function showFakePushRejected() {
    if (
      repository == null ||
      repository instanceof CloningRepository ||
      !isRepositoryWithGitHubRepository(repository)
    ) {
      return dispatcher.postError(
        new Error('无可测试 GitHub 仓库 - 请检出一个 GitHub 仓库再试')
      )
    }

    return dispatcher.showPopup({
      type: PopupType.PushRejectedDueToMissingWorkflowScope,
      rejectedPath: `.gitub/workflows/test.yml`,
      repository,
    })
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

  function showFakeUpstreamAlreadyExists() {
    if (
      repository == null ||
      repository instanceof CloningRepository ||
      !isRepositoryWithGitHubRepository(repository)
    ) {
      return dispatcher.postError(
        new Error('无可测试 GitHub 仓库 - 请检出一个 GitHub 仓库再试')
      )
    }

    const repo = new Repository(
      repository.path,
      repository.id,
      new GitHubRepository(
        repository.gitHubRepository.name,
        repository.gitHubRepository.owner,
        repository.gitHubRepository.dbID,
        repository.gitHubRepository.isPrivate,
        repository.gitHubRepository.htmlURL,
        repository.gitHubRepository.cloneURL,
        repository.gitHubRepository.issuesEnabled,
        repository.gitHubRepository.isArchived,
        repository.gitHubRepository.permissions,
        repository.gitHubRepository // This ensures the repository has a parent even if it's not a fork for easier testing purposes
      ),
      repository.missing
    )

    return dispatcher.showPopup({
      type: PopupType.UpstreamAlreadyExists,
      repository: repo,
      existingRemote: {
        name: 'heya',
        url: 'http://github.com/tidy-dev/heya.git',
      },
    })
  }
}
