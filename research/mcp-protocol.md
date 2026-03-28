# Model Context Protocol (MCP): Architecture & Ecosystem

> Research compiled March 2026. Sources: Wikipedia, Anthropic blog, modelcontextprotocol.io specification, OpenCV blog, The New Stack.

---

## Overview

**Model Context Protocol (MCP)** is an open standard and open-source framework introduced by **Anthropic** on **November 25, 2024**, designed to standardize how AI systems integrate with external tools, data sources, and services.

MCP addresses a fundamental problem in AI development: before MCP, every AI application required custom connectors for every data source it needed. This created an "N×M" integration problem — N models × M data sources = exponential integration complexity.

MCP solves this by providing a universal interface:
- **Build one server**: expose any data source or tool as an MCP server
- **Connect to any client**: every MCP-compatible AI (Claude, Cursor, Cline, Windsurf, VS Code Copilot) can use it

In December 2025, Anthropic donated MCP to the **Agentic AI Foundation (AAIF)**, a directed fund under the **Linux Foundation**, co-founded by Anthropic, Block, and OpenAI.

---

## Problem MCP Solves

### Before MCP: The N×M Problem

```
AI Tool A ──── Custom connector ──── Data Source 1
AI Tool A ──── Custom connector ──── Data Source 2
AI Tool A ──── Custom connector ──── Data Source 3
AI Tool B ──── Custom connector ──── Data Source 1
AI Tool B ──── Custom connector ──── Data Source 2
...
```

Each (AI Tool, Data Source) pair required a bespoke integration. With N tools and M sources, you needed N×M connectors.

### After MCP: N+M

```
AI Tool A ──── MCP Client ────┐
AI Tool B ──── MCP Client ────┤──── MCP Protocol ──── MCP Server 1 (Database)
AI Tool C ──── MCP Client ────┘                  ├─── MCP Server 2 (Git)
                                                  └─── MCP Server 3 (Slack)
```

Now you build N clients and M servers, connected by the protocol. Any client works with any server.

---

## Architecture

### Component Roles

**MCP Host** (e.g., Claude Desktop, Claude Code, Cursor):
- The AI application where users interact
- Contains the LLM and manages user sessions
- Spawns and connects to MCP clients

**MCP Client**:
- Lives inside the host application
- Maintains one-to-one connections with servers
- Translates between the host's needs and the protocol

**MCP Server**:
- External process or service
- Exposes capabilities: tools, resources, prompts
- Can be local (process on same machine) or remote (HTTP endpoint)

### Protocol Stack

```
┌─────────────────────────────────┐
│         Application Layer       │
│  (Host: Claude Code, Cursor...) │
├─────────────────────────────────┤
│          MCP Client Layer       │
│  (Tool invocation, resource     │
│   fetching, prompt loading)     │
├─────────────────────────────────┤
│          Protocol Layer         │
│  JSON-RPC 2.0 messages          │
│  Capability negotiation         │
│  Lifecycle management           │
├─────────────────────────────────┤
│          Transport Layer        │
│  stdio (local) or HTTP+SSE      │
│  (remote) or Streamable HTTP    │
└─────────────────────────────────┘
```

---

## The Three Primitives

MCP servers expose three types of capabilities:

### 1. Tools (Actions)

Tools are **functions the AI can call** to take actions or fetch computed results.

```json
{
  "name": "read_file",
  "description": "Read the contents of a file at the given path",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Absolute or relative path to the file"
      }
    },
    "required": ["path"]
  }
}
```

The LLM sees the tool definition in its context and can choose to call it. The MCP framework handles the invocation, passes arguments to the server, and returns the result.

**Examples of tools**:
- `bash_execute`: Run a shell command
- `file_read` / `file_write`: Read or write files
- `github_create_pr`: Create a GitHub pull request
- `search_web`: Search the web
- `run_tests`: Execute test suite
- `database_query`: Run SQL query

### 2. Resources (Data)

Resources are **data sources the AI can read**. They are identified by URIs and can be:
- Files: `file:///path/to/file.txt`
- Database rows: `postgres://db/table/row_id`
- API responses: `https://api.example.com/data`
- Git content: `git://repo/file@branch`

```json
{
  "uri": "file:///Users/dev/project/README.md",
  "name": "Project README",
  "mimeType": "text/markdown",
  "description": "Main project documentation"
}
```

Resources provide **read-only context** — the AI can request them to populate its context window without taking actions.

### 3. Prompts (Templates)

Prompts are **reusable interaction templates** that server operators define. They let servers expose workflow-specific prompt patterns.

```json
{
  "name": "code_review",
  "description": "Standard code review prompt for Python PRs",
  "arguments": [
    {
      "name": "diff",
      "description": "The git diff to review",
      "required": true
    }
  ]
}
```

Prompts help standardize common agentic workflows across different hosts.

---

## Transport Layer

MCP defines two standard transports:

### stdio (Local)

- Communication over standard input/output streams
- Used for local MCP servers (processes on the same machine)
- The host spawns the server as a child process
- Messages flow over stdin/stdout as newline-delimited JSON-RPC

```bash
# Example: starting a local MCP server
$ mcp-server-filesystem --root /Users/dev/projects
```

**Ideal for**:
- File system access
- Local database connections
- CLI tools
- Development/debugging

### HTTP + SSE (Remote, legacy)

- Server-Sent Events for server→client streaming
- HTTP POST for client→server requests
- Two endpoints: `GET /mcp` for SSE stream, `POST /messages` for requests

### Streamable HTTP (Remote, 2025)

Introduced in March 2025, Streamable HTTP replaced HTTP+SSE as the preferred remote transport:
- Single endpoint handles both directions
- More compatible with standard HTTP infrastructure
- Deployable to Cloudflare Workers, Vercel Edge, etc.

---

## Protocol Details

### Message Format

All MCP messages are **JSON-RPC 2.0**:

```json
// Request (client → server)
{
  "jsonrpc": "2.0",
  "id": "req_001",
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/src/main.py"
    }
  }
}

// Response (server → client)
{
  "jsonrpc": "2.0",
  "id": "req_001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "import os\nimport sys\n..."
      }
    ]
  }
}
```

### Lifecycle

1. **Initialization**: Client sends `initialize` with capabilities; server responds with its capabilities
2. **Capability negotiation**: Both sides declare what they support
3. **Active session**: Tools, resources, prompts exchanged as needed
4. **Termination**: Clean shutdown via `notifications/cancelled` or connection close

### Capability Negotiation

```json
// Client initialization
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {}
    },
    "clientInfo": {
      "name": "ClaudeCode",
      "version": "1.0.0"
    }
  }
}
```

---

## Adoption by Agentic Coding Tools

### Claude Code (Anthropic)
- MCP is native to Claude Code
- Users add MCP servers via `~/.claude/mcp.json`
- First-class tool invocation through MCP
- Anthropic maintains reference server implementations

### Cline (VS Code Extension)
- One of the first IDE extensions with full MCP support
- Users configure MCP servers in Cline's settings panel
- Each server's tools appear as available actions
- Enabled power users to extend Cline with custom tools

### Cursor
- Added MCP support in 2025
- Configured via `.cursorrules` or settings
- Used primarily for custom tool integrations

### Windsurf (Codeium/Cognition)
- MCP support in Cascade agent
- Project-level MCP configuration

### GitHub Copilot
- MCP support added (with noted reliability issues — server restarts every 5-10 min in some versions)

### Claude Desktop
- Original MCP client reference implementation
- stdio transport only initially

---

## Server Ecosystem

### Growth

- **November 2024**: Protocol announced with Anthropic's reference implementations
- **February 2025**: Over 1,000 open-source MCP servers existed
- **March 2025**: OpenAI adopted MCP across ChatGPT desktop and APIs
- **April 2025**: Google DeepMind adopted MCP
- **December 2025**: MCP donated to Linux Foundation AAIF
- **March 2026**: Thousands of community MCP servers across multiple registries

### Popular Community MCP Servers

| Category | Examples |
|----------|---------|
| File system | filesystem, git, SQLite |
| Web search | Brave Search, Google, Perplexity |
| Code execution | Python runner, bash executor, Docker |
| Version control | GitHub, GitLab, Bitbucket |
| Databases | Postgres, MySQL, MongoDB, Redis |
| Cloud | AWS, GCP, Azure, Cloudflare |
| Communication | Slack, Discord, email |
| Browser | Puppeteer, Playwright, browser automation |
| Knowledge | Notion, Obsidian, Confluence |
| Monitoring | Datadog, Grafana, PagerDuty |

### Reference Servers (Official)

Anthropic maintains official reference implementations at `github.com/modelcontextprotocol/servers`:
- **filesystem**: Secure file operations
- **github**: GitHub API integration
- **google-drive**: Google Drive access
- **postgres**: PostgreSQL queries
- **slack**: Slack messaging
- **sequential-thinking**: Structured reasoning prompts
- **brave-search**: Web search
- **memory**: Persistent memory storage

---

## SDK Support

Official SDKs are available for:

| Language | Status |
|----------|--------|
| Python | ✅ Official |
| TypeScript/Node.js | ✅ Official |
| Java | ✅ Official |
| Kotlin | ✅ Official |
| C# / .NET | ✅ Official |
| Go | ✅ Official |
| PHP | ✅ Community |
| Perl | ✅ Community |
| Ruby | ✅ Community |
| Rust | ✅ Community |
| Swift | ✅ Community |

---

## Building an MCP Server

### Python Example (minimal)

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

server = Server("my-coding-tools")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="run_tests",
            description="Run the test suite",
            inputSchema={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Test path"}
                }
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "run_tests":
        # Execute tests
        result = subprocess.run(
            ["pytest", arguments.get("path", "."), "-v"],
            capture_output=True, text=True
        )
        return [TextContent(type="text", text=result.stdout)]

if __name__ == "__main__":
    import asyncio
    asyncio.run(stdio_server(server))
```

---

## Security Considerations

Security researchers identified several MCP vulnerabilities (April 2025):

1. **Prompt injection**: Malicious server responses can inject instructions into the LLM context
2. **Tool permission escalation**: Combining tools to achieve unauthorized actions
3. **Lookalike tools**: Malicious servers can define tools with names similar to trusted ones
4. **Data exfiltration**: Improperly scoped tools can leak data across sessions

**Mitigations**:
- Capability-based permission scoping
- Tool approval prompts in clients
- Server allowlists
- Sandbox isolation for server processes

---

## Why MCP Won

From a December 2025 analysis (The New Stack, "Why the Model Context Protocol Won"):

1. **Timing**: Launched at the exact moment the ecosystem needed standardization
2. **Simplicity**: JSON-RPC 2.0 is well-understood; no new concepts required
3. **Vendor adoption**: OpenAI and Google adopting it created the "everyone uses it" flywheel
4. **Anthropic's credibility**: Claude's brand made developers trust it as neutral infrastructure
5. **LSP analogy**: Developers already understood Language Server Protocol; MCP felt familiar
6. **Open governance**: Donation to Linux Foundation AAIF removed single-vendor concern

---

## MCP vs. Alternatives

| Approach | MCP | OpenAI Function Calling | LangChain Tools | OpenAPI |
|----------|-----|------------------------|-----------------|---------|
| Standard | Open | Proprietary (OpenAI) | Library-specific | Open |
| Transport | stdio/HTTP | HTTP only | Library-specific | HTTP |
| Bidirectional | ✅ | ❌ | Partial | ❌ |
| Server reuse | ✅ Any client | ❌ OpenAI only | ❌ LangChain only | ❌ Client-specific |
| Streaming | ✅ | Partial | Partial | Via extension |
| IDE adoption | Very high | Medium | Low | Medium |

---

## Sources

1. Anthropic — "Introducing the Model Context Protocol": https://www.anthropic.com/news/model-context-protocol
2. Wikipedia — Model Context Protocol: https://en.wikipedia.org/wiki/Model_Context_Protocol
3. MCP Specification: https://modelcontextprotocol.io/specification/2025-11-25
4. MCP Architecture: https://modelcontextprotocol.io/docs/learn/architecture
5. MCP Transports: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
6. The New Stack — "Why the Model Context Protocol Won" (Dec 2025): https://thenewstack.io/why-the-model-context-protocol-won/
7. OpenCV Blog — "A Beginners Guide on Model Context Protocol": https://opencv.org/blog/model-context-protocol/
8. Stytch — "Model Context Protocol: A comprehensive introduction": https://stytch.com/blog/model-context-protocol-introduction/
9. Firecrawl — "10 Best MCP Servers for Developers in 2026": https://www.firecrawl.dev/blog/best-mcp-servers-for-developers
