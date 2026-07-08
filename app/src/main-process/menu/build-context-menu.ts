import { ISerializableMenuItem } from '../../lib/menu-item'
import { Menu, MenuItem } from 'electron'

/**
 * Gets a value indicating whether or not two roles are considered
 * equal using a case-insensitive comparison.
 */
function roleEquals(x: string | undefined, y: string | undefined) {
  return (x ? x.toLowerCase() : x) === (y ? y.toLowerCase() : y)
}

/**
 * Get platform-specific edit menu items by leveraging Electron's
 * built-in editMenu role.
 */
function getEditMenuItems(): ReadonlyArray<MenuItem> {
  const menu = Menu.buildFromTemplate([{ role: 'editMenu' }]).items[0]

  // Electron is violating its contract if there's no subMenu but
  // we'd rather just ignore it than crash. It's not the end of
  // the world if we don't have edit menu items.
  const items = menu && menu.submenu ? menu.submenu.items : []

  // 汉化菜单。
  const labelMap = {
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    delete: '删除',
    selectall: '全选',
  }
  for (const [index, item] of items.entries()) {
    if (item.role && item.role in labelMap) {
      item.label = labelMap[item.role as keyof typeof labelMap]
    } else if (item.label && item.label === 'Substitutions') {
      items[index] = Menu.buildFromTemplate([
        {
          label: '替换',
          submenu: [
            { label: '显示替换', role: 'showSubstitutions' },
            { type: 'separator' },
            { label: '智能引号', role: 'toggleSmartQuotes' },
            { label: '智能破折号', role: 'toggleSmartDashes' },
            { label: '文本替换', role: 'toggleTextReplacement' },
          ],
        },
      ]).items[0]
    } else if (item.label && item.label === 'Speech') {
      items[index] = Menu.buildFromTemplate([
        {
          label: '语音',
          submenu: [
            { label: '开始朗读', role: 'startSpeaking' },
            { label: '停止朗读', role: 'stopSpeaking' },
          ],
        },
      ]).items[0]
    }
  }

  // We don't use styled inputs anywhere at the moment
  // so let's skip this for now and when/if we do we
  // can make it configurable from the callee
  return items.filter(x => !roleEquals(x.role, 'pasteandmatchstyle'))
}

/**
 * Create an Electron menu object for use in a context menu based on
 * a template provided by the renderer.
 *
 * If the template contains a menu item with the role 'editMenu' the
 * platform standard edit menu items will be inserted at the position
 * of the 'editMenu' template.
 *
 * @param template One or more menu item templates as passed from
 *                 the renderer.
 * @param onClick  A callback function for when one of the menu items
 *                 constructed from the template is clicked. Callback
 *                 is passed an array of indices corresponding to the
 *                 positions of each of the parent menus of the clicked
 *                 item (so when clicking a top-level menu item an array
 *                 with a single element will be passed). Note that the
 *                 callback will not be called when expanded/automatically
 *                 created edit menu items are clicked.
 */
export function buildContextMenu(
  template: ReadonlyArray<ISerializableMenuItem>,
  onClick: (indices: ReadonlyArray<number>) => void,
  spellCheckMenuItems?: ReadonlyArray<MenuItem>
): Menu {
  const menu = buildRecursiveContextMenu(template, onClick)

  if (spellCheckMenuItems === undefined) {
    return menu
  }

  for (const spellCheckMenuItem of spellCheckMenuItems) {
    menu.append(spellCheckMenuItem)
  }

  return menu
}

function buildRecursiveContextMenu(
  menuItems: ReadonlyArray<ISerializableMenuItem>,
  actionFn: (indices: ReadonlyArray<number>) => void,
  currentIndices: ReadonlyArray<number> = []
): Menu {
  const menu = new Menu()

  for (const [idx, item] of menuItems.entries()) {
    if (roleEquals(item.role, 'editmenu')) {
      for (const editItem of getEditMenuItems()) {
        menu.append(editItem)
      }
    } else {
      const indices = [...currentIndices, idx]

      menu.append(
        new MenuItem({
          label: item.label,
          type: item.type,
          checked: item.checked,
          enabled: item.enabled,
          role: item.role,
          click: () => actionFn(indices),
          submenu: item.submenu
            ? buildRecursiveContextMenu(item.submenu, actionFn, indices)
            : undefined,
        })
      )
    }
  }

  return menu
}
