// an error that Electron raises when it can't find the installation for the running app
const squirrelMissingRegex = /^Can not find Squirrel$/

// an error that occurs when Squirrel isn't able to reach the update server
const squirrelDNSRegex =
  /System\.Net\.WebException: The remote name could not be resolved: 'central\.github\.com'/

// an error that occurs when the connection times out during updating
const squirrelTimeoutRegex =
  /A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond/

/**
 * This method parses known error messages from Squirrel.Windows and returns a
 * friendlier message to the user.
 *
 * @param error The underlying error from Squirrel.
 */
export function parseError(error: Error): Error | null {
  if (squirrelMissingRegex.test(error.message)) {
    return new Error(
      '软件缺少了依赖组件 Squirrel，没法检查和安装更新，这非常非常坏。'
    )
  }
  if (squirrelDNSRegex.test(error.message)) {
    return new Error(
      'GitHub Desktop 无法连接更新服务器。请确认您有网，然后重新试试。'
    )
  }
  if (squirrelTimeoutRegex.test(error.message)) {
    return new Error(
      'GitHub Desktop 无法检查更新，因为网络请求超时。请确认您有网，然后重新试试。'
    )
  }

  return null
}
