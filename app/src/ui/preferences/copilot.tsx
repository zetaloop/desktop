import * as React from 'react'
import { DialogContent } from '../dialog'
import { Select } from '../lib/select'
import type { ModelInfo } from '@github/copilot-sdk'
import {
  DefaultCopilotModel,
  type CopilotFeature,
  type CopilotModelSelections,
} from '../../lib/stores/copilot-store'

interface ICopilotPreferencesProps {
  readonly selectedCopilotModels: CopilotModelSelections
  readonly copilotModels: ReadonlyArray<ModelInfo> | null
  readonly copilotAvailable: boolean
  readonly onSelectedCopilotModelChanged: (
    feature: CopilotFeature,
    model: string | null
  ) => void
}

export class CopilotPreferences extends React.Component<ICopilotPreferencesProps> {
  private onCommitMessageModelChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    this.props.onSelectedCopilotModelChanged(
      'commit-message-generation',
      value === DefaultCopilotModel ? null : value
    )
  }

  public render() {
    return (
      <DialogContent>
        <div className="copilot-section">
          <h2 id="copilot-model-heading">
            {__DARWIN__ ? '语言模型' : '语言模型'}
          </h2>
          {this.renderModelPicker()}
        </div>
      </DialogContent>
    )
  }

  private renderModelPicker() {
    if (!this.props.copilotAvailable) {
      return <p>请在账户分页登录 GitHub.com 账户，然后配置 Copilot 设置。</p>
    }

    const { copilotModels, selectedCopilotModels } = this.props
    const selectedModel =
      selectedCopilotModels['commit-message-generation'] ?? null

    if (copilotModels === null) {
      return <p>正在加载可用模型…</p>
    }

    if (copilotModels.length === 0) {
      return <p>没有可用模型。请检查 Copilot 订阅。</p>
    }

    return (
      <Select
        label={__DARWIN__ ? '提交消息生成' : '提交消息生成'}
        value={selectedModel ?? DefaultCopilotModel}
        onChange={this.onCommitMessageModelChanged}
      >
        {copilotModels.map(m => (
          <option key={m.id} value={m.id}>
            {m.id === DefaultCopilotModel ? `${m.name}（默认）` : m.name}
          </option>
        ))}
      </Select>
    )
  }
}
