import * as vscode from 'vscode';
import { OpenMetadataExplorerProvider } from './OpenMetadataExplorerProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Local LLM Chat for OpenMetadata: Starting activation...');

    try {
        // Create the webview provider
        console.log('🔧 Creating webview provider...');
        const provider = new OpenMetadataExplorerProvider(context.extensionUri, context);

        // Register the webview provider
        console.log('📝 Registering webview provider...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('openmetadataExplorer', provider)
        );

        // Register refresh command
        console.log('⚙️ Registering commands...');
        context.subscriptions.push(
            vscode.commands.registerCommand('openmetadataExplorer.refresh', () => {
                provider.refresh();
            })
        );

        console.log('✅ Local LLM Chat for OpenMetadata activated successfully!');

        // Show welcome message
        vscode.window.showInformationMessage('Local LLM Chat for OpenMetadata is ready! 🚀');
    } catch (error) {
        console.error('❌ Failed to activate Local LLM Chat for OpenMetadata:', error);
        vscode.window.showErrorMessage(`Failed to activate Local LLM Chat for OpenMetadata: ${error}`);
    }
}

export function deactivate() {
    console.log('Local LLM Chat for OpenMetadata deactivated');
}