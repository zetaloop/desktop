import * as React from 'react'
import { SuccessBanner } from './success-banner'

export function SuccessfulMerge({
  ourBranch,
  theirBranch,
  onDismissed,
}: {
  readonly ourBranch: string
  readonly theirBranch?: string
  readonly onDismissed: () => void
}) {
  const message =
    theirBranch !== undefined ? (
      <span>
        {'成功将 '}
        <strong>{theirBranch}</strong>
        {' 合并到 '}
        <strong>{ourBranch}</strong>
      </span>
    ) : (
      <span>
        {'成功合并到 '}
        <strong>{ourBranch}</strong>
      </span>
    )

  return (
    <SuccessBanner timeout={5000} onDismissed={onDismissed}>
      <div className="banner-message">{message}。</div>
    </SuccessBanner>
  )
}
