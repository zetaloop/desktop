import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ISuccessfulCherryPickBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulCherryPick extends React.Component<
  ISuccessfulCherryPickBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, onDismissed, onUndo, targetBranchName } =
      this.props

    const pluralized = countCherryPicked === 1 ? '提交' : '提交'

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          成功摘取了{countCherryPicked}个{pluralized}到{' '}
          <strong>{targetBranchName}</strong> 。
        </span>
      </SuccessBanner>
    )
  }
}
