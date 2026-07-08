import * as React from 'react'

import { type CopilotFeature } from '../../lib/stores/copilot-store'
import { Button } from '../lib/button'
import { type ICopilotModelPickerSelectionInfo } from '../lib/copilot-model-picker'
import {
  Popover,
  PopoverAnchorPosition,
  PopoverDecoration,
} from '../lib/popover'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface ICopilotModelSelectionInfoProps {
  readonly feature: CopilotFeature
  readonly selectionInfo: ICopilotModelPickerSelectionInfo
}

interface ICopilotModelSelectionInfoState {
  readonly showCostDetails: boolean
}

/**
 * This component renders information about a selected Copilot model,
 * including a summary and a button to show more detailed information
 * about the model and its associated credit costs. The detailed information
 * is displayed in a popover when the button is clicked.
 */
export class CopilotModelSelectionInfo extends React.Component<
  ICopilotModelSelectionInfoProps,
  ICopilotModelSelectionInfoState
> {
  private costDetailsButton: HTMLButtonElement | null = null

  public constructor(props: ICopilotModelSelectionInfoProps) {
    super(props)
    this.state = { showCostDetails: false }
  }

  private get costDetailsContentId() {
    return `copilot-model-cost-details-${this.props.feature}`
  }

  private get costDetailsHeaderId() {
    return `copilot-model-cost-details-header-${this.props.feature}`
  }

  private onCostDetailsButtonRef = (button: HTMLButtonElement | null) => {
    this.costDetailsButton = button
  }

  private onCostDetailsButtonClick = () => {
    this.setState(state => ({ showCostDetails: !state.showCostDetails }))
  }

  private onCostDetailsButtonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (event.key !== 'Escape' || !this.state.showCostDetails) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    this.closeCostDetails()
  }

  private closeCostDetails = () => {
    this.setState({ showCostDetails: false })
  }

  private renderCostDetailsRow(label: string, value: string | null) {
    return (
      <div className="copilot-model-picker-cost-details-row">
        <dt>{label}</dt>
        <dd>{value ?? '不可用'}</dd>
      </div>
    )
  }

  private renderCostDetailsPopover() {
    const { selectionInfo } = this.props
    const { tokenPriceDetails } = selectionInfo

    if (tokenPriceDetails === null) {
      return null
    }

    const hasModelDetails =
      selectionInfo.contextWindow !== null ||
      selectionInfo.reasoningEffortLevels !== null

    return (
      <Popover
        ariaLabelledby={this.costDetailsHeaderId}
        anchor={this.costDetailsButton}
        anchorPosition={PopoverAnchorPosition.BottomLeft}
        className="copilot-model-picker-cost-details-popover"
        decoration={PopoverDecoration.Balloon}
        isDialog={false}
        onMousedownOutside={this.closeCostDetails}
        onClickOutside={this.closeCostDetails}
        trapFocus={false}
      >
        <div
          id={this.costDetailsContentId}
          className="copilot-model-picker-cost-details"
        >
          <div className="copilot-model-picker-cost-details-header">
            <h3 id={this.costDetailsHeaderId}>{selectionInfo.name}</h3>
            {selectionInfo.modelPickerCategory === null ? null : (
              <span>{selectionInfo.modelPickerCategory}</span>
            )}
          </div>

          {hasModelDetails ? (
            <dl className="copilot-model-picker-cost-details-section">
              {selectionInfo.contextWindow === null
                ? null
                : this.renderCostDetailsRow(
                    '上下文',
                    selectionInfo.contextWindow
                  )}
              {selectionInfo.reasoningEffortLevels === null
                ? null
                : this.renderCostDetailsRow(
                    '推理',
                    selectionInfo.reasoningEffortLevels
                  )}
            </dl>
          ) : null}

          <div className="copilot-model-picker-cost-details-section">
            <h4>每 {tokenPriceDetails.batchSize} tokens 消耗的 AI 额度</h4>
            <dl>
              {this.renderCostDetailsRow('输入', tokenPriceDetails.inputPrice)}
              {this.renderCostDetailsRow(
                '缓存输入',
                tokenPriceDetails.cachePrice
              )}
              {this.renderCostDetailsRow('输出', tokenPriceDetails.outputPrice)}
            </dl>
          </div>
        </div>
      </Popover>
    )
  }

  public render() {
    const hasTokenPriceDetails =
      this.props.selectionInfo.tokenPriceDetails !== null
    const costDetailsContentId = this.state.showCostDetails
      ? this.costDetailsContentId
      : undefined

    return (
      <div className="copilot-model-picker-selection-info">
        {hasTokenPriceDetails ? (
          <Button
            ariaControls={costDetailsContentId}
            ariaDescribedBy={costDetailsContentId}
            ariaExpanded={this.state.showCostDetails}
            ariaLabel="显示 Copilot 模型额度消耗"
            className="copilot-model-picker-selection-info-button"
            applyTooltipAriaDescribedBy={false}
            onButtonRef={this.onCostDetailsButtonRef}
            onClick={this.onCostDetailsButtonClick}
            onKeyDown={this.onCostDetailsButtonKeyDown}
            size="small"
            tooltip="显示额度消耗"
          >
            <Octicon symbol={octicons.info} />
          </Button>
        ) : null}
        <span>{this.props.selectionInfo.summary}</span>
        {this.state.showCostDetails && hasTokenPriceDetails
          ? this.renderCostDetailsPopover()
          : null}
      </div>
    )
  }
}
