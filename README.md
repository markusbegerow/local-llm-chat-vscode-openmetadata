# Local LLM Chat for OpenMetadata

A VS Code extension that brings AI-powered data discovery to your IDE using **your choice** of LLM provider. Chat with your OpenMetadata catalog using OpenAI, Ollama, or any custom endpoint.

<img alt="vs-code-openmetadata" src="https://github.com/user-attachments/assets/c148a450-c985-4b5c-95fb-a48fb143bb47" />

## Key Features

- **Multiple LLM Providers**: Choose between OpenAI, Ollama, or custom OpenAI-compatible endpoints
- **Complete Privacy**: Use local models with Ollama for offline, private data analysis
- **Flexible Configuration**: Switch between providers without code changes
- **Natural Language Search**: Ask questions like "show me customer tables" or search by keywords
- **AI-Powered Insights**: Get intelligent analysis of your datasets and data quality
- **Interactive Data Lineage**: Visualize upstream and downstream table relationships
- **Column Details**: Explore table schemas with expandable column information

## Requirements

1. **OpenMetadata Server**: Running locally at http://localhost:8585
   - Use the [OpenMetadata Docker setup](https://docs.open-metadata.org/latest/quick-start/local-docker-deployment)
   - Load sample data for testing

2. **LLM Provider** (choose one):
   - **OpenAI**: Get an API key from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Ollama**: Install [Ollama](https://ollama.ai/) and pull a model (e.g., `ollama pull llama2`)
   - **Custom**: Any OpenAI-compatible API endpoint

## Installation & Setup

### Option 1: Build from Source

**1. Clone and Install**
```bash
cd /path/to/your/workspace
git clone <your-repo-url> local-llm-chat-vscode-openmetadata
cd local-llm-chat-vscode-openmetadata
npm install
```

**2. Configure Your LLM Provider**

Open VS Code settings (`Ctrl+,` or `Cmd+,`) and configure your preferred provider:

#### For OpenAI:
```json
{
  "openmetadataExplorer.llm.provider": "openai",
  "openmetadataExplorer.llm.openai.apiKey": "sk-your-api-key-here",
  "openmetadataExplorer.llm.openai.model": "gpt-4o",
  "openmetadataExplorer.openmetadataUrl": "http://localhost:8585",
  "openmetadataExplorer.openmetadataAuthToken": "YOUR_BOT_TOKEN"
}
```

#### For Ollama:
```json
{
  "openmetadataExplorer.llm.provider": "ollama",
  "openmetadataExplorer.llm.ollama.endpoint": "http://localhost:11434",
  "openmetadataExplorer.llm.ollama.model": "llama2",
  "openmetadataExplorer.openmetadataUrl": "http://localhost:8585",
  "openmetadataExplorer.openmetadataAuthToken": "YOUR_BOT_TOKEN"
}
```

#### For Custom Endpoint (e.g., LM Studio, LocalAI):
```json
{
  "openmetadataExplorer.llm.provider": "custom",
  "openmetadataExplorer.llm.custom.endpoint": "http://localhost:1234/v1",
  "openmetadataExplorer.llm.custom.apiKey": "optional-api-key",
  "openmetadataExplorer.llm.custom.model": "model-name",
  "openmetadataExplorer.openmetadataUrl": "http://localhost:8585",
  "openmetadataExplorer.openmetadataAuthToken": "YOUR_BOT_TOKEN"
}
```

**3. Get OpenMetadata Bot Token**
1. Open http://localhost:8585 and login (default: admin/admin)
2. Go to **Settings** → **Bots**
3. Click **Add Bot** with these details:
   - Name: `vscode-llm-bot`
   - Description: `Bot for VS Code LLM extension`
4. Click **Generate Token** and copy the JWT token (starts with `eyJ`)
5. Assign **Data Consumer** role to the bot

**4. Run in Debug Mode**
1. Press `F5` to launch the extension in a new VS Code window
2. Look for **OPEN METADATA** panel at the bottom
3. Verify connection and start searching

### Option 2: Package and Install

**1. Build the Extension**
```bash
npm run compile
npm run package
```

**2. Install the VSIX**
- Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
- Type: `Extensions: Install from VSIX...`
- Select the generated `.vsix` file
- Reload when prompted

**3. Configure as shown in Option 1, step 2**

## How to Use

### Search Your Data
- **Keyword Search**: Type table names like "customer" or "orders"
- **Natural Language**: Ask questions like "show me customer data"
- **Browse Results**: Click on tables to see column details and AI insights

### View Data Lineage
1. Search for any table
2. Click **View Lineage** on the table card
3. Use the interactive graph:
   - Click **+** buttons to expand upstream/downstream relationships
   - Click **-** buttons to collapse connections
   - Drag nodes to reposition them
   - Zoom with mouse wheel

### Example Searches
- `customer` - Find customer-related tables
- `orders` - Discover transaction data
- `sales` - Locate revenue tables
- `product` - Find catalog information

## LLM Provider Comparison

| Feature | OpenAI | Ollama | Custom |
|---------|---------|---------|---------|
| **Speed** | Fast (cloud) | Medium-Fast (local) | Varies |
| **Privacy** | Cloud-based | 100% Local | Depends |
| **Cost** | Pay-per-use | Free | Varies |
| **Setup** | API key only | Install + model | Varies |
| **Offline** | ❌ No | ✅ Yes | Depends |
| **Quality** | Excellent | Good | Varies |

### Recommended Models

**OpenAI:**
- `gpt-4o` - Best quality, faster than GPT-4
- `gpt-4` - High quality, slower
- `gpt-3.5-turbo` - Fast and cheap
- `o1-preview` - Advanced reasoning
- `o1-mini` - Cost-effective reasoning

**Ollama:**
- `llama2` - General purpose, 7B parameters
- `mistral` - Fast and capable
- `codellama` - Optimized for code/data
- `llama3` - Latest Llama model

**Custom:**
- Any OpenAI-compatible API endpoint works
- Examples: LM Studio, LocalAI, vLLM, Text Generation WebUI

## Development

### Build Commands
```bash
# Development build with watch
npm run watch

# Production build
npm run compile

# Package for distribution
npm run package
```

### Project Structure
```
src/
├── extension.ts                 # Extension entry point
├── OpenMetadataExplorerProvider.ts  # Main provider
├── services/
│   ├── OpenAIService.ts        # OpenAI integration
│   ├── LocalLLMService.ts      # Ollama/Custom integration
│   ├── UnifiedLLMService.ts    # LLM orchestrator
│   ├── OpenMetadataService.ts  # OpenMetadata API
│   └── LineageService.ts       # Data lineage
└── webview/
    ├── App.tsx                  # Main React app
    └── components/              # React components
```

### Key Service Files

**UnifiedLLMService.ts**
- Orchestrates between OpenAI, Ollama, and custom endpoints
- Handles provider selection and initialization
- Provides unified interface for all LLM operations

**OpenAIService.ts**
- Direct integration with OpenAI API
- Supports chat completions format
- Handles API key validation

**LocalLLMService.ts**
- OpenAI-compatible format for Ollama
- Fallback to legacy formats for compatibility
- Flexible response parsing

## Configuration Reference

### OpenMetadata Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `openmetadataExplorer.openmetadataUrl` | OpenMetadata server URL | `http://localhost:8585` |
| `openmetadataExplorer.openmetadataAuthToken` | OpenMetadata bot JWT token | (empty) |

### LLM Provider Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `openmetadataExplorer.llm.provider` | LLM provider (openai/ollama/custom) | `openai` |

### OpenAI Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `openmetadataExplorer.llm.openai.apiKey` | OpenAI API key | (empty) |
| `openmetadataExplorer.llm.openai.model` | OpenAI model name | `gpt-4o` |
| `openmetadataExplorer.llm.openai.baseUrl` | OpenAI API base URL | `https://api.openai.com/v1` |

### Ollama Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `openmetadataExplorer.llm.ollama.endpoint` | Ollama API endpoint | `http://localhost:11434` |
| `openmetadataExplorer.llm.ollama.model` | Ollama model name | `llama2` |

### Custom Endpoint Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `openmetadataExplorer.llm.custom.endpoint` | Custom API endpoint | (empty) |
| `openmetadataExplorer.llm.custom.apiKey` | Custom API key (if required) | (empty) |
| `openmetadataExplorer.llm.custom.model` | Custom model name | (empty) |

## Troubleshooting

### OpenAI Issues
- **"API key invalid"**: Check your API key at platform.openai.com
- **"Rate limit exceeded"**: Wait a moment or upgrade your OpenAI plan
- **"Model not found"**: Verify the model name (gpt-4o, gpt-4, etc.)

### Ollama Issues
- **"Connection refused"**: Make sure Ollama is running (`ollama serve`)
- **"Model not found"**: Pull the model first (`ollama pull llama2`)
- **Slow responses**: Use a smaller model or upgrade your hardware

### OpenMetadata Issues
- **"Connection failed"**: Verify OpenMetadata is running at the configured URL
- **"Authentication failed"**: Check your bot token is valid and not expired
- **"No tables found"**: Ensure sample data is loaded in OpenMetadata

## Current Status

**Version 1.0.0** - Initial Release
- OpenAI, Ollama, and custom endpoint support
- Natural language search with AI insights
- Interactive data lineage visualization
- Professional UI optimized for developers

**Planned Features**
- Column-level lineage relationships
- Data quality monitoring integration
- Advanced search filters and exports
- Streaming responses for better UX
- Multi-turn conversations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Ollama team for making local LLMs accessible
- LM Studio for providing an excellent local inference platform
- The VS Code extension API team for comprehensive documentation

## 🙋‍♂️ Get Involved

If you encounter any issues or have questions:
- 🐛 [Report bugs](https://github.com/markusbegerow/local-llm-chat-vscode-openmetadata/issues)
- 💡 [Request features](https://github.com/markusbegerow/local-llm-chat-vscode-openmetadata/issues)
- ⭐ Star the repo if you find it useful!

## ☕ Support the Project

If you like this project, support further development with a repost or coffee:

<a href="https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/markusbegerow/local-llm-chat-vscode-openmetadata" target="_blank"> <img src="https://img.shields.io/badge/💼-Share%20on%20LinkedIn-blue" /> </a>

[![Buy Me a Coffee](https://img.shields.io/badge/☕-Buy%20me%20a%20coffee-yellow)](https://paypal.me/MarkusBegerow?country.x=DE&locale.x=de_DE)

## 📬 Contact

- 🧑‍💻 [Markus Begerow](https://linkedin.com/in/markusbegerow)
- 💾 [GitHub](https://github.com/markusbegerow)
- ✉️ [Twitter](https://x.com/markusbegerow)

---

**Privacy Notice**: This extension operates entirely locally. No data is sent to external servers unless you explicitly configure it to use a remote API endpoint.



