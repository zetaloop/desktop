const RestrictedFileExtensions = ['.cmd', '.exe', '.bat', '.sh']
export const CopyFilePathLabel = __DARWIN__ ? '复制文件路径' : '复制文件路径'

export const CopyRelativeFilePathLabel = __DARWIN__
  ? '复制相对文件路径'
  : '复制相对文件路径'

export const CopySelectedPathsLabel = __DARWIN__ ? '复制路径' : '复制路径'

export const CopySelectedRelativePathsLabel = __DARWIN__
  ? '复制相对路径'
  : '复制相对路径'

export const DefaultEditorLabel = __DARWIN__
  ? '打开默认编辑器'
  : '打开默认编辑器'

export const DefaultShellLabel = __DARWIN__ ? 'Open in Shell' : 'Open in shell'

export const RevealInFileManagerLabel = __DARWIN__
  ? '打开文件位置'
  : __WIN32__
  ? '打开文件位置'
  : '打开文件位置'

export const TrashNameLabel = __WIN32__ ? '回收站' : '废纸篓'

export const OpenWithDefaultProgramLabel = __DARWIN__
  ? '打开默认处理软件'
  : '打开默认处理软件'

export function isSafeFileExtension(extension: string): boolean {
  if (__WIN32__) {
    return RestrictedFileExtensions.indexOf(extension.toLowerCase()) === -1
  }
  return true
}
