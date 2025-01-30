import { spawn, SpawnOptions } from 'child_process'
import { pathExists } from '../../ui/lib/path-exists'
import { ExternalEditorError, FoundEditor } from './shared'
import {
  expandTargetPathArgument,
  ICustomIntegration,
  parseCustomIntegrationArguments,
} from '../custom-integration'

const editorOpts: SpawnOptions = {
  // Make sure the editor processes are detached from the Desktop app.
  // Otherwise, some editors (like Notepad++) will be killed when the
  // Desktop app is closed.
  detached: true,
  stdio: 'ignore',
}

async function launchEditor(
  editorPath: string,
  args: readonly string[],
  editorName: string
) {
  const exists = await pathExists(editorPath)
  const label = __DARWIN__ ? 'Settings' : 'Options'
  if (!exists) {
    throw new ExternalEditorError(
      `Could not find executable for ${editorName} at path '${editorPath}'. Please open ${label} and select an available editor.`,
      { openPreferences: true }
    )
  }

  return new Promise<void>((resolve, reject) => {
    // In macOS we can use `open`, which will open the right executable file
    // for us, we only need the path to the editor .app folder.
    const child = __DARWIN__
      ? spawn('open', ['-a', editorPath, ...args], editorOpts)
      : spawn(editorPath, args, editorOpts)

    child.on('error', reject)
    child.on('spawn', resolve)

    // Don't wait for editor to exit
    child.unref()
  }).catch((e: unknown) => {
    log.error(
      `Error while launching ${editorName}`,
      e instanceof Error ? e : undefined
    )
    throw new ExternalEditorError(
      e && typeof e === 'object' && 'code' in e && e.code === 'EACCES'
        ? `GitHub Desktop doesn't have the proper permissions to start ${editorName}. Please open ${label} and try another editor.`
        : `Something went wrong while trying to start ${editorName}. Please open ${label} and try another editor.`,
      { openPreferences: true }
    )
  })
}

/**
 * Open a given file or folder in the desired external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param editor The external editor to launch.
 */
export const launchExternalEditor = (fullPath: string, editor: FoundEditor) =>
  launchEditor(editor.path, [fullPath], `'${editor.editor}'`)

/**
 * Open a given file or folder in the desired custom external editor.
 *
 * @param fullPath A folder or file path to pass as an argument when launching the editor.
 * @param customEditor The external editor to launch.
 */
export const launchCustomExternalEditor = (
  fullPath: string,
  customEditor: ICustomIntegration
) => {
  const argv = parseCustomIntegrationArguments(customEditor.arguments)

  // Replace instances of RepoPathArgument with fullPath in customEditor.arguments
  const args = expandTargetPathArgument(argv, fullPath)

  return launchEditor(
    customEditor.path,
    args,
    `custom editor at path '${customEditor.path}'`
  )
}
