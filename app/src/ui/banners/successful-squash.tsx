import * as React from 'react'
import { SuccessBanner } from './success-banner'

interface ISuccessfulSquashedBannerProps {
  readonly count: number
  readonly onDismissed: () => void
  readonly onUndo: () => void
}

export class SuccessfulSquash extends React.Component<
  ISuccessfulSquashedBannerProps,
  {}
> {
  public render() {
    const { count, onDismissed, onUndo } = this.props

    const pluralized = count === 1 ? '提交' : '提交'

    return (
      <SuccessBanner timeout={15000} onDismissed={onDismissed} onUndo={onUndo}>
        <span>
          成功压缩了{count}个{pluralized}。
        </span>
      </SuccessBanner>
    )
  }
}
