import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ICherryPickUndoneBannerProps {
  readonly targetBranchName: string
  readonly countCherryPicked: number
  readonly onDismissed: () => void
}

export class CherryPickUndone extends React.Component<
  ICherryPickUndoneBannerProps,
  {}
> {
  public render() {
    const { countCherryPicked, targetBranchName, onDismissed } = this.props
    const pluralized = countCherryPicked === 1 ? '提交' : '提交'
    return (
      <SuccessBanner timeout={5000} onDismissed={onDismissed}>
        已撤销摘取，从 <strong>{targetBranchName}</strong> 移除了
        {countCherryPicked}个{pluralized}。
      </SuccessBanner>
    )
  }
}
