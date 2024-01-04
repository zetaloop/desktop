import * as React from 'react'
import {
  Popover,
  PopoverAnchorPosition,
  PopoverAppearEffect,
  PopoverDecoration,
} from '../lib/popover'
import { OkCancelButtonGroup } from '../dialog'

interface IWhitespaceHintPopoverProps {
  readonly anchor: HTMLElement | null
  readonly anchorPosition: PopoverAnchorPosition
  /** Called when the user changes the hide whitespace in diffs setting. */
  readonly onHideWhitespaceInDiffChanged: (checked: boolean) => void
  readonly onDismissed: () => void
}

export class WhitespaceHintPopover extends React.Component<IWhitespaceHintPopoverProps> {
  public render() {
    return (
      <Popover
        anchor={this.props.anchor}
        anchorPosition={this.props.anchorPosition}
        decoration={PopoverDecoration.Balloon}
        onMousedownOutside={this.onDismissed}
        className={'whitespace-hint'}
        appearEffect={PopoverAppearEffect.Shake}
        ariaLabelledby="whitespace-hint-header"
        ariaDescribedBy="whitespace-hint-message"
      >
        <h3 id="whitespace-hint-header">显示空白字符差异？</h3>
        <p id="whitespace-hint-message" className="byline">
          隐藏空白字符差异时，无法单独选中某几行文本。
        </p>
        <footer>
          <OkCancelButtonGroup
            okButtonText="显示"
            cancelButtonText="取消"
            onCancelButtonClick={this.onDismissed}
            onOkButtonClick={this.onShowWhitespaceChanges}
          />
        </footer>
      </Popover>
    )
  }

  private onShowWhitespaceChanges = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    this.props.onHideWhitespaceInDiffChanged(false)
    this.props.onDismissed()
  }

  private onDismissed = (event?: React.MouseEvent | MouseEvent) => {
    event?.preventDefault()
    this.props.onDismissed()
  }
}
