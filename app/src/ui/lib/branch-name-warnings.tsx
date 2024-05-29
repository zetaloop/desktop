import * as React from 'react'
import { Branch, BranchType } from '../../models/branch'

import { Row } from './row'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Ref } from './ref'
import { IStashEntry } from '../../models/stash-entry'
import { enableMoveStash } from '../../lib/feature-flag'

export function renderBranchHasRemoteWarning(branch: Branch) {
  if (branch.upstream != null) {
    return (
      <Row className="warning-helper-text">
        <Octicon symbol={octicons.alert} />
        <p>
          该分支跟踪远程分支 <Ref>{branch.upstream}</Ref>
          ，重命名它并不会改变远程分支的名字。
        </p>
      </Row>
    )
  } else {
    return null
  }
}

export function renderBranchNameExistsOnRemoteWarning(
  sanitizedName: string,
  branches: ReadonlyArray<Branch>
) {
  const alreadyExistsOnRemote =
    branches.findIndex(
      b => b.nameWithoutRemote === sanitizedName && b.type === BranchType.Remote
    ) > -1

  if (alreadyExistsOnRemote === false) {
    return null
  }

  return (
    <Row className="warning-helper-text">
      <Octicon symbol={octicons.alert} />
      <p>
        已存在同名远程分支 <Ref>{sanitizedName}</Ref>。
      </p>
    </Row>
  )
}

export function renderStashWillBeLostWarning(stash: IStashEntry | null) {
  if (stash === null || enableMoveStash()) {
    return null
  }
  return (
    <Row className="warning-helper-text">
      <Octicon symbol={octicons.alert} />
      <p>如果重命名分支，当前暂存区内容将会在 GitHub Desktop 中丢失。</p>
    </Row>
  )
}
