import * as vscode from 'vscode';
import { OpenAIService } from './OpenAIService';
import { LocalLLMService } from './LocalLLMService';
import { TableResult } from './OpenMetadataService';

type LLMProvider = 'openai' | 'ollama' | 'custom';

interface LLMServiceInterface {
    analyzeTable(tableMetadata: TableResult): Promise<string>;
    searchInsights(query: string, searchResults: TableResult[], searchTermsUsed: string[], wasNaturalLanguage: boolean): Promise<string>;
    validateApiKey?(): Promise<boolean>;
    validateConnection?(): Promise<boolean>;
}

export class UnifiedLLMService {
    private service?: LLMServiceInterface;
    private provider: LLMProvider;

    constructor() {
        const config = vscode.workspace.getConfiguration('openmetadataExplorer');
        this.provider = config.get<LLMProvider>('llm.provider') || 'openai';
        this.initializeService();
    }

    private initializeService() {
        const config = vscode.workspace.getConfiguration('openmetadataExplorer');

        try {
            switch (this.provider) {
                case 'openai':
                    this.service = this.createOpenAIService(config);
                    break;
                case 'ollama':
                    this.service = this.createOllamaService(config);
                    break;
                case 'custom':
                    this.service = this.createCustomService(config);
                    break;
                default:
                    console.warn(`Unknown LLM provider: ${this.provider}, falling back to OpenAI`);
                    this.provider = 'openai';
                    this.service = this.createOpenAIService(config);
            }
        } catch (error) {
            console.error('Failed to initialize LLM service:', error);
            this.service = undefined;
        }
    }

    private createOpenAIService(config: vscode.WorkspaceConfiguration): OpenAIService | undefined {
        const apiKey = config.get<string>('llm.openai.apiKey');
        const model = config.get<string>('llm.openai.model') || 'gpt-4o';
        const baseUrl = config.get<string>('llm.openai.baseUrl') || 'https://api.openai.com/v1';

        if (!apiKey) {
            console.warn('OpenAI API key not configured');
            return undefined;
        }

        return new OpenAIService({ apiKey, model, baseUrl });
    }

    private createOllamaService(config: vscode.WorkspaceConfiguration): LocalLLMService | undefined {
        const endpoint = config.get<string>('llm.ollama.endpoint') || 'http://localhost:11434';
        const model = config.get<string>('llm.ollama.model') || 'llama2';

        return new LocalLLMService({ endpoint, model });
    }

    private createCustomService(config: vscode.WorkspaceConfiguration): LocalLLMService | undefined {
        const endpoint = config.get<string>('llm.custom.endpoint');
        const apiKey = config.get<string>('llm.custom.apiKey');
        const model = config.get<string>('llm.custom.model');

        if (!endpoint) {
            console.warn('Custom LLM endpoint not configured');
            return undefined;
        }

        return new LocalLLMService({ endpoint, apiKey, model });
    }

    isConfigured(): boolean {
        return this.service !== undefined;
    }

    getProvider(): LLMProvider {
        return this.provider;
    }

    async analyzeTable(tableMetadata: TableResult): Promise<string> {
        if (!this.service) {
            return '❌ No LLM service configured. Please configure OpenAI, Ollama, or a custom endpoint in settings.';
        }

        try {
            return await this.service.analyzeTable(tableMetadata);
        } catch (error) {
            console.error(`Error analyzing table with ${this.provider}:`, error);
            return `❌ AI analysis failed with ${this.provider}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    async searchInsights(
        query: string,
        searchResults: TableResult[],
        searchTermsUsed: string[],
        wasNaturalLanguage: boolean
    ): Promise<string> {
        if (!this.service) {
            return wasNaturalLanguage
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}. Configure an LLM provider in settings for AI insights.`
                : `Found ${searchResults.length} tables matching "${query}". Configure an LLM provider in settings for AI insights.`;
        }

        try {
            return await this.service.searchInsights(query, searchResults, searchTermsUsed, wasNaturalLanguage);
        } catch (error) {
            console.error(`Error getting search insights with ${this.provider}:`, error);
            return wasNaturalLanguage
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}. AI insights temporarily unavailable.`
                : `Found ${searchResults.length} tables matching "${query}". AI insights temporarily unavailable.`;
        }
    }

    async validateConnection(): Promise<boolean> {
        if (!this.service) {
            return false;
        }

        try {
            if ('validateApiKey' in this.service && this.service.validateApiKey) {
                return await this.service.validateApiKey();
            } else if ('validateConnection' in this.service && this.service.validateConnection) {
                return await this.service.validateConnection();
            }
            return true;
        } catch (error) {
            console.error(`Error validating ${this.provider} connection:`, error);
            return false;
        }
    }

    // Reload configuration when settings change
    reload() {
        const config = vscode.workspace.getConfiguration('openmetadataExplorer');
        this.provider = config.get<LLMProvider>('llm.provider') || 'openai';
        this.initializeService();
    }
}
