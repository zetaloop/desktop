import { app, dialog } from 'electron'
import { setCrashMenu } from './menu'
import { formatError } from '../lib/logging/format-error'
import { CrashWindow } from './crash-window'

let hasReportedUncaughtException = false

/** Show the uncaught exception UI. */
export function showUncaughtException(isLaunchError: boolean, error: Error) {
  log.error(formatError(error))

  if (hasReportedUncaughtException) {
    return
  }

  hasReportedUncaughtException = true

  setCrashMenu()

  const window = new CrashWindow(isLaunchError ? 'launch' : 'generic', error)

  window.onDidLoad(() => {
    window.show()
  })

  window.onFailedToLoad(async () => {
    await dialog.showMessageBox({
      type: 'error',
      title: __DARWIN__ ? `无法恢复的错误` : '无法恢复的错误',
      message:
        `GitHub Desktop 遇到了一个无法恢复的错误，需要重新启动。n\n` +
        `此问题已报告给开发团队。但如果您反复遇到这个错误，请在 GitHub Desktop 的问题跟踪器中报告此问题。\n\n${
          error.stack || error.message
        }`,
    })

    if (!__DEV__) {
      app.relaunch()
    }
    app.quit()
  })

  window.onClose(() => {
    if (!__DEV__) {
      app.relaunch()
    }
    app.quit()
  })

  window.load()
}
