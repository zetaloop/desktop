import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogError } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { Select } from '../lib/select'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import {
  IBYOKProvider,
  IBYOKModel,
  BYOKProviderType,
  BYOKAuthKind,
  BYOKWireApi,
  isValidBYOKBaseUrl,
  requiresNewBYOKSecret,
} from '../../lib/copilot/byok'
import { formatReasoningEffort } from '../../lib/stores/copilot-store'
import { Dispatcher } from '../dispatcher'
import { PopupType } from '../../models/popup'

interface IEditCopilotBYOKProviderDialogProps {
  readonly dispatcher: Dispatcher
  /** Provider to edit, or `null` when adding a new one. */
  readonly provider: IBYOKProvider | null
  readonly onSave: (
    provider: IBYOKProvider,
    secret: string | null | undefined
  ) => void
  readonly onDismissed: () => void
}

interface IEditCopilotBYOKProviderDialogState {
  readonly name: string
  readonly type: BYOKProviderType
  readonly baseUrl: string
  readonly wireApi: BYOKWireApi
  readonly azureApiVersion: string
  readonly authKind: BYOKAuthKind
  /**
   * The secret as entered by the user. Empty string while editing means "do
   * not change the stored secret".
   */
  readonly secret: string
  /**
   * Per-provider request timeout in seconds, as a string so the field can be
   * empty (meaning "use the default").
   */
  readonly requestTimeoutSeconds: string
  readonly models: ReadonlyArray<IBYOKModel>
  readonly errorMessage: string | null
}

/**
 * Dialog used to add or edit a single BYOK Copilot provider, including its
 * model list and (separately stored) secret.
 */
interface IModelRowProps {
  readonly index: number
  readonly model: IBYOKModel
  readonly onEdit: (index: number) => void
  readonly onRemove: (index: number) => void
}

class ModelRow extends React.Component<IModelRowProps> {
  public render() {
    const { model } = this.props
    const heading =
      model.name.trim() !== ''
        ? model.name
        : model.id !== ''
        ? model.id
        : '未命名模型'
    const reasoningLabel =
      model.reasoningEffort !== undefined
        ? `推理：${formatReasoningEffort(model.reasoningEffort)}`
        : null
    return (
      <li className="copilot-byok-entry">
        <div className="copilot-byok-entry-info">
          <div className="copilot-byok-entry-title">
            <span>{heading}</span>
          </div>
          <span className="copilot-byok-entry-meta">
            <code>{model.id || '—'}</code>
            {reasoningLabel !== null ? ` · ${reasoningLabel}` : ''}
          </span>
        </div>
        <div className="copilot-byok-entry-actions">
          <Button onClick={this.onEdit} ariaLabel={`编辑 ${heading}`}>
            <Octicon symbol={octicons.pencil} />
          </Button>
          <Button onClick={this.onRemove} ariaLabel={`移除 ${heading}`}>
            <Octicon symbol={octicons.trash} />
          </Button>
        </div>
      </li>
    )
  }

  private onEdit = () => this.props.onEdit(this.props.index)
  private onRemove = () => this.props.onRemove(this.props.index)
}

/**
 * Returns a hint URL appropriate for the given provider type, used as the
 * placeholder in the Base URL field.
 */
function getBaseUrlPlaceholder(type: BYOKProviderType): string {
  switch (type) {
    case 'openai':
      return 'https://api.openai.com/v1'
    case 'azure':
      return 'https://<resource>.openai.azure.com/'
    case 'anthropic':
      return 'https://api.anthropic.com'
  }
}
export class EditCopilotBYOKProviderDialog extends React.Component<
  IEditCopilotBYOKProviderDialogProps,
  IEditCopilotBYOKProviderDialogState
> {
  public constructor(props: IEditCopilotBYOKProviderDialogProps) {
    super(props)

    const provider = props.provider

    this.state = {
      name: provider?.name ?? '',
      type: provider?.type ?? 'openai',
      baseUrl: provider?.baseUrl ?? '',
      wireApi: provider?.wireApi ?? 'completions',
      azureApiVersion: provider?.azureApiVersion ?? '',
      authKind: provider?.authKind ?? 'apiKey',
      secret: '',
      requestTimeoutSeconds:
        provider?.requestTimeoutSeconds !== undefined
          ? String(provider.requestTimeoutSeconds)
          : '',
      models: provider ? [...provider.models] : [],
      errorMessage: null,
    }
  }

  public render() {
    const isEditing = this.props.provider !== null
    const title = isEditing
      ? __DARWIN__
        ? '编辑自定义提供商'
        : '编辑自定义提供商'
      : __DARWIN__
      ? '添加自定义提供商'
      : '添加自定义提供商'

    return (
      <Dialog
        id="edit-copilot-byok-provider"
        title={title}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        {this.state.errorMessage !== null && (
          <DialogError>{this.state.errorMessage}</DialogError>
        )}
        <DialogContent>
          {this.renderProviderSection()}
          {this.renderAuthenticationSection(isEditing)}
          {this.renderModelsSection()}
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={isEditing ? '保存' : '添加'} />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderProviderSection() {
    return (
      <fieldset className="copilot-byok-fieldset">
        <legend>提供商</legend>
        <Row>
          <TextBox
            label="名称"
            value={this.state.name}
            onValueChanged={this.onNameChanged}
            placeholder="我的提供商"
            required={true}
            autoFocus={true}
          />
        </Row>
        <Row>
          <Select
            label="类型"
            value={this.state.type}
            onChange={this.onTypeChanged}
          >
            <option value="openai">OpenAI / 兼容 OpenAI</option>
            <option value="azure">Azure</option>
            <option value="anthropic">Anthropic</option>
          </Select>
        </Row>
        <Row>
          <TextBox
            label={__DARWIN__ ? 'Base URL' : 'Base URL'}
            value={this.state.baseUrl}
            onValueChanged={this.onBaseUrlChanged}
            placeholder={getBaseUrlPlaceholder(this.state.type)}
            required={true}
          />
        </Row>
        {this.state.type === 'openai' && (
          <Row>
            <Select
              label={__DARWIN__ ? 'API 格式' : 'API 格式'}
              value={this.state.wireApi}
              onChange={this.onWireApiChanged}
            >
              <option value="completions">Chat completions（默认）</option>
              <option value="responses">Responses（GPT-5 系列）</option>
            </Select>
          </Row>
        )}
        {this.state.type === 'azure' && (
          <Row>
            <TextBox
              label={__DARWIN__ ? 'Azure API 版本' : 'Azure API 版本'}
              value={this.state.azureApiVersion}
              onValueChanged={this.onAzureApiVersionChanged}
              placeholder="2024-10-21"
            />
          </Row>
        )}
        <Row>
          <TextBox
            label={__DARWIN__ ? '请求超时（秒）' : '请求超时（秒）'}
            value={this.state.requestTimeoutSeconds}
            onValueChanged={this.onRequestTimeoutChanged}
            placeholder="60"
          />
        </Row>
      </fieldset>
    )
  }

  private renderAuthenticationSection(isEditing: boolean) {
    return (
      <fieldset className="copilot-byok-fieldset">
        <Row>
          <Select
            label="认证"
            value={this.state.authKind}
            onChange={this.onAuthKindChanged}
          >
            <option value="apiKey">API key</option>
            <option value="bearer">Bearer token</option>
            <option value="none">无</option>
          </Select>
        </Row>
        {this.state.authKind !== 'none' && (
          <Row>
            <TextBox
              label={
                this.state.authKind === 'bearer' ? 'Bearer token' : 'API key'
              }
              type="password"
              value={this.state.secret}
              onValueChanged={this.onSecretChanged}
              placeholder={isEditing ? '（不变）' : ''}
            />
          </Row>
        )}
        {this.state.authKind === 'none' && (
          <p className="copilot-byok-section-hint">
            发送给此提供商的请求不会附带凭据。
          </p>
        )}
      </fieldset>
    )
  }

  private renderModelsSection() {
    return (
      <fieldset className="copilot-byok-fieldset copilot-byok-models">
        <legend>模型</legend>
        <p className="copilot-byok-section-hint">
          告诉 Desktop 此提供商提供哪些模型。每个模型都会出现在 Copilot
          功能的模型选择器中。
        </p>
        {this.state.models.length === 0 ? (
          <p className="copilot-byok-empty">
            暂无模型。请至少添加一个模型来使用此提供商。
          </p>
        ) : (
          <ul className="copilot-byok-entry-list">
            {this.state.models.map((m, i) => (
              <ModelRow
                key={i}
                index={i}
                model={m}
                onEdit={this.onEditModel}
                onRemove={this.onRemoveModel}
              />
            ))}
          </ul>
        )}
        <Button onClick={this.onAddModel}>
          {__DARWIN__ ? '添加模型…' : '添加模型…'}
        </Button>
      </fieldset>
    )
  }

  private onNameChanged = (name: string) => this.setState({ name })

  private onTypeChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    this.setState({ type: event.currentTarget.value as BYOKProviderType })
  }

  private onBaseUrlChanged = (baseUrl: string) => this.setState({ baseUrl })

  private onWireApiChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    this.setState({ wireApi: event.currentTarget.value as BYOKWireApi })
  }

  private onAzureApiVersionChanged = (azureApiVersion: string) =>
    this.setState({ azureApiVersion })

  private onAuthKindChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    this.setState({ authKind: event.currentTarget.value as BYOKAuthKind })
  }

  private onSecretChanged = (secret: string) => this.setState({ secret })

  private onRequestTimeoutChanged = (requestTimeoutSeconds: string) =>
    this.setState({ requestTimeoutSeconds })

  private onAddModel = () => {
    this.openModelDialog(null)
  }

  private onEditModel = (index: number) => {
    this.openModelDialog(index)
  }

  private openModelDialog(index: number | null) {
    const model = index !== null ? this.state.models[index] : null
    const otherModelIds = this.state.models
      .filter((_, i) => i !== index)
      .map(m => m.id.trim())
      .filter(id => id !== '')
    this.props.dispatcher.showPopup({
      type: PopupType.EditCopilotBYOKModel,
      model,
      otherModelIds,
      onSave: saved => this.onModelSaved(index, saved),
    })
  }

  private onModelSaved = (index: number | null, model: IBYOKModel) => {
    this.setState(state => {
      const models =
        index !== null
          ? state.models.map((m, i) => (i === index ? model : m))
          : [...state.models, model]
      return { models }
    })
  }

  private onRemoveModel = (index: number) => {
    this.setState(state => ({
      models: state.models.filter((_, i) => i !== index),
    }))
  }

  private onSubmit = () => {
    const validationError = this.validate()
    if (validationError !== null) {
      this.setState({ errorMessage: validationError })
      return
    }

    const existing = this.props.provider
    const id = existing?.id ?? crypto.randomUUID()
    const trimmedModels = this.state.models
      .filter(m => m.id.trim() !== '')
      .map(m => ({
        id: m.id.trim(),
        name: m.name.trim() === '' ? m.id.trim() : m.name.trim(),
        ...(m.reasoningEffort !== undefined
          ? { reasoningEffort: m.reasoningEffort }
          : {}),
      }))

    const provider: IBYOKProvider = {
      id,
      name: this.state.name.trim(),
      type: this.state.type,
      baseUrl: this.state.baseUrl.trim(),
      authKind: this.state.authKind,
      models: trimmedModels,
      ...(this.state.type === 'openai' ? { wireApi: this.state.wireApi } : {}),
      ...(this.state.type === 'azure' &&
      this.state.azureApiVersion.trim() !== ''
        ? { azureApiVersion: this.state.azureApiVersion.trim() }
        : {}),
      ...(this.state.requestTimeoutSeconds.trim() !== ''
        ? {
            requestTimeoutSeconds: Number(
              this.state.requestTimeoutSeconds.trim()
            ),
          }
        : {}),
    }

    // Distinguish "user typed a new secret" from "leave alone" (edit-only).
    const secret =
      this.state.authKind === 'none'
        ? null
        : this.state.secret.length > 0
        ? this.state.secret
        : existing === null
        ? null
        : undefined

    this.props.onSave(provider, secret)
    this.props.onDismissed()
  }

  private validate(): string | null {
    if (this.state.name.trim() === '') {
      return '请输入名称。'
    }

    const trimmedUrl = this.state.baseUrl.trim()
    if (trimmedUrl === '') {
      return '请输入 Base URL。'
    }
    if (!isValidBYOKBaseUrl(trimmedUrl)) {
      return 'Base URL 必须是 https URL，或指向本机的 http URL。'
    }

    const trimmedModels = this.state.models.filter(m => m.id.trim() !== '')
    if (trimmedModels.length === 0) {
      return '请至少添加一个模型。'
    }

    const ids = new Set<string>()
    for (const model of trimmedModels) {
      const id = model.id.trim()
      if (ids.has(id)) {
        return `模型 ID '${id}' 重复。`
      }
      ids.add(id)
    }

    const existing = this.props.provider
    if (
      this.state.secret.length === 0 &&
      requiresNewBYOKSecret(this.state.authKind, existing)
    ) {
      return this.state.authKind === 'bearer'
        ? '请输入 bearer token。'
        : '请输入 API key。'
    }

    const trimmedTimeout = this.state.requestTimeoutSeconds.trim()
    if (trimmedTimeout !== '') {
      const timeout = Number(trimmedTimeout)
      if (!Number.isFinite(timeout) || timeout <= 0) {
        return '请求超时必须是正数秒数。'
      }
    }

    return null
  }
}
