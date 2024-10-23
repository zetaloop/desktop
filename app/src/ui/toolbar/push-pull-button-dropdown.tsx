import React from 'react'
import { Button } from '../lib/button'
import { Octicon, syncClockwise } from '../octicons'
import {
  DropdownItem,
  DropdownItemClassName,
  DropdownItemType,
  forcePushIcon,
} from './push-pull-button'

interface IPushPullButtonDropDownProps {
  readonly itemTypes: ReadonlyArray<DropdownItemType>
  /** The name of the remote. */
  readonly remoteName: string | null

  /** Will the app prompt the user to confirm a force push? */
  readonly askForConfirmationOnForcePush: boolean

  readonly fetch: () => void
  readonly forcePushWithLease: () => void
}

export class PushPullButtonDropDown extends React.Component<IPushPullButtonDropDownProps> {
  private buttonsContainerRef: HTMLDivElement | null = null

  public componentDidMount() {
    window.addEventListener('keydown', this.onDropdownKeyDown)
  }

  public componentWillUnmount() {
    window.removeEventListener('keydown', this.onDropdownKeyDown)
  }

  private onButtonsContainerRef = (ref: HTMLDivElement | null) => {
    this.buttonsContainerRef = ref
  }

  private onDropdownKeyDown = (event: KeyboardEvent) => {
    // Allow using Up and Down arrow keys to navigate the dropdown items
    // (equivalent to Tab and Shift+Tab)
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }

    event.preventDefault()
    const items = this.buttonsContainerRef?.querySelectorAll<HTMLElement>(
      `.${DropdownItemClassName}`
    )

    if (items === undefined) {
      return
    }

    const focusedItem =
      this.buttonsContainerRef?.querySelector<HTMLElement>(':focus')
    if (!focusedItem) {
      return
    }

    const focusedIndex = Array.from(items).indexOf(focusedItem)
    const nextIndex =
      event.key === 'ArrowDown' ? focusedIndex + 1 : focusedIndex - 1
    // http://javascript.about.com/od/problemsolving/a/modulobug.htm
    const nextItem = items[(nextIndex + items.length) % items.length]
    nextItem?.focus()
  }

  private getDropdownItemWithType(type: DropdownItemType): DropdownItem {
    const { remoteName } = this.props

    switch (type) {
      case DropdownItemType.Fetch:
        return {
          title: `获取 ${remoteName}`,
          description: `获取来自 ${remoteName} 的最新改动`,
          action: this.props.fetch,
          icon: syncClockwise,
        }
      case DropdownItemType.ForcePush: {
        const forcePushWarning = this.props
          .askForConfirmationOnForcePush ? null : (
          <div className="warning">
            <span className="warning-title">警告：</span>
            强制推送将会重写远程历史记录。正在使用该分支的人们必须得重置他们的本地分支才能匹配远程历史记录了，这可能会造成一些麻烦。
          </div>
        )
        return {
          title: `强制推送 ${remoteName}`,
          description: (
            <>
              以本地记录覆盖 {remoteName} 的远程历史记录
              {forcePushWarning}
            </>
          ),
          action: this.props.forcePushWithLease,
          icon: forcePushIcon,
        }
      }
    }
  }

  public renderDropdownItem = (type: DropdownItemType) => {
    const item = this.getDropdownItemWithType(type)
    return (
      <Button
        className={DropdownItemClassName}
        key={type}
        onClick={item.action}
      >
        <Octicon symbol={item.icon} />
        <div className="text-container">
          <div className="title">{item.title}</div>
          <div className="detail">{item.description}</div>
        </div>
      </Button>
    )
  }

  public render() {
    const { itemTypes } = this.props
    return (
      <div className="push-pull-dropdown" ref={this.onButtonsContainerRef}>
        {itemTypes.map(this.renderDropdownItem)}
      </div>
    )
  }
}
