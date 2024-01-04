import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'

interface IBranchContextMenuConfig {
  name: string
  isLocal: boolean
  onRenameBranch?: (branchName: string) => void
  onDeleteBranch?: (branchName: string) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const { name, isLocal, onRenameBranch, onDeleteBranch } = config
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: '重命名…',
      action: () => onRenameBranch(name),
      enabled: isLocal,
    })
  }

  items.push({
    label: __DARWIN__ ? '复制名称' : '复制名称',
    action: () => clipboard.writeText(name),
  })

  items.push({ type: 'separator' })

  if (onDeleteBranch !== undefined) {
    items.push({
      label: '删除…',
      action: () => onDeleteBranch(name),
    })
  }

  return items
}
