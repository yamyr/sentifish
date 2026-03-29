# Model Context Protocol (MCP): Deep Research

> Comprehensive analysis of the MCP specification, transport mechanisms, primitives, harness integrations, ecosystem growth, and comparison with Google's A2A protocol.
> Last updated: March 2026

---

## Table of Contents

1. [Overview & Origin](#overview--origin)
2. [The Core Insight: USB-C for AI](#the-core-insight-usb-c-for-ai)
3. [Architecture: Hosts, Clients, Servers](#architecture-hosts-clients-servers)
4. [Data Layer: Primitives](#data-layer-primitives)
   - Resources
   - Tools
   - Prompts
   - Sampling
   - Roots
   - Elicitation
5. [Transport Layer](#transport-layer)
   - STDIO
   - Streamable HTTP
   - SSE (legacy)
6. [JSON-RPC 2.0 Message Protocol](#json-rpc-20-message-protocol)
7. [Lifecycle: Initialization & Capability Negotiation](#lifecycle-initialization--capability-negotiation)
8. [Security Model](#security-model)
9. [How Harnesses Integrate MCP](#how-harnesses-integrate-mcp)
   - Claude Code
   - Cline
   - VS Code Copilot
   - Cursor
   - Continue.dev
10. [Official Reference Servers](#official-reference-servers)
11. [Ecosystem Growth](#ecosystem-growth)
12. [Building an MCP Server: Example](#building-an-mcp-server-example)
13. [MCP vs A2A Protocol](#mcp-vs-a2a-protocol)
14. [Future Direction](#future-direction)
15. [Sources](#sources)

---

## Overview & Origin

**Model Context Protocol (MCP)** is an open-source protocol developed by Anthropic and announced in November 2024. It provides a **universal, standardized way for AI applications to connect to external data sources and tools**.

### The problem MCP solves

Before MCP, every AI application (Claude, ChatGPT, Copilot, Cursor, etc.) had to build custom integrations for every data source or tool it needed to connect to:

```
Before MCP:
Claude ──── custom code ──── GitHub
Claude ──── custom code ──── Postgres
Claude ──── custom code ──── Slack
ChatGPT ─── custom code ──── GitHub
ChatGPT ─── custom code ──── Postgres
Cursor ──── custom code ──── GitHub
...
(N apps × M tools = N×M integrations)
```

With MCP:

```
After MCP:
Claude ────┐
ChatGPT ───┤── MCP Client ──── GitHub MCP Server
Cursor ────┤── MCP Client ──── Postgres MCP Server
Copilot ───┤── MCP Client ──── Slack MCP Server
...
(N apps × 1 protocol + M servers = N+M total implementations)
```

MCP eliminates the N×M integration problem by creating a shared protocol that any AI client can speak and any data source can implement.

### Early adopters (launch, Nov 2024)

At launch, Anthropic announced partnerships with:
- **Block** (Square) — "open technologies like MCP are the bridges that connect AI to real-world applications"
- **Apollo** — integrated MCP into their systems
- **Zed** (code editor)
- **Replit**
- **Codeium**
- **Sourcegraph**

---

## The Core Insight: USB-C for AI

The official documentation describes MCP as **"USB-C for AI applications"**:

> "Just as USB-C provides a standardized way to connect electronic devices, MCP provides a standardized way to connect AI applications to external systems."

### What this means in practice

- Any MCP-compliant client can use any MCP server
- Servers describe their capabilities at runtime via capability negotiation
- New tools are available to all agents instantly when a new MCP server is published
- No per-agent custom code for standard integrations

### Who benefits

| Role | Benefit |
|------|---------|
| Developers | Reduce development time building AI integrations |
| AI applications | Access an ecosystem of pre-built tools and data sources |
| Tool builders | Build once, work with all MCP-compatible AI apps |
| End users | More capable AI that can access their actual data |

---

## Architecture: Hosts, Clients, Servers

MCP follows a strict **client-server architecture** with three participant types:

### MCP Host

The AI application that:
- Orchestrates connections to MCP servers
- Creates and manages MCP clients
- Contains the LLM that uses the provided context
- Enforces user consent for data access and tool execution

**Examples**: Claude Desktop, Claude Code, VS Code (Copilot), Cursor, Cline

### MCP Client

A component within the host that:
- Maintains a **dedicated, one-to-one connection** to a single MCP server
- Handles low-level protocol messaging
- Discovers server capabilities at runtime
- Mediates between the host/LLM and the server

**Key rule**: One client per server. The host creates multiple clients to connect to multiple servers in parallel.

### MCP Server

A program that:
- Exposes capabilities (tools, resources, prompts)
- Processes client requests and returns results
- Can serve a single client (STDIO) or many clients (Streamable HTTP)
- Runs locally or remotely

```
MCP Host (e.g., VS Code)
├── MCP Client 1 ─── STDIO ──► GitHub MCP Server (local process)
├── MCP Client 2 ─── STDIO ──► Filesystem MCP Server (local process)
├── MCP Client 3 ─── HTTP  ──► Sentry MCP Server (remote)
└── MCP Client 4 ─── HTTP  ──► Sentry MCP Server (same remote, different client)
```

Note: Multiple clients can connect to the same remote server (which serves many clients via HTTP). Local STDIO servers typically serve only one client.

---

## Data Layer: Primitives

The data layer defines the **six core primitives** of MCP:

### 1. Resources (Server → Client, application-controlled)

Resources are **read-only data** that an MCP server exposes for LLM context. They are like files or database records that can be fetched by URI.

- Each resource has a **unique URI** (e.g., `file://reports/q4.pdf`, `database://users/schema`)
- Resources are **application-controlled**: the host decides when and how to fetch them
- The LLM does not directly call resources; the host fetches them and injects into context

**Example resource definition**:
```json
{
  "uri": "database://sales/weekly_summary",
  "name": "Weekly Sales Summary",
  "description": "Aggregated sales data for the current week",
  "mimeType": "application/json"
}
```

**Use cases**:
- Database schemas
- File contents
- API documentation
- Recent log files
- Business metrics dashboards

### 2. Tools (Server → Client → LLM-controlled)

Tools are **executable functions** that the LLM can invoke. They represent actions that have side effects or require computation.

- Each tool has a **name**, **description**, and **JSON Schema** for parameters
- Tools are **model-controlled**: the LLM decides when to call them
- Results are returned to the LLM to continue reasoning

**Example tool definition**:
```json
{
  "name": "create_jira_ticket",
  "description": "Create a new Jira ticket in the specified project",
  "inputSchema": {
    "type": "object",
    "properties": {
      "project": {
        "type": "string",
        "description": "Jira project key (e.g., PROJ)"
      },
      "summary": {
        "type": "string",
        "description": "Brief title for the ticket"
      },
      "description": {
        "type": "string",
        "description": "Detailed description"
      },
      "priority": {
        "type": "string",
        "enum": ["Low", "Medium", "High", "Critical"]
      }
    },
    "required": ["project", "summary"]
  }
}
```

**The LLM calls it like this** (internal to the protocol):
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_jira_ticket",
    "arguments": {
      "project": "PROJ",
      "summary": "Fix authentication bug in login flow",
      "priority": "High"
    }
  }
}
```

### 3. Prompts (Server → Client, user-controlled)

Prompts are **reusable prompt templates** or workflows exposed by the server.

- Pre-built prompts for common tasks with the server's domain
- Can be parameterized with arguments
- Invoked by the user, not the LLM autonomously

**Example prompt**:
```json
{
  "name": "generate-pr-description",
  "description": "Generate a comprehensive PR description from git diff",
  "arguments": [
    {
      "name": "diff",
      "description": "The git diff to summarize",
      "required": true
    },
    {
      "name": "style",
      "description": "PR description style (detailed/concise)",
      "required": false
    }
  ]
}
```

**Comparison of primitives**:

| Primitive | Who controls it | Has side effects | Example |
|-----------|----------------|-----------------|---------|
| Resources | Application (host) | No (read-only) | DB schema, file content |
| Tools | LLM (model) | Yes | Create issue, send email |
| Prompts | User | No (template) | Summarize PR, explain code |

### 4. Sampling (Client → Server, LLM calls)

Sampling is a **server-initiated feature** where the server can request the host's LLM to generate text.

This is the inverse of the normal flow — instead of the host calling the server, the server calls back to the host's LLM:

```
Normal flow: Host ──► Server (server does work)
Sampling:    Server ──► Host LLM (server requests AI generation)
```

**Use cases**:
- An agentic MCP server that needs to delegate sub-tasks to the LLM
- Recursive/nested agentic behaviors
- Servers that orchestrate multi-step workflows using the host's LLM

**Security note**: Users must explicitly approve sampling requests. The protocol limits server visibility into prompts for privacy.

### 5. Roots

Roots tell the server what **filesystem boundaries** it should operate within.

- The client can send a list of root URIs to the server
- Servers use this to know which directories they're allowed to access
- Essential for filesystem servers to respect project boundaries

### 6. Elicitation

Elicitation allows a server to **request additional information from the user** at runtime.

- Server sends an elicitation request with a form/question
- Host displays this to the user
- User's response is returned to the server
- Enables interactive server behaviors without pre-specifying all inputs

---

## Transport Layer

MCP supports two transport mechanisms:

### STDIO Transport (Local, recommended for local servers)

**How it works**:
- The MCP host launches the MCP server as a **child process**
- Communication happens over **standard input/output streams** (`stdin`/`stdout`)
- Messages are newline-delimited JSON
- The server's `stderr` can be used for logging (doesn't affect protocol)

**Advantages**:
- No network overhead — local process communication
- No port conflicts
- Simple process lifecycle management
- Automatic cleanup when parent dies

**Disadvantages**:
- Only works locally (same machine)
- One client per server instance

**Configuration example** (Claude Code):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**What happens**: Claude Code spawns `npx @modelcontextprotocol/server-github` as a subprocess and communicates via stdin/stdout.

### Streamable HTTP Transport (Remote, recommended for remote servers)

The modern remote transport (replacing the legacy SSE transport):

**How it works**:
- Client sends requests via **HTTP POST** to the server's endpoint
- Server responds with either:
  - A direct JSON response (for simple operations)
  - An **SSE stream** (for streaming responses or server-initiated messages)
- The server can also **initiate messages** to the client via the SSE channel

**Protocol flow**:
```
Client → POST /mcp (request)
Server → 200 OK with JSON (simple response)
  OR
Server → 200 OK with text/event-stream (SSE for streaming)
Server → SSE events (tool call results, progress updates)
```

**Advantages**:
- Works over the internet
- One server serves many clients
- Supports streaming responses
- Server can push notifications to client
- Standard web infrastructure (load balancing, etc.)

**Configuration example** (remote server):
```json
{
  "mcpServers": {
    "sentry": {
      "url": "https://mcp.sentry.io/mcp",
      "headers": {
        "Authorization": "Bearer ${SENTRY_TOKEN}"
      }
    }
  }
}
```

### Legacy SSE Transport (deprecated)

The original remote transport used HTTP GET for the SSE stream and HTTP POST for client messages. Still supported but **Streamable HTTP is recommended** for new implementations as it's simpler and more efficient.

---

## JSON-RPC 2.0 Message Protocol

All MCP communication uses **JSON-RPC 2.0** messages. There are three message types:

### 1. Request (expects response)

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "tools/list",
  "params": {}
}
```

### 2. Response (reply to request)

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "result": {
    "tools": [
      {
        "name": "search_github",
        "description": "Search GitHub repositories and issues"
      }
    ]
  }
}
```

### Error response

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": { "method": "tools/unknown" }
  }
}
```

### 3. Notification (no response expected, no `id` field)

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed",
  "params": {}
}
```

### Complete method reference

**Client → Server requests**:

| Method | Purpose |
|--------|---------|
| `initialize` | Establish connection and negotiate capabilities |
| `ping` | Health check |
| `tools/list` | Discover available tools |
| `tools/call` | Execute a tool |
| `resources/list` | Discover available resources |
| `resources/read` | Read resource content |
| `resources/subscribe` | Subscribe to resource updates |
| `resources/unsubscribe` | Cancel subscription |
| `resources/templates/list` | List resource templates |
| `prompts/list` | Discover available prompts |
| `prompts/get` | Get prompt details |
| `logging/setLevel` | Configure logging verbosity |
| `roots/list` | List filesystem roots |

**Server → Client requests**:

| Method | Purpose |
|--------|---------|
| `ping` | Server-initiated health check |
| `sampling/createMessage` | Request LLM generation from the host |
| `elicitation/create` | Request user input |
| `completion/complete` | Request text completion |

**Notifications (both directions)**:

| Method | Direction | Purpose |
|--------|-----------|---------|
| `notifications/initialized` | Client → Server | Confirm init complete |
| `notifications/cancelled` | Both | Cancel in-progress operation |
| `notifications/progress` | Both | Report operation progress |
| `notifications/resources/updated` | Server → Client | Resource content changed |
| `notifications/tools/list_changed` | Server → Client | Tools list updated |
| `notifications/prompts/list_changed` | Server → Client | Prompts list updated |
| `notifications/message` | Server → Client | Log output |

---

## Lifecycle: Initialization & Capability Negotiation

### Connection lifecycle

```
1. Host spawns server (STDIO) or connects to server URL (HTTP)
2. Client sends initialize request
3. Server responds with its capabilities
4. Client sends initialized notification
5. Normal message exchange begins
6. Either party can send ping for health checks
7. Connection terminates (server closes or host disconnects)
```

### Capability negotiation example

**Client sends** (announcing what it can handle):
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "clientInfo": {
      "name": "Claude Code",
      "version": "1.0.0"
    },
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {}
    }
  }
}
```

**Server responds** (announcing what it provides):
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "protocolVersion": "2025-11-25",
    "serverInfo": {
      "name": "GitHub MCP Server",
      "version": "2.0.0"
    },
    "capabilities": {
      "tools": {},
      "resources": {
        "subscribe": true,
        "listChanged": true
      }
    }
  }
}
```

Both parties **only use mutually supported features**. If the server doesn't support `sampling`, the host won't try to request sampling. This graceful degradation prevents runtime errors.

---

## Security Model

MCP's security model centers on **user consent and control**:

### Key principles (from the spec)

1. **User Consent**: Users must explicitly consent to all data access and operations
2. **Data Privacy**: Hosts must not transmit resource data without user consent
3. **Tool Safety**: Tools represent arbitrary code execution — hosts must get user consent before invoking any tool
4. **LLM Sampling Controls**: Users must explicitly approve sampling requests; users control what prompt is sent and what results the server can see

### Implementation guidelines

The spec requires implementors to:
- Build robust consent and authorization flows
- Implement appropriate access controls
- Follow security best practices
- Document security implications clearly

### Practical security considerations

For STDIO servers:
- Credentials go in environment variables (not command args or code)
- Use `.gitignore` to protect env files
- 73% of secret leaks in open-source come from unprotected config files (GitGuardian)

For remote/HTTP servers:
- Use OAuth 2.1 for authentication
- The MCP spec explicitly references OAuth for remote server auth
- Auth0, Google, and other identity providers offer MCP server authentication tools

---

## How Harnesses Integrate MCP

### Claude Code

Claude Code was built with MCP first-class:

```bash
# Add a GitHub MCP server
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# Or configure in .mcp.json
echo '{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}' > .mcp.json
```

Claude Code uses STDIO transport for all local servers. With MCP:
- Claude Code can create entire apps using Figma designs (Figma MCP)
- Can query internal databases directly
- Can interact with GitHub PRs and issues
- Supports custom hooks system that works alongside MCP

### Cline

Cline has the most sophisticated MCP integration of any VS Code extension:

```json
{
  "cline.mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}
```

**Unique Cline MCP feature**: Cline can **build MCP servers itself**:
> "Just ask Cline to 'add a tool' and he will handle everything, from creating a new MCP server to installing it into the extension."

This means Cline can self-extend its capabilities on demand — describe what you need in plain English, and Cline writes, installs, and configures a new MCP server.

Cline also has an **MCP Marketplace** built into the extension with community-maintained servers.

### VS Code Copilot

GitHub Copilot added MCP support in 2025:

```json
// settings.json
{
  "mcp": {
    "servers": {
      "sentry": {
        "url": "https://mcp.sentry.io/mcp"
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"]
      }
    }
  }
}
```

MCP servers are available in agent mode. Copilot can use MCP to:
- Integrate with Jira, Slack, Teams, Linear, Azure Boards
- Access databases and internal tools
- The coding agent docs explicitly mention MCP as a key extension mechanism

### Cursor

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

The Cursor agent can use MCP tools alongside its built-in tools. Cursor's documentation at `cursor.com/docs/context/mcp` describes the integration.

### Continue.dev

Continue (the open-source Copilot alternative) has native MCP support for context providers — MCP servers can extend Continue's context system for code assistance.

---

## Official Reference Servers

Anthropic maintains an [open-source repository](https://github.com/modelcontextprotocol/servers) of reference MCP server implementations:

### Built by Anthropic

| Server | Package | Capabilities |
|--------|---------|-------------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | Read, write, list files |
| **GitHub** | `@modelcontextprotocol/server-github` | Repos, issues, PRs, code |
| **GitLab** | `@modelcontextprotocol/server-gitlab` | Projects, issues, MRs |
| **Google Drive** | `@modelcontextprotocol/server-gdrive` | Files, search |
| **Google Maps** | `@modelcontextprotocol/server-google-maps` | Places, directions |
| **Postgres** | `@modelcontextprotocol/server-postgres` | Query, schema |
| **SQLite** | `@modelcontextprotocol/server-sqlite` | Local database |
| **Slack** | `@modelcontextprotocol/server-slack` | Messages, channels |
| **Memory** | `@modelcontextprotocol/server-memory` | Persistent key-value memory |
| **Puppeteer** | `@modelcontextprotocol/server-puppeteer` | Browser automation |
| **Brave Search** | `@modelcontextprotocol/server-brave-search` | Web search |
| **Fetch** | `@modelcontextprotocol/server-fetch` | HTTP requests |

### Community servers

The community has built 1000s of MCP servers covering:
- AWS, GCP, Azure cloud services
- Jira, Linear, Asana, Monday.com
- Notion, Confluence, Obsidian
- Docker, Kubernetes
- Sentry, Datadog, New Relic
- Figma, Sketch
- And much more

---

## Ecosystem Growth

### Adoption timeline

| Date | Event |
|------|-------|
| Nov 2024 | MCP announced and open-sourced by Anthropic |
| Nov 2024 | Claude Desktop first MCP host; first reference servers |
| Dec 2024 | Community servers begin appearing |
| Early 2025 | VS Code Copilot adds MCP support |
| Early 2025 | Cursor adds MCP support |
| Q1 2025 | 100s of community MCP servers available |
| Q2 2025 | OpenAI announces MCP support in ChatGPT |
| Q3 2025 | 1000+ MCP servers in community registry |
| 2025 | MCP Inspector, SDK tooling mature |
| 2026 | MCP considered the de facto standard for AI-tool integration |

### Official SDK support

| Language | SDK |
|----------|-----|
| TypeScript/Node.js | `@modelcontextprotocol/sdk` |
| Python | `mcp` (PyPI) |
| Java | Community maintained |
| C# | Community maintained |
| Go | Community maintained |
| Rust | Community maintained |

### Supported clients (as of 2025)

- Claude Desktop
- Claude Code
- Claude.ai (web)
- ChatGPT (OpenAI)
- VS Code (Copilot)
- Cursor
- Cline
- Continue.dev
- Windsurf
- Many others

---

## Building an MCP Server: Example

### TypeScript/Node.js example: simple calculator tool

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "calculator",
  version: "1.0.0",
});

// Define a tool
server.tool(
  "calculate",
  "Perform basic arithmetic operations",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number().describe("First operand"),
    b: z.number().describe("Second operand"),
  },
  async ({ operation, a, b }) => {
    let result: number;
    switch (operation) {
      case "add": result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide":
        if (b === 0) throw new Error("Division by zero");
        result = a / b;
        break;
    }
    return {
      content: [{ type: "text", text: `${a} ${operation} ${b} = ${result}` }],
    };
  }
);

// Define a resource
server.resource(
  "math-constants",
  "math://constants",
  { mimeType: "application/json" },
  async () => ({
    contents: [{
      uri: "math://constants",
      mimeType: "application/json",
      text: JSON.stringify({ pi: 3.14159, e: 2.71828, phi: 1.61803 })
    }]
  })
);

// Start with STDIO transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Running it

```bash
npm install @modelcontextprotocol/sdk zod
node calculator-server.js
```

### Adding to Claude Code

```bash
claude mcp add calculator -- node /path/to/calculator-server.js
```

Now Claude Code can call `calculate(add, 5, 3)` and get `8` back.

---

## MCP vs A2A Protocol

**Agent-to-Agent (A2A)** is Google Cloud's protocol for inter-agent communication, announced in 2025. It's often compared to MCP but serves a different purpose.

### The fundamental difference

| Aspect | MCP | A2A |
|--------|-----|-----|
| Focus | Agent ↔ Tool/Resource | Agent ↔ Agent |
| Problem solved | What tools can an agent use? | How do agents collaborate? |
| Communication model | Request/response (client to server) | Bidirectional (agent to agent) |
| Participant types | Host + Client + Server | Client agent + Remote agent |
| Use case | Connecting LLM to external systems | Multi-agent coordination |
| Scope | Single agent's tool access | Multi-agent orchestration |

### MCP flow

```
User → Claude Code → (MCP) → GitHub Server → returns issue data
```

Claude Code uses MCP to access GitHub as a *tool*.

### A2A flow

```
Orchestrator Agent
  ├── → Planning Agent (A2A): "Create implementation plan"
  │         → returns: detailed steps
  ├── → Code Agent (A2A): "Implement step 1"
  │         → returns: code changes
  └── → Review Agent (A2A): "Review for security"
            → returns: review feedback
```

A2A coordinates multiple specialized agents to work together on a task.

### They are complementary

> "MCP extends what a single agent can do. A2A expands how agents can collaborate."

In a multi-agent system:
- **Each individual agent uses MCP** to access tools, databases, and external services
- **Agents communicate with each other via A2A** to coordinate multi-step tasks

```
Orchestrator Agent
  ├── MCP: access to GitHub, Jira, Postgres
  ├── A2A: delegates to Planning Agent
  │     └── Planning Agent has MCP: access to docs, architecture DB
  └── A2A: delegates to Code Agent
        └── Code Agent has MCP: access to filesystem, terminal
```

### A2A technical details

- Messages over HTTP/JSON
- **Agent Cards**: self-descriptions that agents publish (name, capabilities, protocols)
- Client agents discover remote agents via their cards
- Supports parallel delegation and multi-agent consensus
- Google Cloud is collaborating with Auth0 on authentication for A2A

### Adoption

- A2A backed by Google Cloud + 50+ tech companies
- Designed to complement MCP, not replace it
- Both MCP and A2A are expected to coexist in mature agentic systems

---

## Future Direction

### MCP specification evolution

The spec version as of 2025 is `2025-11-25`. Key areas of development:

1. **Authorization layer**: OAuth 2.1 integration for secure remote servers
2. **Streaming improvements**: Better support for long-running tool calls
3. **Batching**: Multiple tool calls in a single round-trip
4. **Offline/async**: Tools that take minutes/hours to complete
5. **Agent orchestration**: Better support for servers that spawn sub-agents

### Ecosystem trends

- MCP servers for every major SaaS product
- MCP registries/marketplaces (like npm for AI tools)
- GUI tools for building and testing MCP servers
- Enterprise MCP gateways (authentication, rate limiting, audit)

### Key open questions

1. **Security standardization**: Each host implements its own consent UI — this needs standardization
2. **Discovery**: How does an LLM know which MCP servers to use for a given task?
3. **Versioning**: How to handle protocol upgrades without breaking existing servers?
4. **Rate limiting**: No standard for servers to communicate rate limits

---

## Sources

- MCP official introduction (Anthropic): https://www.anthropic.com/news/model-context-protocol
- MCP specification (latest): https://modelcontextprotocol.io/specification/2025-11-25
- MCP architecture docs: https://modelcontextprotocol.io/docs/learn/architecture
- MCP intro docs: https://modelcontextprotocol.io/docs/getting-started/intro.md
- Reference servers: https://github.com/modelcontextprotocol/servers
- MCP JSON-RPC reference (Portkey): https://portkey.ai/blog/mcp-message-types-complete-json-rpc-reference-guide/
- MCP deep dive (HMS): https://www.analytical-software.de/en/the-model-context-protocol-mcp-deep-dive-into-structure-and-concepts/
- MCP vs A2A comparison (Auth0): https://auth0.com/blog/mcp-vs-a2a/
- MCP vs A2A (TrueFoundry): https://www.truefoundry.com/blog/mcp-vs-a2a
- MCP vs A2A (Blott): https://www.blott.com/blog/post/mcp-vs-a2a-which-protocol-is-better-for-ai-agents
- Cline MCP overview: https://docs.cline.bot/mcp/mcp-overview
- Claude Code MCP (SFEIR): https://institute.sfeir.com/en/claude-code/claude-code-mcp-model-context-protocol/
- Copilot MCP integration: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp
- Definitive guide to MCP 2025 (Data Science Dojo): https://datasciencedojo.com/blog/guide-to-model-context-protocol/
