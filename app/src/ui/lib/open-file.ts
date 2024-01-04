import { shell } from '../../lib/app-shell'
import { Dispatcher } from '../dispatcher'

export async function openFile(
  fullPath: string,
  dispatcher: Dispatcher
): Promise<void> {
  const result = await shell.openExternal(`file://${fullPath}`)

  if (!result) {
    const error = {
      name: 'no-external-program',
      message: `无法用外部软件打开 ${fullPath} 文件。请检查该文件扩展名是否存在默认处理软件。`,
    }
    await dispatcher.postError(error)
  }
}
