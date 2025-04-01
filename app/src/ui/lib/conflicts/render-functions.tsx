import * as React from 'react'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { LinkButton } from '../link-button'

export function renderUnmergedFilesSummary(conflictedFilesCount: number) {
  // localization, it burns :vampire:
  const message =
    conflictedFilesCount === 1
      ? `1个文件有冲突`
      : `${conflictedFilesCount}个文件有冲突`
  return <h2 className="summary">{message}</h2>
}

export function renderAllResolved() {
  return (
    <div className="all-conflicts-resolved">
      <div className="green-circle">
        <Octicon symbol={octicons.check} />
      </div>
      <div className="message">所有冲突都已解决</div>
    </div>
  )
}

export function renderShellLink(openThisRepositoryInShell: () => void) {
  return (
    <div>
      您可以{' '}
      <LinkButton onClick={openThisRepositoryInShell}>
        打开终端来操作 Git
      </LinkButton>
      ，或者在编辑器中解决冲突，也可关闭此弹窗稍后再处理。
    </div>
  )
}
