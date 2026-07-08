import * as React from 'react'
import {
  encodeModelKey,
  isLocalBaseUrl,
  parseModelKey,
  type IBYOKProvider,
} from '../../lib/copilot/byok'
import { enableCopilotConflictResolution } from '../../lib/feature-flag'
import { isGHES } from '../../lib/endpoint-capabilities'
import {
  DefaultCopilotModel,
  type CopilotFeature,
  type CopilotModelSelections,
} from '../../lib/stores/copilot-store'
import type { Account } from '../../models/account'
import { DialogContent, DialogPreferredFocusClassName } from '../dialog'
import { Button } from '../lib/button'
import { CallToAction } from '../lib/call-to-action'
import {
  CopilotModelPicker,
  getCopilotModelPickerSelectionInfo,
  hasCopilotModelPickerItems,
} from '../lib/copilot-model-picker'
import { LinkButton } from '../lib/link-button'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Row } from '../lib/row'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { TabBar } from '../tab-bar'
import { CopilotModelSelectionInfo } from './copilot-model-selection-info'
import type { Model } from '@github/copilot-sdk/dist/generated/rpc'

interface ICopilotPreferencesProps {
  readonly selectedCopilotModels: CopilotModelSelections
  readonly copilotModels: ReadonlyArray<Model> | null
  readonly accounts: ReadonlyArray<Account>
  readonly byokProviders: ReadonlyArray<IBYOKProvider>
  readonly showBYOKSettings: boolean
  readonly onSignIn: () => void
  readonly onOpenCopilotPlans: () => void
  readonly onOpenCopilotFeatureSettings: () => void
  readonly alwaysUseCopilotForConflictResolution: boolean
  readonly onSelectedCopilotModelChanged: (
    feature: CopilotFeature,
    model: string | null
  ) => void
  readonly onAlwaysUseCopilotForConflictResolutionChanged: (
    checked: boolean
  ) => void
  readonly onAddBYOKProvider: () => void
  readonly onEditBYOKProvider: (provider: IBYOKProvider) => void
  readonly onDeleteBYOKProvider: (provider: IBYOKProvider) => void
}

interface ICopilotPreferencesState {
  readonly selectedTabIndex: number
}

type CopilotAccessState =
  | 'signed-out'
  | 'checking'
  | 'no-license'
  | 'desktop-disabled'
  | 'enabled'

const CopilotLicenseTypeNoAccess = 'NO_ACCESS'
export class CopilotPreferences extends React.Component<
  ICopilotPreferencesProps,
  ICopilotPreferencesState
> {
  public constructor(props: ICopilotPreferencesProps) {
    super(props)
    this.state = { selectedTabIndex: 0 }
  }

  private onTabClicked = (index: number) => {
    this.setState({ selectedTabIndex: index })
  }

  private onCommitMessageModelChanged = (model: string) => {
    this.props.onSelectedCopilotModelChanged('commit-message-generation', model)
  }

  private onConflictResolutionModelChanged = (model: string) => {
    this.props.onSelectedCopilotModelChanged('conflict-resolution', model)
  }

  private onAlwaysUseCopilotForConflictResolutionChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onAlwaysUseCopilotForConflictResolutionChanged(
      event.currentTarget.checked
    )
  }

  private onAddBYOKProviderClick = () => this.props.onAddBYOKProvider()

  private onEditBYOKProviderClick = (provider: IBYOKProvider) => () =>
    this.props.onEditBYOKProvider(provider)

  private onDeleteBYOKProviderClick = (provider: IBYOKProvider) => () =>
    this.props.onDeleteBYOKProvider(provider)

  public render() {
    const accessState = this.getCopilotAccessState()

    if (accessState !== 'enabled') {
      return (
        <DialogContent className="copilot-tab">
          <div className="copilot-tab-content">
            <div className="copilot-section">
              {this.renderAccessState(accessState)}
            </div>
          </div>
        </DialogContent>
      )
    }

    const showBYOK = this.props.showBYOKSettings

    if (!showBYOK) {
      return (
        <DialogContent className="copilot-tab">
          <div className="copilot-tab-content">
            <div className="copilot-section">{this.renderModelPicker()}</div>
          </div>
        </DialogContent>
      )
    }

    return (
      <DialogContent className="copilot-tab">
        <TabBar
          selectedIndex={this.state.selectedTabIndex}
          onTabClicked={this.onTabClicked}
        >
          <span>模型</span>
          <span>提供商</span>
        </TabBar>
        <div className="copilot-tab-content">
          <div className="copilot-section">{this.renderCurrentTab()}</div>
        </div>
      </DialogContent>
    )
  }

  private renderCurrentTab() {
    if (this.state.selectedTabIndex === 1) {
      return this.renderBYOKProviders()
    }
    return this.renderModelPicker()
  }

  private getCopilotAccessState(): CopilotAccessState {
    const accounts = this.props.accounts.filter(
      account => !isGHES(account.endpoint)
    )

    if (accounts.length === 0) {
      return 'signed-out'
    }

    let hasCheckingAccount = false
    let hasNoAccessAccount = false
    let hasDesktopDisabledAccount = false

    for (const account of accounts) {
      if (
        account.isCopilotDesktopEnabled === true &&
        account.copilotLicenseType !== undefined &&
        account.copilotLicenseType !== CopilotLicenseTypeNoAccess
      ) {
        return 'enabled'
      }

      if (
        account.copilotLicenseType === undefined ||
        account.isCopilotDesktopEnabled === undefined
      ) {
        hasCheckingAccount = true
      } else if (account.copilotLicenseType === CopilotLicenseTypeNoAccess) {
        hasNoAccessAccount = true
      } else if (account.isCopilotDesktopEnabled === false) {
        hasDesktopDisabledAccount = true
      }
    }

    if (hasCheckingAccount) {
      return 'checking'
    }

    if (hasDesktopDisabledAccount) {
      return 'desktop-disabled'
    }

    if (hasNoAccessAccount) {
      return 'no-license'
    }

    return 'checking'
  }

  private renderAccessState(accessState: CopilotAccessState): JSX.Element {
    switch (accessState) {
      case 'signed-out':
        return this.renderAccessCallToAction(
          '请登录具有 Copilot 许可的账号来配置 Copilot 设置。',
          '登录',
          this.props.onSignIn,
          DialogPreferredFocusClassName
        )
      case 'checking':
        return <p>正在检查 Copilot 访问权限…</p>
      case 'no-license':
        return this.renderAccessCallToAction(
          'GitHub Desktop 的 Copilot 功能需要 GitHub Copilot 许可。',
          '查看 Copilot 方案',
          this.props.onOpenCopilotPlans
        )
      case 'desktop-disabled':
        return this.renderAccessCallToAction(
          '您的账号有 Copilot 许可，但 Copilot 功能设置中关闭了“GitHub Desktop 中的 Copilot”。',
          '打开 Copilot 功能设置',
          this.props.onOpenCopilotFeatureSettings
        )
      case 'enabled':
        return this.renderModelPicker()
    }
  }

  private renderAccessCallToAction(
    message: string,
    actionTitle: string,
    onAction: () => void,
    buttonClassName?: string
  ): JSX.Element {
    return (
      <div className="copilot-access-call-to-action">
        <CallToAction
          actionTitle={actionTitle}
          onAction={onAction}
          buttonClassName={buttonClassName}
        >
          <div>{message}</div>
        </CallToAction>
      </div>
    )
  }

  private renderModelPicker() {
    const { copilotModels, byokProviders } = this.props

    if (copilotModels === null) {
      return <p>正在加载可用模型…</p>
    }

    if (!hasCopilotModelPickerItems(copilotModels, byokProviders)) {
      return <p>没有可用模型。请检查 Copilot 订阅。</p>
    }

    return (
      <>
        <Row className="copilot-feature-hint">
          <p>
            可以通过{' '}
            <LinkButton uri="https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions">
              自定义指令
            </LinkButton>
            调整 Copilot 的行为。
          </p>
        </Row>
        {this.renderFeatureModelPicker(
          copilotModels,
          'commit-message-generation',
          __DARWIN__ ? '生成提交消息' : '生成提交消息',
          this.onCommitMessageModelChanged,
          350
        )}
        <p className="settings-description">
          <LinkButton uri="https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop#write-a-commit-message-and-push-your-changes">
            了解如何生成提交消息。
          </LinkButton>
        </p>
        {enableCopilotConflictResolution() && (
          <>
            {this.renderFeatureModelPicker(
              copilotModels,
              'conflict-resolution',
              __DARWIN__ ? '冲突解决' : '冲突解决',
              this.onConflictResolutionModelChanged,
              280
            )}
            <p className="settings-description">
              模型变更会应用到之后的冲突解决。
            </p>
            <Checkbox
              label={
                __DARWIN__
                  ? '检测到冲突时始终使用 Copilot'
                  : '检测到冲突时始终使用 Copilot'
              }
              value={
                this.props.alwaysUseCopilotForConflictResolution
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onAlwaysUseCopilotForConflictResolutionChanged}
            />
          </>
        )}
      </>
    )
  }

  private renderFeatureModelPicker(
    copilotModels: ReadonlyArray<Model>,
    feature: CopilotFeature,
    label: string,
    onChange: (model: string) => void,
    maxHeight?: number
  ): JSX.Element {
    const { byokProviders, selectedCopilotModels } = this.props

    const rawSelection = selectedCopilotModels[feature] ?? null
    const value = this.resolveSelectionValue(
      copilotModels,
      byokProviders,
      rawSelection
    )
    const selectionInfo = getCopilotModelPickerSelectionInfo(
      copilotModels,
      value
    )

    return (
      <>
        <CopilotModelPicker
          label={label}
          copilotModels={copilotModels}
          byokProviders={byokProviders}
          value={value}
          onChange={onChange}
          maxHeight={maxHeight}
        />
        {selectionInfo === null ? null : (
          <CopilotModelSelectionInfo
            feature={feature}
            selectionInfo={selectionInfo}
          />
        )}
      </>
    )
  }

  private resolveSelectionValue(
    copilotModels: ReadonlyArray<Model>,
    byokProviders: ReadonlyArray<IBYOKProvider>,
    raw: string | null
  ): string {
    if (raw !== null) {
      const key = parseModelKey(raw)
      if (key.kind === 'byok') {
        const provider = byokProviders.find(p => p.id === key.providerId)
        if (provider && provider.models.some(m => m.id === key.modelId)) {
          return encodeModelKey(key)
        }
      } else if (
        key.modelId !== '' &&
        copilotModels.some(m => m.id === key.modelId)
      ) {
        return encodeModelKey({ kind: 'copilot', modelId: key.modelId })
      }
    }

    return this.getFirstSelectableModelValue(copilotModels, byokProviders)
  }

  private getFirstSelectableModelValue(
    copilotModels: ReadonlyArray<Model>,
    byokProviders: ReadonlyArray<IBYOKProvider>
  ): string {
    if (copilotModels.length === 0 && byokProviders.length === 0) {
      // This should not happen because we check for this case earlier, but let's
      // make that assumption explicit and crash if it is violated rather than
      // returning null.
      throw new Error('No models available')
    }

    const preferredCopilotModel = copilotModels.find(
      m => m.id === DefaultCopilotModel
    )
    if (preferredCopilotModel !== undefined) {
      return encodeModelKey({
        kind: 'copilot',
        modelId: preferredCopilotModel.id,
      })
    }

    const firstCopilotModel = copilotModels[0]
    if (firstCopilotModel !== undefined) {
      return encodeModelKey({ kind: 'copilot', modelId: firstCopilotModel.id })
    }

    const firstProvider = byokProviders.find(provider => provider.models[0])

    if (firstProvider === undefined) {
      // This should not happen because we check for selectable models earlier.
      throw new Error('No models available')
    }

    const firstByokModel = firstProvider.models[0]
    return encodeModelKey({
      kind: 'byok',
      providerId: firstProvider.id,
      modelId: firstByokModel.id,
    })
  }

  private renderBYOKProviders() {
    const { byokProviders } = this.props
    return (
      <>
        {byokProviders.length === 0 ? (
          <p className="copilot-byok-empty">
            添加自定义提供商，即可把自己的 API 密钥用于兼容 OpenAI
            的端点、Azure、Anthropic 或 Ollama 等本地提供商。
          </p>
        ) : (
          <ul className="copilot-byok-entry-list">
            {byokProviders.map(this.renderBYOKProvider)}
          </ul>
        )}
        <Button onClick={this.onAddBYOKProviderClick}>
          {__DARWIN__ ? '添加提供商…' : '添加提供商…'}
        </Button>
      </>
    )
  }

  private renderBYOKProvider = (provider: IBYOKProvider) => {
    const modelCount = provider.models.length
    const modelLabel = `${modelCount} 个模型`
    const isLocal = isLocalBaseUrl(provider.baseUrl)
    return (
      <li key={provider.id} className="copilot-byok-entry">
        <div className="copilot-byok-entry-info">
          <div className="copilot-byok-entry-title">
            <span>{provider.name}</span>
            {isLocal && (
              <span className="copilot-byok-provider-badge">本地</span>
            )}
          </div>
          <span className="copilot-byok-entry-meta">
            {this.formatProviderType(provider)} · {modelLabel}
          </span>
        </div>
        <div className="copilot-byok-entry-actions">
          <Button
            onClick={this.onEditBYOKProviderClick(provider)}
            ariaLabel={`编辑 ${provider.name}`}
          >
            <Octicon symbol={octicons.pencil} />
          </Button>
          <Button
            onClick={this.onDeleteBYOKProviderClick(provider)}
            ariaLabel={`移除 ${provider.name}`}
          >
            <Octicon symbol={octicons.trash} />
          </Button>
        </div>
      </li>
    )
  }

  private formatProviderType(provider: IBYOKProvider): string {
    switch (provider.type) {
      case 'openai':
        return '兼容 OpenAI'
      case 'azure':
        return 'Azure'
      case 'anthropic':
        return 'Anthropic'
    }
  }
}
