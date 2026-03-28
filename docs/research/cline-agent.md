# Cline VSCode Extension (formerly Claude Dev) — Comprehensive Overview

> Research compiled: March 2026  
> Sources: github.com/cline/cline, docs.cline.bot, deepwiki.com/cline/cline, VS Code Marketplace

---

## Table of Contents

1. [Overview](#overview)
2. [History: From Claude Dev to Cline](#history-from-claude-dev-to-cline)
3. [Architecture](#architecture)
4. [Core Extension Components](#core-extension-components)
5. [Tool Definitions](#tool-definitions)
6. [Approval Flow](#approval-flow)
7. [MCP Integration](#mcp-integration)
8. [Browser Automation](#browser-automation)
9. [Context Management](#context-management)
10. [Workspace Snapshots](#workspace-snapshots)
11. [Model Support](#model-support)
12. [Plan & Act Pipeline](#plan--act-pipeline)
13. [@-Mention Context System](#-mention-context-system)
14. [Terminal Integration](#terminal-integration)
15. [Configuration & Customization](#configuration--customization)
16. [Enterprise Features](#enterprise-features)
17. [Comparison with Other Harnesses](#comparison-with-other-harnesses)
18. [Sources](#sources)

---

## Overview

**Cline** is an autonomous coding agent extension for VS Code. Originally released as "Claude Dev" by Saoud Rizwan, it was renamed to Cline (a portmanteau of **C**LI + **li**ne, or **Cl**aude Dev + **li**ne) and is now developed by Cline Bot Inc. as an open-source Apache 2.0 project.

The core design philosophy:
> "Autonomous coding agent right in your IDE, capable of creating/editing files, executing commands, using the browser, and more with **your permission every step of the way**."

Cline is unique in that it maintains **human-in-the-loop approval** for every significant action while still being capable of complex, multi-step autonomous tasks.

### Key Facts

- **License**: Apache 2.0
- **Language**: TypeScript
- **GitHub**: [cline/cline](https://github.com/cline/cline)
- **VS Code Marketplace**: `saoudrizwan.claude-dev`
- **Stars**: ~30K+ GitHub stars
- **Company**: Cline Bot Inc.
- **Enterprise**: SSO, audit trails, private networking, self-hosted deployments

---

## History: From Claude Dev to Cline

### Timeline

- **2024 (early)**: Saoud Rizwan releases "Claude Dev" as a personal VS Code extension
- **2024 (mid)**: Extension gains significant traction; renamed to Cline
- **2024 (late)**: Cline Bot Inc. founded; enterprise tier introduced
- **2025**: Computer use (Anthropic) integration; MCP tool creation
- **2026**: Continued development with 30K+ GitHub stars

### Why "Cline"?

The name "Cline" is a portmanteau reflecting:
- **C**LI — command-line interface roots
- **li**ne — code line / line of code
- Originally inspired by Claude Dev → **C**laude Dev + **line** → Cline

### Architecture Evolution

Initial Claude Dev was tightly coupled to Claude Sonnet's specific API. Cline evolved to:
- Support multiple LLM providers
- Introduce a general tool use framework
- Add MCP for extensibility
- Build enterprise features

---

## Architecture

### High-Level Architecture

```
VS Code Extension Host
├── Extension Entry Point (extension.ts)
│   └── Creates ClineProvider (Webview)
│
├── Controller (Central Orchestrator)
│   ├── StateManager (Persistence)
│   ├── AuthService (Identity)
│   ├── McpHub (MCP server management)
│   └── Task (active task instance)
│
└── Task (Agentic Loop)
    ├── LLM API calls
    ├── Tool execution
    ├── Permission prompts
    └── Conversation history
```

### Component Overview

**ClineProvider** — The VS Code WebviewProvider:
- Creates and manages the sidebar/panel webview
- React-based UI communicates with extension via message passing
- Handles UI state, themes, streaming output display

**Controller** — The central nervous system:
- Owns `StateManager` for persisting settings and task history
- Owns `AuthService` for API key management
- Owns `McpHub` for MCP server registry
- Manages the active `Task` instance

**Task** — One agentic session:
- Maintains conversation history
- Dispatches tool calls with permission checks
- Manages file snapshots for rollback
- Tracks all file changes across the session

### Tool Integration Architecture

```
ClineDefaultTool implementations (built-in):
├── ReadFileTool
├── WriteFileTool
├── EditFileTool
├── ExecuteCommandTool
├── BrowserActionTool
└── ... (20+ tools)

McpTool integration (external):
├── McpHub manages server connections
├── Tool discovery via MCP protocol
└── Dynamic tool registration in agent context
```

---

## Core Extension Components

### ClineProvider (Webview)

The sidebar panel is a React application communicating with the extension host via VS Code's webview message API:

```typescript
// Extension to webview
panel.webview.postMessage({ type: 'taskComplete', result: ... })

// Webview to extension
vscode.postMessage({ type: 'userInput', text: '...' })
```

This separation allows rich UI (syntax-highlighted diffs, approval buttons, cost tracking) while keeping business logic in the extension host.

### StateManager

Persists across VS Code sessions:
- Task history (full conversation per task)
- User settings (API keys, model selection, behavior flags)
- MCP server configurations
- Auto-approval rules

### McpHub

Manages the registry of MCP servers:
- Tracks connected servers and their tool manifests
- Handles server lifecycle (start, stop, restart)
- Provides tool discovery for the agent
- Supports `stdio` and `SSE` transport types

---

## Tool Definitions

Cline provides a rich set of built-in tools. Each tool is defined with a JSON schema that the LLM uses to understand when and how to call it:

### File Operation Tools

**read_file**
```json
{
  "name": "read_file",
  "description": "Read the contents of a file at the specified path. Returns file content or error if not found.",
  "parameters": {
    "path": "string — relative or absolute path to file"
  }
}
```

**write_to_file**
```json
{
  "name": "write_to_file",
  "description": "Write content to a file, creating or overwriting. Shows diff for user approval.",
  "parameters": {
    "path": "string — file path",
    "content": "string — complete file content"
  }
}
```

**replace_in_file**
```json
{
  "name": "replace_in_file",
  "description": "Make targeted edits to a file using SEARCH/REPLACE blocks. More efficient than rewriting entire file.",
  "parameters": {
    "path": "string",
    "diff": "string — SEARCH/REPLACE block format"
  }
}
```

**list_files**
```json
{
  "name": "list_files",
  "description": "List files and directories in a path. Optional recursive listing.",
  "parameters": {
    "path": "string",
    "recursive": "boolean (optional)"
  }
}
```

**search_files**
```json
{
  "name": "search_files",
  "description": "Search files for content using regex. Returns matching lines with file context.",
  "parameters": {
    "path": "string — directory to search",
    "regex": "string — search pattern",
    "file_pattern": "string — optional glob filter"
  }
}
```

### Code Intelligence Tools

**list_code_definition_names**
```json
{
  "name": "list_code_definition_names",
  "description": "List top-level definition names (classes, functions) in all files at a path. Uses AST parsing.",
  "parameters": {
    "path": "string — file or directory"
  }
}
```

### Execution Tools

**execute_command**
```json
{
  "name": "execute_command",
  "description": "Execute a CLI command in the user's terminal. Shows command to user for approval. Supports long-running processes.",
  "parameters": {
    "command": "string — the command to run",
    "requires_approval": "boolean"
  }
}
```

### Browser Tools

**browser_action**
```json
{
  "name": "browser_action",
  "description": "Interact with a Puppeteer-controlled browser. Actions: launch, click, type, scroll, screenshot, close.",
  "parameters": {
    "action": "launch | click | type | scroll | screenshot | close",
    "url": "string (for launch)",
    "coordinate": "[x, y] (for click/scroll)",
    "text": "string (for type)"
  }
}
```

### MCP Tool Integration

MCP tools are dynamically added to the tool list with:
```json
{
  "name": "mcp__servername__toolname",
  "description": "...(from MCP server's tool manifest)...",
  "parameters": { "...(from MCP server schema)..." }
}
```

### Communication Tools

**ask_followup_question**
```json
{
  "name": "ask_followup_question",
  "description": "Ask the user for clarification when you need more information to proceed.",
  "parameters": {
    "question": "string"
  }
}
```

**attempt_completion**
```json
{
  "name": "attempt_completion",
  "description": "Signal that the task is complete and present the result to the user.",
  "parameters": {
    "result": "string — description of what was accomplished",
    "command": "string (optional) — command to demonstrate the result, e.g. 'open -a Chrome index.html'"
  }
}
```

---

## Approval Flow

Cline's **human-in-the-loop** approval system is its defining characteristic.

### Approval Events

Every significant action triggers an approval prompt:

```
┌─ Cline wants to: ────────────────────────────┐
│ Execute command:                              │
│ $ npm install express                         │
│                                               │
│ [Approve] [Reject] [Always Allow This]        │
└───────────────────────────────────────────────┘
```

```
┌─ Cline wants to: ────────────────────────────┐
│ Write file: src/auth.ts                       │
│                                               │
│ + import jwt from 'jsonwebtoken'              │
│ + ...                                         │
│                                               │
│ [Approve] [Reject] [Edit]                     │
└───────────────────────────────────────────────┘
```

### Approval Levels

**Per-action approval** (default): Every tool call requires approval

**Always Allow rules**: Create rules to auto-approve specific patterns:
- `npm run *` — always allow npm scripts
- `git status` — always allow read-only git commands
- `*.test.ts` edits — always allow test file edits

**Auto-approve mode**: Can be configured to approve all actions (for trusted workflows)

### Approval UI Features

- **Diff view**: File changes shown as colored diff before approval
- **Command preview**: Exact command shown before execution
- **Reason**: Cline explains why it's making the action
- **Edit option**: User can modify the proposed change before approving
- **Timeline**: VS Code file timeline shows all Cline changes (reversible)

---

## MCP Integration

Cline's MCP integration is one of its standout features — and uniquely, Cline can **create and install MCP servers** itself.

### Using Existing MCP Servers

```json
// .vscode/cline_mcp_settings.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}
```

### Self-Creating MCP Tools

Cline can autonomously create new MCP servers when asked:

```
User: "Add a tool that fetches Jira tickets"

Cline:
1. Creates a new Node.js MCP server project
2. Implements Jira API integration
3. Configures tool schema
4. Installs the server in Cline's settings
5. Tool is now available for future tasks
```

This means Cline can **extend its own capabilities** dynamically — not just use pre-built MCP servers.

### Example Use Cases

- **Jira integration**: Pull ticket details, acceptance criteria → implement feature
- **AWS EC2 management**: Check server metrics → scale up/down
- **PagerDuty incidents**: Fetch incident details → investigate code
- **Custom APIs**: Build adapters for internal tools

### MCP Transport Support

- **stdio**: Local process via stdin/stdout (most common)
- **SSE**: Remote server via HTTP Server-Sent Events

---

## Browser Automation

Cline integrates Claude's Computer Use capabilities via Puppeteer:

### Capabilities

```typescript
// Available browser_action types
"launch"     // Open a URL in headless/headed browser
"click"      // Click at specific coordinates
"type"       // Type text (after clicking a field)
"scroll"     // Scroll the page
"screenshot" // Capture current state
"close"      // Close the browser
```

### Browser Task Example

```
User: "Test the login flow and screenshot any errors"

Cline:
1. browser_action: launch("http://localhost:3000/login")
2. browser_action: screenshot() → (shows login form)
3. browser_action: click([320, 450]) → (email field)
4. browser_action: type("test@example.com")
5. browser_action: click([320, 500]) → (password field)
6. browser_action: type("password123")
7. browser_action: click([320, 560]) → (submit button)
8. browser_action: screenshot() → (shows error: "Invalid credentials")
9. → Reports error to user, shows screenshot
```

### Console Log Access

During browser sessions, Cline captures:
- JavaScript console.log output
- JavaScript errors
- Network request failures

This enables debugging without manual developer tools inspection.

---

## Context Management

### How Cline Builds Context

Cline manages context through careful selection of what to include:

**AST Analysis**: Before starting a task, Cline:
1. Analyzes file structure using AST parsing (`list_code_definition_names`)
2. Runs regex searches to find relevant code
3. Reads only the files it needs for the task

This avoids loading the entire codebase while still getting accurate context.

### Context Sources

| Source | How added |
|--------|-----------|
| `@file:path` | Explicit file content |
| `@folder:path` | All files in folder |
| `@url:https://...` | Fetched URL as markdown |
| `@problems` | VS Code "Problems" panel errors |
| Image attachments | Bug screenshots, mockups |

### Cost Tracking

Cline tracks token usage and API costs in real time:
- Total tokens per task
- Total cost per task  
- Per-request breakdown

This transparency helps users understand and control AI spending.

---

## Workspace Snapshots

Cline takes snapshots at each step of a task:

### Snapshot System

```
Task: "Refactor authentication"
  
Step 1 snapshot: [state before any changes]
Step 2 snapshot: [state after writing user.ts]
Step 3 snapshot: [state after editing auth.ts]
Step 4 snapshot: [state after running migrations]
```

### Restore Options

For each snapshot, users can:

**Compare**: Show diff between snapshot and current workspace  
**Restore Workspace Only**: Roll back files without affecting task history  
**Restore Task and Workspace**: Roll back everything including conversation

This enables:
- Safe exploration of different approaches
- Quick testing of different versions
- Recovery from bad AI edits

---

## Model Support

Cline supports a wide range of LLM providers:

### Supported Providers

| Provider | Models |
|----------|--------|
| **Anthropic** | Claude 4 Opus/Sonnet, Claude 3.7 Sonnet, Claude 3.5 Sonnet/Haiku |
| **OpenRouter** | All OpenRouter models (auto-updated) |
| **OpenAI** | GPT-4o, GPT-4o mini, o1, o3 |
| **Google Gemini** | Gemini 2.5 Pro/Flash, Gemini 2.0 Flash |
| **AWS Bedrock** | Claude via Bedrock |
| **Azure OpenAI** | Azure-hosted models |
| **GCP Vertex AI** | Gemini via Vertex |
| **Cerebras** | Llama models |
| **Groq** | Fast inference models |
| **LM Studio** | Local models |
| **Ollama** | Local models |
| **OpenAI-compatible** | Any custom endpoint |

### Model Selection Strategy

- **Claude Sonnet**: Recommended default (best overall performance + Cline integration)
- **Gemini 2.5 Pro**: Strong alternative, large context window
- **OpenRouter**: For model flexibility and cost optimization
- **Local models**: For privacy-sensitive codebases

### Context Window Awareness

Cline adapts its behavior to the model's context window:
- Selects files strategically to fit within limits
- Warns when context is getting full
- Prioritizes most relevant files

---

## Plan & Act Pipeline

Cline uses a **Plan → Act** pipeline pattern:

### Plan Mode

When enabled (toggle in UI), Cider:
1. **Plans** before acting — proposes a full strategy
2. Shows the plan to user for approval
3. Only proceeds when user approves

Example:
```
Task: "Add dark mode to the app"

Plan:
1. Check if CSS variables are used (reads globals.css)
2. Add dark mode media query to globals.css
3. Add toggle switch component to Header.tsx
4. Connect toggle to localStorage persistence
5. Test by running npm run dev

[Approve Plan] [Edit Plan] [Reject]
```

### Act Mode (Default)

Without explicit Plan mode, Cline acts incrementally:
- Announces each action before doing it
- Approval prompt lets user steer or redirect
- Each approved action is an implicit "plan step"

### Implicit Planning via System Prompt

Even in Act mode, Cline's system prompt encourages a planning mindset:
- Explore before editing
- Use AST analysis to understand code structure
- Think about side effects before making changes

---

## @-Mention Context System

Cline's `@-mention` system lets users inject context directly:

### @-Mentions

| Mention | Effect |
|---------|--------|
| `@url:https://...` | Fetches URL, converts to markdown |
| `@problems` | Adds VS Code Problems panel errors |
| `@file:path/to/file.ts` | Adds file contents to context |
| `@folder:src/components` | Adds all files in folder |

### Image Support

Users can paste images directly into the chat:
- Screenshots of UI bugs
- Design mockups
- Error dialogs

Cline analyzes images and incorporates them into task understanding:
```
User: [pastes screenshot of broken layout]
"Fix this alignment issue"

Cline: [analyzes screenshot]
→ Opens browser
→ Identifies the broken component
→ Fixes CSS
→ Takes screenshot to verify
```

---

## Terminal Integration

### VS Code Shell Integration (v1.93+)

Cline uses VS Code's shell integration API to:
- Execute commands directly in VS Code terminal
- Receive command output as text
- React to long-running processes

### Long-Running Processes

For dev servers and other persistent processes:

```
Cline: "Starting dev server to test changes"
  → execute_command("npm run dev")
  
User: [Approves]

Cline: [Server running on :3000]
  → [Proceed While Running] button appears
  → Cline continues editing while server runs
  → Any new terminal output is captured
  → If server crashes, Cline sees the error and reacts
```

---

## Configuration & Customization

### Settings (VS Code Settings UI)

```json
// .vscode/settings.json
{
  "cline.apiProvider": "anthropic",
  "cline.apiModelId": "claude-sonnet-4-5-20251101",
  "cline.autoApproveReadOnly": true,
  "cline.alwaysAllowWriteOnly": false,
  "cline.requestDelaySeconds": 0,
  "cline.diffEnabled": true
}
```

### Custom Instructions

Users can provide persistent custom instructions:
```
Always use TypeScript strict mode.
Prefer functional components over class components.
Write JSDoc comments for public functions.
Use Tailwind CSS for styling.
```

These are injected into every task's system prompt.

### .clinerules File

Project-level rules in the repository root:
```
# .clinerules

## Project Context
This is a Next.js 14 application using the App Router.

## Conventions
- Pages go in app/ directory
- API routes in app/api/
- Components in components/
- Always use server components by default

## Testing
- Run: npm test
- Test files end in .test.tsx
```

---

## Enterprise Features

### Cline Enterprise

Available at cline.bot/enterprise:

**Single Sign-On (SSO)**:
- SAML/OIDC integration
- Enterprise identity provider support

**Global Policies**:
- Centrally configure model providers
- Enforce usage limits
- Control which tools are available

**Observability & Audit Trails**:
- Full audit log of all Cline actions
- Per-user and per-team usage metrics
- Cost attribution

**Private Networking**:
- VPC deployment
- Private Link support
- Air-gapped environments

**Self-hosted / On-premises**:
- Deploy Cline's backend on your infrastructure
- No data leaves your network

**Enterprise Support**:
- SLA guarantees
- Dedicated support channel

---

## Comparison with Other Harnesses

| Feature | Cline | Claude Code | Aider | Cursor | OpenCode |
|---------|-------|-------------|-------|--------|----------|
| **Interface** | VS Code ext | Terminal + IDE | Terminal | IDE fork | Terminal TUI |
| **Open Source** | ✅ Apache 2 | ❌ | ✅ Apache 2 | ❌ | ✅ MIT |
| **Approval model** | Per-action | Tiered modes | Minimal | Per-action | Per-action |
| **MCP support** | ✅ Full + auto-create | ✅ | ❌ | ❌ | ✅ |
| **Browser** | ✅ Puppeteer | ✅ Chrome | ❌ | ✅ GA | ❌ |
| **Snapshots** | ✅ Per-step | ✅ Checkpoints | Git commits | ✅ | ✅ undo/redo |
| **Cost tracking** | ✅ Per-task | ✅ | ✅ | ✅ | ❌ |
| **Model support** | 10+ providers | Anthropic | 100+ | 5 providers | 75+ |
| **Enterprise** | ✅ Full | ✅ Full | ❌ | Limited | ❌ |
| **AST analysis** | ✅ | Via LSP | ✅ Repo map | ✅ Semantic | ❌ |
| **Plan mode** | ✅ | ✅ | ✅ Architect | ✅ | ✅ |
| **Self-hosted** | ✅ Enterprise | ❌ | ✅ | ❌ | N/A |

### Cline's Unique Strengths

1. **Human-in-the-loop by default**: Every action requires approval — ideal for developers who want visibility but still want AI assistance
2. **MCP self-creation**: Cline can build and install its own MCP tools — unique self-extensibility capability
3. **Deep VS Code integration**: Leverages VS Code's timeline, terminal, and problems panel natively
4. **Snapshot system**: Per-step workspace snapshots for safe exploration and rollback
5. **Enterprise ready**: Full SSO, audit trails, private networking, self-hosted deployment

### Cline vs. Claude Code

Both are approvals-first tools, but differ in:
- **Interface**: Cline lives in VS Code sidebar; Claude Code is a terminal CLI + extension
- **Extensibility**: Cline can auto-create MCP servers; Claude Code has managed hooks/skills
- **Enterprise**: Both have enterprise offerings; Claude Code focuses on managed settings + CI/CD
- **Model allegiance**: Cline is model-agnostic; Claude Code is Claude-only

### Cline vs. Cursor

- Cline is an extension; Cursor is a full editor fork
- Cursor has Composer (in-house model); Cline uses external providers
- Cursor has multi-agent (8 parallel); Cline is single-agent per task
- Cline is open source; Cursor is proprietary
- Both have enterprise offerings

---

## Sources

1. [cline/cline GitHub Repository](https://github.com/cline/cline)
2. [Cline VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)
3. [Cline Docs](https://docs.cline.bot/)
4. [DeepWiki: Cline Architecture Overview](https://deepwiki.com/cline/cline/1.3-architecture-overview)
5. [DeepWiki: Cline Core System](https://deepwiki.com/cline/cline/2-core-system)
6. [Roo Code vs Cline Comparison](https://www.qodo.ai/blog/roo-code-vs-cline/)
7. [Cline Enterprise Page](https://cline.bot/enterprise)

---

*Last updated: March 2026*
