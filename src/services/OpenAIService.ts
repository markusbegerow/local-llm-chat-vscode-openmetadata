import { TableResult } from './OpenMetadataService';

interface OpenAIConfig {
    apiKey: string;
    model: string;
    baseUrl: string;
}

interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class OpenAIService {
    private config: OpenAIConfig;

    constructor(config: OpenAIConfig) {
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
            ], {
                temperature: 0.7,
                max_tokens: 1024
            });

            return response || '❌ AI analysis returned empty response';

        } catch (error) {
            console.error('Error calling OpenAI API:', error);
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
            ], {
                temperature: 0.7,
                max_tokens: 200
            });

            return response || (wasNaturalLanguage
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}.`
                : `Found ${searchResults.length} tables matching "${query}".`);

        } catch (error) {
            console.error('Error getting search insights:', error);
            return wasNaturalLanguage
                ? `I found ${searchResults.length} tables related to ${searchTermsUsed.join(' and ')}. AI insights unavailable.`
                : `Found ${searchResults.length} tables matching "${query}". AI insights unavailable.`;
        }
    }

    async validateApiKey(): Promise<boolean> {
        try {
            const response = await this.sendChatRequest([
                { role: 'user', content: 'Hello' }
            ], {
                max_tokens: 5
            });

            return !!response;
        } catch (error) {
            console.error('Error validating OpenAI API key:', error);
            return false;
        }
    }

    private async sendChatRequest(
        messages: OpenAIMessage[],
        options: { temperature?: number; max_tokens?: number } = {}
    ): Promise<string> {
        const url = `${this.config.baseUrl}/chat/completions`;

        const requestBody = {
            model: this.config.model,
            messages: messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 1024
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }

        const data: OpenAIResponse = await response.json();

        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
        } else {
            console.error('Unexpected OpenAI response format:', data);
            throw new Error('Unexpected response format from OpenAI');
        }
    }
}
