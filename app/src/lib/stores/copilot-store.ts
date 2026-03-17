import { CopilotClient } from '@github/copilot-sdk'
import { AccountsStore } from './accounts-store'
import { Account, isDotComAccount } from '../../models/account'
import {
  ICopilotCommitMessage,
  parseCopilotCommitMessage,
} from '../copilot-commit-message'
import { Emitter, Disposable } from 'event-kit'
import * as ipcRenderer from '../ipc-renderer'
import { join } from 'path'
import { pathToFileURL } from 'url'

/**
 * Returns the path of the executable (Electron/Node) used to run the Copilot CLI.
 *
 * This corresponds to the value of `process.execPath` used when launching the
 * Copilot CLI via an eval-based entry point (for example, `--eval "import './index.js'"`).
 */
export async function getCopilotCLIPath(): Promise<string> {
  return ipcRenderer.invoke('get-exec-path')
}

function getCopilotCLIDir(): string {
  return join(__dirname, 'copilot')
}

/**
 * System prompt for the Copilot commit message generation session.
 */
const CommitMessageSystemPrompt = `
You're an AI assistant whose job is to concisely summarize code changes into
short, useful commit messages, with a title and a description.

A changeset is given in the git diff output format, affecting one or multiple files.

The commit title should be no longer than 50 characters and should summarize the
contents of the changeset for other developers reading the commit history.

The commit description can be longer, and should provide more context about the
changeset, including why the changeset is being made, and any other relevant
information. The commit description is optional, so you can omit it if the
changeset is small enough that it can be described in the commit title or if you
don't have enough context.

Be brief and concise.

Do NOT include a description of changes in "lock" files from dependency managers
like npm, yarn, or pip (and others), unless those are the only changes in the commit.

Your response must be a JSON object with the attributes "title" and "description"
containing the commit title and commit description. Do not use markdown to wrap
the JSON object, just return it as plain text. For example:

{
  "title": "Fix issue with login form",
  "description": "The login form was not submitting correctly. This commit fixes that issue by adding a missing \`name\` attribute to the submit button."
}
`

/**
 * This store manages the Copilot client lifecycle based on the user's
 * GitHub.com account. It tracks account changes and creates the client
 * lazily when a Copilot feature is used.
 *
 * Currently, Copilot is only available for GitHub.com accounts.
 */
export class CopilotStore {
  private readonly emitter = new Emitter()
  private currentAccount: Account | null = null

  public constructor(private readonly accountsStore: AccountsStore) {
    this.accountsStore.onDidUpdate(this.onAccountsUpdated)
    this.initializeFromAccounts()
  }

  /**
   * Initialize the account from the current accounts.
   */
  private async initializeFromAccounts(): Promise<void> {
    const accounts = await this.accountsStore.getAll()
    this.onAccountsUpdated(accounts)
  }

  /**
   * Handler for account updates. Updates the stored account reference.
   */
  private onAccountsUpdated = (accounts: ReadonlyArray<Account>): void => {
    // Copilot is only available on GitHub.com, so we look for a dotcom account
    const dotComAccount = accounts.find(isDotComAccount) ?? null
    this.currentAccount = dotComAccount

    if (dotComAccount === null) {
      log.debug('CopilotStore: No GitHub.com account available')
    } else {
      log.debug(`CopilotStore: Account updated for '${dotComAccount.login}'`)
    }
  }

  /**
   * Creates a new Copilot client for the current account.
   *
   * @throws Error if no GitHub.com account is available
   */
  private async createClient(repositoryPath: string): Promise<CopilotClient> {
    if (this.currentAccount === null || !this.currentAccount.token) {
      throw new Error('无法创建 Copilot 客户端: 没有 GitHub.com 账号')
    }

    // This relies on the fact that Copilot CLI is bundled with the app, but not
    // as a "single executable application", but the files from the npm package.
    // That means Desktop will use its own executable to run as Copilot CLI's
    // index.js as node.
    // However, when trying to do this directly without the --eval flag, Copilot
    // CLI fails to parse the arguments correctly, so we ended up using --eval
    // and just importing the index.js from the CLI as a workaround.
    const cliDir = getCopilotCLIDir()
    let importPath = join(cliDir, 'index.js')

    if (__WIN32__) {
      // On Windows, we need the import path to be a valid file:// URL.
      importPath = pathToFileURL(importPath).href
    }

    return new CopilotClient({
      cliPath: await getCopilotCLIPath(),
      cliArgs: ['--eval', `import '${importPath}'`, '--'],
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        COPILOT_RUN_APP: '1',
      },
      cwd: repositoryPath,
      autoStart: true,
      githubToken: this.currentAccount.token,
    })
  }

  /**
   * Stops the given Copilot client.
   */
  private async stopClient(client: CopilotClient): Promise<void> {
    try {
      await client.stop()
    } catch (e) {
      log.error('CopilotStore: Error stopping client', e)
    }
  }

  /**
   * Generates a commit message for the given diff using Copilot.
   *
   * @param diff The diff of changes to be committed, in git format
   * @returns Commit details (title and description) generated by Copilot
   * @throws Error if no GitHub.com account is available or if generation fails
   */
  public async generateCommitMessage(
    diff: string,
    repositoryPath: string
  ): Promise<ICopilotCommitMessage> {
    const client = await this.createClient(repositoryPath)
    let session: Awaited<ReturnType<CopilotClient['createSession']>> | null =
      null

    try {
      // Create a session for commit message generation
      session = await client.createSession({
        model: 'gpt-5-mini',
        reasoningEffort: 'low',
        systemMessage: {
          // It's important to 'append' the system prompt so that it doesn't
          // override any instructions, like copilot-instructions.md (in which
          // we rely for custom commit message generation instructions).
          mode: 'append',
          content: CommitMessageSystemPrompt,
        },
        onPermissionRequest: async () => ({
          kind: 'denied-interactively-by-user',
        }),
      })

      // Send the diff and wait for response
      const response = await session.sendAndWait({ prompt: diff }, 30000)

      if (!response || !response.data.content) {
        throw new Error('Copilot 未作回应')
      }

      return parseCopilotCommitMessage(response.data.content)
    } catch (e) {
      log.warn('CopilotStore: Failed to generate commit message', e)
      throw e
    } finally {
      // Clean up the session
      await session?.destroy().catch(() => {})

      // Stop the client after use
      await this.stopClient(client)
    }
  }

  /**
   * Register a function to be called when an error occurs.
   */
  public onDidError(fn: (e: Error) => void): Disposable {
    return this.emitter.on('did-error', fn)
  }

  /**
   * Emits an error event.
   */
  protected emitError(error: Error): void {
    this.emitter.emit('did-error', error)
  }
}
