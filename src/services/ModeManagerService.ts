import * as vscode from 'vscode'

// Minimal ModeManagerService: handles basic webview messaging (non-speech)
export class ModeManagerService {
  private isInitialized = false
  private messageHandler?: (message: any) => void

  constructor(private context: vscode.ExtensionContext) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  setMessageHandler(handler: (message: any) => void) {
    this.messageHandler = handler
  }

  private sendMessage(message: any) {
    if (this.messageHandler) this.messageHandler(message)
  }

  async handleMessage(message: any): Promise<any> {
    switch (message.type) {
      case 'copyToClipboard':
        try {
          await vscode.env.clipboard.writeText(message.text)
          this.sendMessage({ type: 'showSuccess' })
        } catch (error) {
          console.error('Failed to copy to clipboard:', error)
        }
        break
      default:
        // Unknown messages are ignored
        break
    }
  }

  dispose() {
    // no-op
  }
}
