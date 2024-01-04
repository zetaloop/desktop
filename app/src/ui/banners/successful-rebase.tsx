import * as React from 'react'
import { SuccessBanner } from './success-banner'

export function SuccessfulRebase({
  baseBranch,
  targetBranch,
  onDismissed,
}: {
  readonly baseBranch?: string
  readonly targetBranch: string
  readonly onDismissed: () => void
}) {
  const message =
    baseBranch !== undefined ? (
      <span>
        {'成功将 '}
        <strong>{targetBranch}</strong>
        {' 重构到 '}
        <strong>{baseBranch}</strong>
      </span>
    ) : (
      <span>
        {'成功重构了 '}
        <strong>{targetBranch}</strong>
      </span>
    )

  return (
    <SuccessBanner timeout={5000} onDismissed={onDismissed}>
      <div className="banner-message">{message}。</div>
    </SuccessBanner>
  )
}
