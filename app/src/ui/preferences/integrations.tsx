import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { Row } from '../../ui/lib/row'
import { Select } from '../lib/select'
import { Shell, parse as parseShell } from '../../lib/shells'
import { suggestedExternalEditor } from '../../lib/editors/shared'
import { CustomIntegrationForm } from './custom-integration-form'
import { ICustomIntegration } from '../../lib/custom-integration'
import { enableCustomIntegration } from '../../lib/feature-flag'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { TextBox } from '../lib/text-box'
import { TabBar } from '../tab-bar'

const CustomIntegrationValue = 'other'
const DifftasticDocsUrl = 'https://difftastic.wilfred.me.uk/'
const MergirafUrl = 'https://mergiraf.org/'

interface IIntegrationsPreferencesProps {
  readonly availableEditors: ReadonlyArray<string>
  readonly selectedExternalEditor: string | null
  readonly availableShells: ReadonlyArray<Shell>
  readonly selectedShell: Shell
  readonly useCustomEditor: boolean
  readonly customEditor: ICustomIntegration
  readonly useCustomShell: boolean
  readonly customShell: ICustomIntegration
  readonly onSelectedEditorChanged: (editor: string) => void
  readonly onSelectedShellChanged: (shell: Shell) => void
  readonly onUseCustomEditorChanged: (useCustomEditor: boolean) => void
  readonly onCustomEditorChanged: (customEditor: ICustomIntegration) => void
  readonly onUseCustomShellChanged: (useCustomShell: boolean) => void
  readonly onCustomShellChanged: (customShell: ICustomIntegration) => void
  readonly copilotUseCommitHistoryStyle: boolean
  readonly onCopilotUseCommitHistoryStyleChanged: (value: boolean) => void
  readonly copilotCustomStyle: string
  readonly onCopilotCustomStyleChanged: (value: string) => void
  readonly copilotDiffTruncationLimit: number
  readonly onCopilotDiffTruncationLimitChanged: (value: number) => void
  readonly enableDifftastic: boolean
  readonly onEnableDifftasticChanged: (value: boolean) => void
}

interface IIntegrationsPreferencesState {
  readonly selectedExternalEditor: string | null
  readonly selectedShell: Shell
  readonly useCustomEditor: boolean
  readonly customEditor: ICustomIntegration
  readonly useCustomShell: boolean
  readonly customShell: ICustomIntegration
  readonly copilotUseCommitHistoryStyle: boolean
  readonly copilotCustomStyle: string
  readonly copilotDiffTruncationLimit: number
  readonly enableDifftastic: boolean
  readonly selectedTabIndex: number
}

export class Integrations extends React.Component<
  IIntegrationsPreferencesProps,
  IIntegrationsPreferencesState
> {
  private customEditorFormRef = React.createRef<CustomIntegrationForm>()
  private customShellFormRef = React.createRef<CustomIntegrationForm>()

  public constructor(props: IIntegrationsPreferencesProps) {
    super(props)

    this.state = {
      selectedExternalEditor: this.props.selectedExternalEditor,
      selectedShell: this.props.selectedShell,
      useCustomEditor: this.props.useCustomEditor,
      customEditor: this.props.customEditor,
      useCustomShell: this.props.useCustomShell,
      customShell: this.props.customShell,
      copilotUseCommitHistoryStyle: this.props.copilotUseCommitHistoryStyle,
      copilotCustomStyle: this.props.copilotCustomStyle,
      copilotDiffTruncationLimit: this.props.copilotDiffTruncationLimit,
      enableDifftastic: this.props.enableDifftastic,
      selectedTabIndex: 0,
    }
  }

  public async componentWillReceiveProps(
    nextProps: IIntegrationsPreferencesProps
  ) {
    const editors = nextProps.availableEditors
    let selectedExternalEditor = nextProps.selectedExternalEditor
    if (editors.length) {
      const indexOf = selectedExternalEditor
        ? editors.indexOf(selectedExternalEditor)
        : -1
      if (indexOf === -1) {
        selectedExternalEditor = editors[0]
        nextProps.onSelectedEditorChanged(selectedExternalEditor)
      }
    }

    const shells = nextProps.availableShells
    let selectedShell = nextProps.selectedShell
    if (shells.length) {
      const indexOf = shells.indexOf(selectedShell)
      if (indexOf === -1) {
        selectedShell = shells[0]
        nextProps.onSelectedShellChanged(selectedShell)
      }
    }
    this.setState({
      selectedExternalEditor,
      selectedShell,
      useCustomEditor: nextProps.useCustomEditor,
      useCustomShell: nextProps.useCustomShell,
      customShell: nextProps.customShell,
      customEditor: nextProps.customEditor,
      copilotUseCommitHistoryStyle: nextProps.copilotUseCommitHistoryStyle,
      copilotCustomStyle: nextProps.copilotCustomStyle,
      copilotDiffTruncationLimit: nextProps.copilotDiffTruncationLimit,
      enableDifftastic: nextProps.enableDifftastic,
    })
  }

  public componentDidMount(): void {
    if (enableCustomIntegration()) {
      const {
        availableEditors,
        availableShells,
        useCustomEditor,
        useCustomShell,
      } = this.props

      // When there are no available editors or shells, the `Select` component
      // will have the custom editor or shell already selected, but we need
      // to handle that as initial value, otherwise the custom integration
      // form won't be rendered.

      if (availableEditors.length === 0 && !useCustomEditor) {
        this.setSelectedEditor(CustomIntegrationValue)
      }

      if (availableShells.length === 0 && !useCustomShell) {
        this.setSelectedShell(CustomIntegrationValue)
      }
    }
  }

  public componentDidUpdate(
    prevProps: IIntegrationsPreferencesProps,
    prevState: IIntegrationsPreferencesState
  ): void {
    // When the user switches to the custom editor or shell, we want to focus the
    // path input field.
    if (!prevState.useCustomEditor && this.state.useCustomEditor) {
      this.customEditorFormRef.current?.focus()
    }

    if (!prevState.useCustomShell && this.state.useCustomShell) {
      this.customShellFormRef.current?.focus()
    }
  }

  private onSelectedEditorChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (!value) {
      return
    }

    this.setSelectedEditor(value)
  }

  private setSelectedEditor = (editor: string) => {
    if (editor === CustomIntegrationValue) {
      this.setState({ useCustomEditor: true })
      this.props.onUseCustomEditorChanged(true)
    } else {
      this.setState({
        useCustomEditor: false,
        selectedExternalEditor: editor,
      })
      this.props.onUseCustomEditorChanged(false)
      this.props.onSelectedEditorChanged(editor)
    }
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (!value) {
      return
    }

    this.setSelectedShell(value)
  }

  private setSelectedShell = (shell: string) => {
    if (shell === CustomIntegrationValue) {
      this.setState({ useCustomShell: true })
      this.props.onUseCustomShellChanged(true)
    } else {
      const parsedValue = parseShell(shell)
      this.setState({
        useCustomShell: false,
        selectedShell: parsedValue,
      })
      this.props.onSelectedShellChanged(parsedValue)
      this.props.onUseCustomShellChanged(false)
    }
  }

  private onCopilotUseCommitHistoryStyleChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const checked = event.currentTarget.checked
    this.setState({ copilotUseCommitHistoryStyle: checked })
    this.props.onCopilotUseCommitHistoryStyleChanged(checked)
  }

  private onCopilotCustomStyleChanged = (value: string) => {
    this.setState({ copilotCustomStyle: value })
    this.props.onCopilotCustomStyleChanged(value)
  }

  private onCopilotDiffTruncationLimitChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = parseInt(event.currentTarget.value, 10)
    this.setState({ copilotDiffTruncationLimit: value })
    this.props.onCopilotDiffTruncationLimitChanged(value)
  }

  private onEnableDifftasticChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const checked = event.currentTarget.checked
    this.setState({ enableDifftastic: checked })
    this.props.onEnableDifftasticChanged(checked)
  }

  private onTabClicked = (selectedTabIndex: number) => {
    this.setState({ selectedTabIndex })
  }

  private renderExternalEditor() {
    const options = this.props.availableEditors
    const { selectedExternalEditor, useCustomEditor } = this.state
    const label = __DARWIN__ ? '编辑器' : '编辑器'

    if (!enableCustomIntegration() && options.length === 0) {
      // this is emulating the <Select/> component's UI so the styles are
      // consistent for either case.
      //
      // TODO: see whether it makes sense to have a fallback UI
      // which we display when the select list is empty
      return (
        <div className="select-component no-options-found">
          <label>{label}</label>
          <span>
            没有可用的编辑器。
            <LinkButton uri={suggestedExternalEditor.url}>
              装个 {suggestedExternalEditor.name}
            </LinkButton>
            ？
          </span>
        </div>
      )
    }

    return (
      <Select
        label={enableCustomIntegration() ? undefined : label}
        aria-label="编辑器"
        value={
          useCustomEditor
            ? CustomIntegrationValue
            : selectedExternalEditor ?? undefined
        }
        onChange={this.onSelectedEditorChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {enableCustomIntegration() && (
          <option key={CustomIntegrationValue} value={CustomIntegrationValue}>
            {__DARWIN__ ? '配置自定义编辑器…' : '配置自定义编辑器…'}
          </option>
        )}
      </Select>
    )
  }

  private renderNoExternalEditorHint() {
    const options = this.props.availableEditors
    if (options.length > 0) {
      return null
    }

    return (
      <Row>
        <div className="no-options-found">
          <span>
            需要一个编辑器？
            <LinkButton uri={suggestedExternalEditor.url}>
              装个 {suggestedExternalEditor.name} 吧
            </LinkButton>
            。
          </span>
        </div>
      </Row>
    )
  }

  private renderCustomExternalEditor() {
    return (
      <Row>
        <CustomIntegrationForm
          id="custom-editor"
          ref={this.customEditorFormRef}
          path={this.state.customEditor.path ?? ''}
          arguments={this.state.customEditor.arguments}
          onPathChanged={this.onCustomEditorPathChanged}
          onArgumentsChanged={this.onCustomEditorArgumentsChanged}
        />
      </Row>
    )
  }

  private onCustomEditorPathChanged = (path: string, bundleID?: string) => {
    const customEditor: ICustomIntegration = {
      path,
      bundleID,
      arguments: this.state.customEditor.arguments ?? [],
    }

    this.setState({ customEditor })
    this.props.onCustomEditorChanged(customEditor)
  }

  private onCustomEditorArgumentsChanged = (args: string) => {
    const customEditor: ICustomIntegration = {
      path: this.state.customEditor.path,
      bundleID: this.state.customEditor.bundleID,
      arguments: args,
    }

    this.setState({ customEditor })
    this.props.onCustomEditorChanged(customEditor)
  }

  private renderSelectedShell() {
    const options = this.props.availableShells
    const { selectedShell, useCustomShell } = this.state

    return (
      <Select
        label={enableCustomIntegration() ? undefined : '终端'}
        aria-label="终端"
        value={useCustomShell ? CustomIntegrationValue : selectedShell}
        onChange={this.onSelectedShellChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {enableCustomIntegration() && (
          <option key={CustomIntegrationValue} value={CustomIntegrationValue}>
            {__DARWIN__ ? '配置自定义终端…' : '配置自定义终端…'}
          </option>
        )}
      </Select>
    )
  }

  private renderCustomShell() {
    return (
      <Row>
        <CustomIntegrationForm
          id="custom-shell"
          ref={this.customShellFormRef}
          path={this.state.customShell.path}
          arguments={this.state.customShell.arguments}
          onPathChanged={this.onCustomShellPathChanged}
          onArgumentsChanged={this.onCustomShellArgumentsChanged}
        />
      </Row>
    )
  }

  private onCustomShellPathChanged = (path: string, bundleID?: string) => {
    const customShell: ICustomIntegration = {
      path,
      bundleID,
      arguments: this.state.customShell.arguments ?? [],
    }

    this.setState({ customShell })
    this.props.onCustomShellChanged(customShell)
  }

  private onCustomShellArgumentsChanged = (args: string) => {
    const customShell: ICustomIntegration = {
      path: this.state.customShell.path ?? '',
      bundleID: this.state.customShell.bundleID,
      arguments: args,
    }

    this.setState({ customShell })
    this.props.onCustomShellChanged(customShell)
  }

  private renderCopilotSettings() {
    const copilotHistoryDescId = 'copilot-history-description'
    const copilotCustomStyleDescId = 'copilot-custom-style-description'
    const copilotDiffTruncationLimitDescId =
      'copilot-diff-truncation-limit-description'
    const truncationOptions = [
      { value: 0, label: '无限制' },
      { value: 100000, label: '100k' },
      { value: 200000, label: '200k' },
      { value: 300000, label: '300k' },
      { value: 400000, label: '400k' },
      { value: 500000, label: '500k' },
      { value: 600000, label: '600k' },
      { value: 700000, label: '700k' },
      { value: 800000, label: '800k' },
      { value: 900000, label: '900k' },
      { value: 1000000, label: '1000k' },
    ]
    return (
      <div className="copilot-settings-component">
        <h2>GitHub Copilot</h2>
        <p className="git-settings-description">
          以下调整选项是汉化版的增强功能。
        </p>
        <Checkbox
          label="参考最近的提交历史"
          value={
            this.state.copilotUseCommitHistoryStyle
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onCopilotUseCommitHistoryStyleChanged}
          ariaDescribedBy={copilotHistoryDescId}
        />
        <p id={copilotHistoryDescId} className="git-settings-description">
          生成提交消息时参考最近十条提交消息内容。
        </p>
        <TextBox
          label="自定义提交风格"
          value={this.state.copilotCustomStyle}
          onValueChanged={this.onCopilotCustomStyleChanged}
          placeholder="例如：采用简洁的 Conventional Commits 风格，使用中文"
          ariaDescribedBy={copilotCustomStyleDescId}
        />
        <p id={copilotCustomStyleDescId} className="git-settings-description">
          生成提交消息时采用此处要求的风格。
        </p>
        <Select
          label="读取字数限制"
          value={this.state.copilotDiffTruncationLimit.toString()}
          onChange={this.onCopilotDiffTruncationLimitChanged}
          aria-describedby={copilotDiffTruncationLimitDescId}
        >
          {truncationOptions.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <p
          id={copilotDiffTruncationLimitDescId}
          className="git-settings-description"
        >
          生成提交消息时最多读取的改动字符数，超出的部分会被忽略。
        </p>
      </div>
    )
  }

  private renderDifftasticSettings() {
    const enableDifftasticDescId = 'enable-difftastic-description'

    return (
      <div className="copilot-settings-component">
        <h2>Difftastic</h2>
        <p className="git-settings-description">
          以下调整选项是汉化版的增强功能。
        </p>
        <Checkbox
          label="使用 Difftastic 渲染差异"
          value={
            this.state.enableDifftastic ? CheckboxValue.On : CheckboxValue.Off
          }
          onChange={this.onEnableDifftasticChanged}
          ariaDescribedBy={enableDifftasticDescId}
        />
        <p id={enableDifftasticDescId} className="git-settings-description">
          Difftastic
          是一个基于代码语法结构的差异引擎，启用后将会用它来分析文件差异。
        </p>
        <p className="git-settings-description">
          您需要自己通过 Scoop、Homebrew 等方式安装
          <LinkButton uri={DifftasticDocsUrl}>Difftastic</LinkButton>
          ，未安装则不生效。
        </p>
        <p className="git-settings-description">
          这是实验性功能，做着玩的不保证能用。某些功能（例如选择特定几行改动）可能会有问题。
        </p>
        <p className="git-settings-description">
          顺便一提您也可以试试
          <LinkButton uri={MergirafUrl}>Mergiraf</LinkButton>
          ，它是一个基于语法结构的合并引擎。
        </p>
      </div>
    )
  }

  private renderGeneralSettings() {
    if (!enableCustomIntegration()) {
      return (
        <>
          <h2>默认应用</h2>
          <Row>{this.renderExternalEditor()}</Row>
          <Row>{this.renderSelectedShell()}</Row>
        </>
      )
    }

    return (
      <>
        <fieldset>
          <legend>
            <h2>{__DARWIN__ ? '编辑器' : '编辑器'}</h2>
          </legend>
          <Row>{this.renderExternalEditor()}</Row>
          {this.state.useCustomEditor && this.renderCustomExternalEditor()}
          {this.renderNoExternalEditorHint()}
        </fieldset>
        <fieldset>
          <legend>
            <h2>终端</h2>
          </legend>
          <Row>{this.renderSelectedShell()}</Row>
          {this.state.useCustomShell && this.renderCustomShell()}
        </fieldset>
      </>
    )
  }

  private renderCurrentTab() {
    if (this.state.selectedTabIndex === 0) {
      return this.renderGeneralSettings()
    } else if (this.state.selectedTabIndex === 1) {
      return this.renderCopilotSettings()
    } else if (this.state.selectedTabIndex === 2) {
      return this.renderDifftasticSettings()
    }

    return null
  }

  public render() {
    return (
      <DialogContent className="integrations-preferences">
        <TabBar
          selectedIndex={this.state.selectedTabIndex}
          onTabClicked={this.onTabClicked}
        >
          <span>通用</span>
          <span>Copilot</span>
          <span>Difftastic</span>
        </TabBar>
        <div className="integrations-preferences-content">
          {this.renderCurrentTab()}
        </div>
      </DialogContent>
    )
  }
}
