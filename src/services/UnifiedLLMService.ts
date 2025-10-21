import * as vscode from 'vscode';
import { LocalLLMService } from './LocalLLMService';
import { TableResult } from './OpenMetadataService';

interface LLMServiceInterface {
    analyzeTable(tableMetadata: TableResult): Promise<string>;
    searchInsights(query: string, searchResults: TableResult[], searchTermsUsed: string[], wasNaturalLanguage: boolean): Promise<string>;
    validateConnection?(): Promise<boolean>;
}

export class UnifiedLLMService {
    private service?: LLMServiceInterface;
    private apiUrl: string;
    private token: string;
    private model: string;
    private temperature: number;
    private maxTokens: number;
    private systemPrompt: string;
    private maxHistoryMessages: number;
    private requestTimeout: number;

    constructor() {
        this.initializeService();
    }

    private initializeService() {
        const config = vscode.workspace.getConfiguration('openmetadataExplorer.llm');

        try {
            // Read configuration
            this.apiUrl = config.get<string>('apiUrl') || 'http://localhost:11434/v1/chat/completions';
            this.token = config.get<string>('token') || 'ollama';
            this.model = config.get<string>('model') || 'llama3.2';
            this.temperature = config.get<number>('temperature') ?? 0.7;
            this.maxTokens = config.get<number>('maxTokens') || 2048;
            this.systemPrompt = config.get<string>('systemPrompt') || 'You are a helpful AI assistant for analyzing data catalog metadata. Provide clear, concise insights about tables, columns, and data relationships.';
            this.maxHistoryMessages = config.get<number>('maxHistoryMessages') || 50;
            this.requestTimeout = config.get<number>('requestTimeout') || 120000;

            // Validate that apiUrl is configured
            if (!this.apiUrl || this.apiUrl.trim() === '') {
                console.warn('LLM API URL not configured');
                this.service = undefined;
                return;
            }

            // Create service with unified configuration
            this.service = new LocalLLMService({
                endpoint: this.apiUrl,
                apiKey: this.token,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                systemPrompt: this.systemPrompt,
                requestTimeout: this.requestTimeout
            });

            console.log('LLM Service initialized with:', {
                apiUrl: this.apiUrl,
                model: this.model,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                timeout: this.requestTimeout
            });

        } catch (error) {
            console.error('Failed to initialize LLM service:', error);
            this.service = undefined;
        }
    }

    isConfigured(): boolean {
        return this.service !== undefined;
    }

    getConfiguration() {
        return {
            apiUrl: this.apiUrl,
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            systemPrompt: this.systemPrompt,
            maxHistoryMessages: this.maxHistoryMessages,
            requestTimeout: this.requestTimeout
        };
    }

    async analyzeTable(tableMetadata: TableResult): Promise<string> {
        if (!this.service) {
            return '❌ No LLM service configured. Please configure the API URL and other settings.';
        }

        try {
            return await this.service.analyzeTable(tableMetadata);
        } catch (error) {
            console.error('Error analyzing table:', error);
            return `❌ AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}. Configure the LLM API in settings for AI insights.`
                : `Found ${searchResults.length} tables matching "${query}". Configure the LLM API in settings for AI insights.`;
        }

        try {
            return await this.service.searchInsights(query, searchResults, searchTermsUsed, wasNaturalLanguage);
        } catch (error) {
            console.error('Error getting search insights:', error);
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
            if ('validateConnection' in this.service && this.service.validateConnection) {
                return await this.service.validateConnection();
            }
            return true;
        } catch (error) {
            console.error('Error validating LLM connection:', error);
            return false;
        }
    }

    // Reload configuration when settings change
    reload() {
        this.initializeService();
    }
}
