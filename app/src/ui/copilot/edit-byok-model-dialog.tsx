import * as React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogError } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { Select } from '../lib/select'
import { Row } from '../lib/row'
import { IBYOKModel } from '../../lib/copilot/byok'
import {
  formatReasoningEffort,
  ReasoningEffort,
  ReasoningEffortOrder,
} from '../../lib/stores/copilot-store'

const NoReasoningEffort = '__none__'

interface IEditCopilotBYOKModelDialogProps {
  /** The model being edited, or `null` when adding a new model. */
  readonly model: IBYOKModel | null
  /**
   * Existing model IDs in the same provider, used to detect duplicates.
   * Excludes the model being edited.
   */
  readonly otherModelIds: ReadonlyArray<string>
  readonly onSave: (model: IBYOKModel) => void
  readonly onDismissed: () => void
}

interface IEditCopilotBYOKModelDialogState {
  readonly id: string
  readonly name: string
  readonly reasoningEffort: ReasoningEffort | typeof NoReasoningEffort
  readonly errorMessage: string | null
}

/**
 * Add/edit dialog for a single model belonging to a BYOK Copilot provider.
 * The model is returned to the parent via the `onSave` callback prop and is
 * not persisted directly.
 */
export class EditCopilotBYOKModelDialog extends React.Component<
  IEditCopilotBYOKModelDialogProps,
  IEditCopilotBYOKModelDialogState
> {
  public constructor(props: IEditCopilotBYOKModelDialogProps) {
    super(props)
    this.state = {
      id: props.model?.id ?? '',
      name: props.model?.name ?? '',
      reasoningEffort: props.model?.reasoningEffort ?? NoReasoningEffort,
      errorMessage: null,
    }
  }

  public render() {
    const isEditing = this.props.model !== null
    const title = isEditing
      ? __DARWIN__
        ? '编辑模型'
        : '编辑模型'
      : __DARWIN__
      ? '添加模型'
      : '添加模型'

    return (
      <Dialog
        id="edit-copilot-byok-model"
        title={title}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        {this.state.errorMessage !== null && (
          <DialogError>{this.state.errorMessage}</DialogError>
        )}
        <DialogContent>
          <Row className="copilot-byok-field">
            <TextBox
              label={__DARWIN__ ? '显示名称' : '显示名称'}
              value={this.state.name}
              onValueChanged={this.onNameChanged}
              placeholder="GPT-4o"
              autoFocus={true}
            />
            <p className="copilot-byok-field-hint">
              在 Copilot 模型选择器中显示的易读名称。
            </p>
          </Row>
          <Row className="copilot-byok-field">
            <TextBox
              label={__DARWIN__ ? '模型标识符' : '模型标识符'}
              value={this.state.id}
              onValueChanged={this.onIdChanged}
              placeholder="gpt-4o"
              required={true}
            />
            <p className="copilot-byok-field-hint">
              提供商要求的准确名称（例如 <code>gpt-4o</code>、
              <code>llama3</code>).
            </p>
          </Row>
          <Row className="copilot-byok-field">
            <Select
              label={__DARWIN__ ? '推理强度' : '推理强度'}
              value={this.state.reasoningEffort}
              onChange={this.onReasoningEffortChanged}
            >
              <option value={NoReasoningEffort}>默认（由提供商决定）</option>
              {ReasoningEffortOrder.map(effort => (
                <option key={effort} value={effort}>
                  {formatReasoningEffort(effort)}
                </option>
              ))}
            </Select>
            <p className="copilot-byok-field-hint">
              推理模型（o1、o3、GPT-5
              推理变体等）会先思考再回答。更高强度更慢，但复杂任务效果更好。非推理模型或希望由提供商决定时，请保留
              <em>默认</em>。
            </p>
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={isEditing ? '保存' : '添加'} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onIdChanged = (id: string) => this.setState({ id })

  private onNameChanged = (name: string) => this.setState({ name })

  private onReasoningEffortChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    this.setState({
      reasoningEffort:
        value === NoReasoningEffort
          ? NoReasoningEffort
          : (value as ReasoningEffort),
    })
  }

  private onSubmit = () => {
    const validationError = this.validate()
    if (validationError !== null) {
      this.setState({ errorMessage: validationError })
      return
    }

    const id = this.state.id.trim()
    const name = this.state.name.trim() === '' ? id : this.state.name.trim()
    const model: IBYOKModel = {
      id,
      name,
      ...(this.state.reasoningEffort !== NoReasoningEffort
        ? { reasoningEffort: this.state.reasoningEffort }
        : {}),
    }

    this.props.onSave(model)
    this.props.onDismissed()
  }

  private validate(): string | null {
    const id = this.state.id.trim()
    if (id === '') {
      return '请输入模型标识符。'
    }
    if (this.props.otherModelIds.includes(id)) {
      return `已存在标识符为 '${id}' 的其他模型。`
    }
    return null
  }
}
