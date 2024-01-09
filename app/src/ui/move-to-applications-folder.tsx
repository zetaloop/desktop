import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  OkCancelButtonGroup,
} from './dialog'
import { Dispatcher } from './dispatcher'
import { Checkbox, CheckboxValue } from './lib/checkbox'

interface IMoveToApplicationsFolderProps {
  readonly dispatcher: Dispatcher

  /**
   * Callback to use when the dialog gets closed.
   */
  readonly onDismissed: () => void
}

interface IMoveToApplicationsFolderState {
  readonly askToMoveToApplicationsFolder: boolean
}

export class MoveToApplicationsFolder extends React.Component<
  IMoveToApplicationsFolderProps,
  IMoveToApplicationsFolderState
> {
  public constructor(props: IMoveToApplicationsFolderProps) {
    super(props)
    this.state = {
      askToMoveToApplicationsFolder: true,
    }
  }

  public render() {
    return (
      <Dialog
        title="将 GitHub Desktop 移动到应用程序文件夹？"
        id="move-to-applications-folder"
        backdropDismissable={false}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="warning"
      >
        <DialogContent>
          <p>
            您当前在“应用程序”文件夹外运行了 GitHub
            Desktop。这可能导致一些运行问题，比如无法登录。
          </p>
          <p>
            需要现在将 GitHub Desktop
            移动到“应用程序”文件夹吗？软件将会重新打开。
          </p>
          <div>
            <Checkbox
              label="不再显示"
              value={
                this.state.askToMoveToApplicationsFolder
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskToMoveToApplicationsFolderChanged}
            />
          </div>
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderFooter() {
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText="移动并重启软件"
          okButtonTitle="将 GitHub Desktop 移动到“应用程序”文件夹并重新运行软件。"
          cancelButtonText="以后再说"
          onCancelButtonClick={this.onNotNow}
        />
      </DialogFooter>
    )
  }

  private onAskToMoveToApplicationsFolderChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askToMoveToApplicationsFolder: value })
  }

  private onNotNow = () => {
    this.props.onDismissed()
    this.props.dispatcher.setAskToMoveToApplicationsFolderSetting(
      this.state.askToMoveToApplicationsFolder
    )
  }

  private onSubmit = async () => {
    this.props.onDismissed()

    try {
      await this.props.dispatcher.moveToApplicationsFolder()
    } catch (error) {
      this.props.dispatcher.postError(error)
    }
  }
}
