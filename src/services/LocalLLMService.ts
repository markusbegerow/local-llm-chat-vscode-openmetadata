import axios from 'axios';
import { TableResult } from './OpenMetadataService';

interface LocalLLMConfig {
    endpoint: string;
    apiKey?: string;
    model?: string;
}

interface OpenAICompatibleMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class LocalLLMService {
    private config: LocalLLMConfig;

    constructor(config: LocalLLMConfig) {
        this.config = config;
    }

    async analyzeTable(tableMetadata: TableResult): Promise<string> {
        const systemPrompt = 'You are a data engineering expert analyzing database tables. Provide concise, practical analysis.';

        const userPrompt = `
Analyze this database table:

TABLE INFORMATION:
- Name: ${tableMetadata.name}
- Full Name: ${tableMetadata.fullyQualifiedName}
- Type: ${tableMetadata.tableType || 'Unknown'}
- Database: ${tableMetadata.database || 'Unknown'}
- Schema: ${tableMetadata.schema || 'Unknown'}
- Description: ${tableMetadata.description || 'No description provided'}
- Row Count: ${tableMetadata.rowCount || 'Unknown'}
- Last Updated: ${tableMetadata.updatedAt || 'Unknown'}
- Tags: ${tableMetadata.tags?.join(', ') || 'None'}

COLUMNS:
${tableMetadata.columns ?
    tableMetadata.columns.slice(0, 10).map((col: any) =>
        `- ${col.name} (${col.dataType || 'unknown type'}): ${col.description || 'no description'}`
    ).join('\n') : 'Column information not available'}

Please provide:
📊 **Data Summary**: Brief overview (1-2 sentences)
⚠️  **Potential Issues**: Any concerns about data quality, naming, or structure
💡 **Recommendations**: Suggestions for improvement
🔗 **Relationships**: Likely connections to other tables based on column names

Keep your response concise and practical for data engineers.
        `;

        try {
            const response = await this.sendChatRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);

            return response || '❌ AI analysis returned empty response';

        } catch (error) {
            console.error('Error calling Local LLM:', error);
            return `❌ AI analysis failed: ${error instanceof Error ? error.message : 'Network error'}`;
        }
    }

    async searchInsights(
        query: string,
        searchResults: TableResult[],
        searchTermsUsed: string[],
        wasNaturalLanguage: boolean
    ): Promise<string> {
        const systemPrompt = 'You are a helpful data catalog assistant. Provide concise, conversational responses about data tables.';

        const userPrompt = wasNaturalLanguage ? `
The user asked: "${query}"

I found ${searchResults.length} tables by searching for: ${searchTermsUsed.join(', ')}

Tables found: ${searchResults.slice(0, 5).map(r => `${r.name} - ${r.description || 'stores data'}`).join('; ')}

Respond conversationally as if answering the user's question directly. Explain what information they have based on these tables.

Format:
Based on your data catalog, you have [describe the types of information available]. The main tables are [explain key tables and what data they contain].

You might also want to explore: [2 related searches]

Be helpful and conversational - like a data assistant.
        ` : `
You're analyzing ${searchResults.length} tables found for "${query}".

Tables: ${searchResults.slice(0, 5).map(r => `${r.name} (${r.description || 'no description'})`).join('; ')}

Write a natural explanation about what these tables contain and why they're relevant. Then suggest 2 related searches.

Format:
The key tables for ${query} include [explain what each does and why it's relevant]. These tables help with [business context].

You might also want to explore: [related term 1], [related term 2]

Be informative but concise - like an AI overview.
        `;

        try {
            const response = await this.sendChatRequest([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);

            return response || (wasNaturalLanguage
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}.`
                : `Found ${searchResults.length} tables matching "${query}".`);

        } catch (error) {
            console.error('Error getting search insights from Local LLM:', error);
            return wasNaturalLanguage
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}. AI insights unavailable.`
                : `Found ${searchResults.length} tables matching "${query}". AI insights unavailable.`;
        }
    }

    async validateConnection(): Promise<boolean> {
        try {
            const response = await this.sendChatRequest([
                { role: 'user', content: 'Hello' }
            ]);

            return !!response;
        } catch (error) {
            console.error('Error validating Local LLM connection:', error);
            return false;
        }
    }

    private async sendChatRequest(messages: OpenAICompatibleMessage[]): Promise<string> {
        try {
            // Try OpenAI-compatible format first (works with Ollama, LM Studio, etc.)
            const url = this.config.endpoint.includes('/chat/completions')
                ? this.config.endpoint
                : `${this.config.endpoint}/v1/chat/completions`;

            const headers: any = { 'Content-Type': 'application/json' };
            if (this.config.apiKey) {
                headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            }

            const requestBody: any = {
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024
            };

            // Add model if specified
            if (this.config.model) {
                requestBody.model = this.config.model;
            }

            const response = await axios.post(url, requestBody, { headers, timeout: 30000 });

            // Try OpenAI-compatible response format
            if (response.data?.choices?.[0]?.message?.content) {
                return response.data.choices[0].message.content;
            }

            // Try other common response formats
            if (response.data?.response) {
                return response.data.response;
            }

            if (response.data?.text) {
                return response.data.text;
            }

            if (response.data?.output) {
                return Array.isArray(response.data.output)
                    ? response.data.output[0]?.content || ''
                    : response.data.output;
            }

            if (typeof response.data === 'string') {
                return response.data;
            }

            console.warn('Unexpected response format from Local LLM:', response.data);
            return '';

        } catch (error: any) {
            // If OpenAI-compatible format fails, try legacy format
            if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
                return await this.sendLegacyRequest(messages);
            }

            throw new Error(`Local LLM error: ${error?.message || error}`);
        }
    }

    private async sendLegacyRequest(messages: OpenAICompatibleMessage[]): Promise<string> {
        try {
            // Legacy format for simple endpoints (combine messages into single prompt)
            const prompt = messages
                .map(m => `${m.role === 'system' ? 'System: ' : m.role === 'user' ? 'User: ' : 'Assistant: '}${m.content}`)
                .join('\n\n');

            const headers: any = { 'Content-Type': 'application/json' };
            if (this.config.apiKey) {
                headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            }

            const payload: any = { prompt };
            if (this.config.model) {
                payload.model = this.config.model;
            }

            const response = await axios.post(this.config.endpoint, payload, { headers, timeout: 30000 });

            // Try various response formats
            if (response.data) {
                if (typeof response.data === 'string') return response.data;
                if (response.data.result) return response.data.result;
                if (response.data.text) return response.data.text;
                if (response.data.response) return response.data.response;
                if (response.data.output) {
                    if (Array.isArray(response.data.output) && response.data.output[0]) {
                        return response.data.output[0].content || response.data.output[0];
                    }
                    return response.data.output;
                }
            }

            return '';
        } catch (error: any) {
            throw new Error(`Local LLM legacy format error: ${error?.message || error}`);
        }
    }
}
