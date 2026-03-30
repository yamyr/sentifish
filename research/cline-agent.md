# Cline (formerly Claude Dev): VSCode Autonomous Coding Agent

> Deep-dive research on Cline's architecture, tool use, Plan/Act modes, MCP integration, computer use, and comparison with Copilot.
> Last updated: March 2026

---

## Table of Contents

1. [Overview & History](#overview--history)
2. [Architecture](#architecture)
3. [Tool Use System](#tool-use-system)
4. [Plan & Act Modes](#plan--act-modes)
5. [File Operations](#file-operations)
6. [Terminal Integration](#terminal-integration)
7. [Browser & Computer Use](#browser--computer-use)
8. [MCP Integration](#mcp-integration)
9. [Context Management](#context-management)
10. [Model Support](#model-support)
11. [Human-in-the-Loop Safety](#human-in-the-loop-safety)
12. [Cline vs GitHub Copilot](#cline-vs-github-copilot)
13. [Cline CLI](#cline-cli)
14. [Community & Marketplace](#community--marketplace)
15. [Strengths & Weaknesses](#strengths--weaknesses)
16. [Sources](#sources)

---

## Overview & History

**Cline** (formerly known as **Claude Dev**) is an open-source autonomous coding agent built as a VS Code extension. It was originally built around Anthropic's Claude models (hence the name "Claude Dev"), then rebranded to "Cline" as it expanded to support all major LLM providers.

### Key stats (2025)

- **5M+ downloads** on the VS Code Marketplace (one of the fastest-growing dev tools)
- **Open source** under Apache 2.0 license
- **GitHub**: https://github.com/cline/cline
- **Supported providers**: OpenRouter, Anthropic, OpenAI, Google Gemini, AWS Bedrock, Azure, GCP Vertex, Cerebras, Groq, LM Studio (local), Ollama (local)
- **Initial release**: July 2024
- **Status**: Active (as of 2025–2026)

### What makes Cline different

Unlike GitHub Copilot (which is primarily autocomplete + chat), Cline is designed as a **fully autonomous agent** that:
- Understands your task end-to-end
- Explores your codebase systematically using AST analysis and regex search
- Edits files, runs terminal commands, and browses the web
- Shows you every action it takes **before** executing it (human-in-the-loop)
- Can extend itself via MCP to add new capabilities on the fly

> "Cline can handle complex software development tasks step-by-step. With tools that let him create & edit files, explore large projects, use the browser, and execute terminal commands (after you grant permission), he can assist you in ways that go beyond code completion or tech support."

---

## Architecture

Cline is a VS Code extension written in TypeScript. Its core architecture:

```
┌───────────────────────────────────────────────┐
│              VS Code (Host)                    │
│  ┌─────────────────────────────────────────┐  │
│  │            Cline Extension               │  │
│  │  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  Chat Panel  │  │  Tool Handler  │  │  │
│  │  │  (React UI)  │  │                │  │  │
│  │  └──────┬───────┘  └───────┬────────┘  │  │
│  │         │                  │            │  │
│  │  ┌──────▼──────────────────▼────────┐  │  │
│  │  │        Cline Agent Loop          │  │  │
│  │  │  1. Build context (AST + files)  │  │  │
│  │  │  2. Call LLM with tool schema    │  │  │
│  │  │  3. Parse tool calls             │  │  │
│  │  │  4. Show action to user          │  │  │
│  │  │  5. Execute with permission      │  │  │
│  │  │  6. Feed result back to LLM      │  │  │
│  │  │  7. Repeat until done            │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  VS Code APIs:                                │
│  - workspace.fs (file system)                 │
│  - terminal (shell integration v1.93+)        │
│  - window (diff viewer)                       │
│  - extension API (linting errors)             │
└───────────────────────────────────────────────┘
         │
         ▼
   LLM API (Anthropic/OpenAI/etc.)
```

### The agentic loop in detail

1. **User describes task** in the Cline chat panel (can include images/screenshots)
2. Cline **analyzes file structure** using regex searches and AST parsing to understand the codebase
3. Cline **reads relevant files** to build context about what exists
4. Cline **proposes an action** (edit a file, run a command, use browser, etc.)
5. A **diff or command preview** is shown to the user
6. User **approves or rejects** the action
7. Cline **executes the approved action** and observes the result
8. Cline **continues to the next step** until the task is complete
9. On completion, Cline **opens the result** (e.g., `open -a "Google Chrome" index.html`)

---

## Tool Use System

Cline uses a structured tool-calling interface with the LLM. Each tool is defined with a name, description, and JSON schema for parameters. The LLM emits tool calls which Cline parses and executes.

### Core tools available to Cline

#### File system tools

| Tool | Description |
|------|-------------|
| `write_to_file` | Create or overwrite a file with specified content |
| `read_file` | Read the full contents of a file |
| `apply_diff` | Apply a specific diff/patch to a file |
| `insert_content` | Insert content at a specific line |
| `search_and_replace` | Find and replace text in a file |
| `list_files` | List files in a directory (recursive option) |
| `list_code_definition_names` | List classes/functions in a file (AST-based) |
| `search_files` | Regex search across all files in the workspace |

#### Terminal tools

| Tool | Description |
|------|-------------|
| `execute_command` | Run a shell command and stream output |

#### Browser tools

| Tool | Description |
|------|-------------|
| `browser_action` | Launch browser, navigate, click, type, scroll, screenshot |

#### MCP tools

| Tool | Description |
|------|-------------|
| `use_mcp_tool` | Call a tool exposed by a connected MCP server |
| `access_mcp_resource` | Read a resource from a connected MCP server |

#### Communication tools

| Tool | Description |
|------|-------------|
| `ask_followup_question` | Ask the user a clarifying question |
| `attempt_completion` | Signal task completion and present result |

---

## Plan & Act Modes

Cline's **Plan/Act mode** system is one of its most distinctive features — a structured separation between *thinking* and *doing*.

### Plan Mode

In Plan mode, Cline can:
- Read files and analyze code
- Run searches across the codebase
- Discuss architecture, tradeoffs, and implementation options
- Ask clarifying questions

In Plan mode, Cline **cannot**:
- Write or modify files
- Execute terminal commands
- Take any action that changes the system state

This constraint is intentional. It prevents Cline from "running ahead" and making changes before the approach is agreed upon. Plan mode is essentially a **read-only exploration + discussion** mode.

### Act Mode

In Act mode, Cline:
- Retains all context from the Plan mode session
- Can now modify files, run commands, etc.
- Executes the strategy developed in Plan mode

The conversation history carries over seamlessly — Cline "remembers" everything discussed in Plan mode.

### When to use each

| Scenario | Mode |
|----------|------|
| Unfamiliar codebase, exploring before changing | Plan |
| Debugging complex bugs with uncertain cause | Plan |
| Architectural decisions affecting many files | Plan |
| Code review / security analysis | Plan |
| Clear, routine implementation task | Act |
| Quick fix with obvious solution | Act |
| Running tests and adjusting | Act |
| Following an established pattern | Act |

### Different models for each mode

Cline supports configuring **separate models** for Plan and Act modes:

| Use case | Plan model | Act model |
|----------|-----------|-----------|
| Cost optimization | GLM 4.6 | Grok Code Fast |
| Maximum quality | Claude Opus | Claude Sonnet |
| Speed-focused | Gemini 3 Flash | Cerebras |

Enable in: Cline Settings → "Use different models for Plan and Act"

### `/deep-planning` command

For complex tasks, the `/deep-planning` slash command triggers an extended planning session:

1. Cline systematically explores the codebase
2. Identifies all affected files and dependencies
3. Creates a detailed, step-by-step implementation plan
4. Asks clarifying questions before proceeding

The deep planning prompt is optimized per model family.

---

## File Operations

Cline's file editing is designed to be **transparent and reversible**:

### Diff-based editing

Every file change is shown as a **git-style diff** in VS Code's native diff viewer before being applied. You see exactly what will change.

### Edit workflow

```
Cline proposes: "I'll modify src/auth.py to add JWT validation"
  ↓
VS Code diff viewer shows:
  --- src/auth.py (before)
  +++ src/auth.py (after)
  @@ -42,6 +42,15 @@
  + def validate_jwt(token: str) -> dict:
  +     """Validate JWT and return payload."""
  +     try:
  +         payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
  ...
  ↓
User clicks "Apply" or "Reject"
```

### Linter/compiler monitoring

After applying a file change, Cline:
1. Observes VS Code's linter/diagnostic output
2. If there are errors (missing imports, syntax errors), Cline automatically attempts to fix them
3. This creates a tight feedback loop without requiring the user to manually copy errors

---

## Terminal Integration

Cline uses **VS Code's shell integration API** (introduced in VS Code v1.93) to:

- Execute commands directly in the VS Code integrated terminal
- **Stream terminal output** back to the LLM in real-time
- React to errors as they appear

### Supported terminal operations

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Build
npm run build
cargo build

# Test
pytest tests/
npm test

# Deploy
docker build -t myapp .
kubectl apply -f deployment.yaml

# Start dev server (background)
npm run dev  →  "Proceed While Running" button
```

### Long-running processes

For dev servers and other long-running processes:
- Cline shows a **"Proceed While Running"** button
- The command runs in the background
- Cline continues its task and receives new terminal output as it arrives
- If the server errors out, Cline is notified and can react

---

## Browser & Computer Use

Cline includes a **headless browser** capability powered by Puppeteer (or Playwright):

### What it can do

```
browser_action: launch
browser_action: navigate, url="http://localhost:3000"
browser_action: screenshot
browser_action: click, coordinate=[x, y]
browser_action: type, text="hello world"
browser_action: scroll, coordinate=[x, y], direction="down"
browser_action: close
```

### Primary use cases

1. **Runtime error detection**: Launch the dev server, screenshot the app, identify visual/runtime bugs
2. **End-to-end testing**: Navigate through a web app like a user
3. **Visual bug fixing**: Take a screenshot of a broken UI, fix the CSS, screenshot again to verify
4. **Web scraping**: Extract data from websites for integration tasks

### How it works in practice

```
User: "My React app has a layout bug on mobile"
  ↓
Cline: runs `npm run build && npx serve`
  ↓
Cline: launches browser, navigates to localhost:3000
  ↓
Cline: takes screenshot at mobile viewport
  ↓
Cline: analyzes screenshot, identifies misaligned flex container
  ↓
Cline: edits App.css, takes another screenshot
  ↓
Cline: confirms fix, reports to user
```

This loop runs entirely within the VS Code session — no manual browser switching needed.

---

## MCP Integration

Cline has first-class support for **Model Context Protocol (MCP)** and can:

1. **Connect to existing MCP servers**
2. **Build new MCP servers from scratch** (ask Cline: "add a tool that...")

### Connecting MCP servers

MCP servers are configured in VS Code settings or via the Cline UI:

```json
{
  "cline.mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "postgresql://..." }
    }
  }
}
```

### Cline building MCP servers

A unique feature: ask Cline to create a custom MCP server:

> "Add a tool that lets me query our internal Redis cache"

Cline will:
1. Create a new MCP server project
2. Implement the Redis query tool
3. Install it into the extension configuration
4. Test it in the current session

This means Cline can **extend its own capabilities** on demand, making it a self-expanding agent.

### The Cline MCP Marketplace

Cline has a built-in marketplace of community MCP servers covering:
- Git operations
- Database queries (Postgres, MySQL, MongoDB)
- Cloud services (AWS, GCP, Azure)
- Communication tools (Slack, Jira, Linear)
- Browser automation (Puppeteer, Playwright)
- Code analysis (SonarQube, etc.)

---

## Context Management

One of Cline's key engineering challenges is **context window management** for large codebases.

### How Cline builds context

1. **File structure analysis**: Cline lists the directory tree to understand the project layout
2. **AST parsing**: For relevant files, Cline uses tree-sitter to extract class/function definitions
3. **Regex search**: Targeted searches for specific patterns (e.g., "find all places X is called")
4. **Selective file reading**: Only reads files directly relevant to the task
5. **Incremental context**: Adds information as needed, not all at once

This approach is explicitly designed to work even on **large, complex projects without overwhelming the context window**.

### Token tracking

Cline displays **real-time token usage and cost** for every API call:
- Total tokens for the session
- Tokens per individual request
- Estimated cost (based on provider pricing)

This helps users stay aware of costs before they get surprised.

### Context window limits

When the context window fills up:
- Cline summarizes earlier conversation history
- Critical files and recent actions are retained
- Users are warned before context truncation

---

## Model Support

Cline supports virtually all major LLM providers:

| Provider | Notes |
|----------|-------|
| **Anthropic** | Claude 3.5 Sonnet, Haiku, Opus, Claude 3.7 Sonnet |
| **OpenAI** | GPT-4o, GPT-4.1, o3-mini, o1 |
| **Google Gemini** | Gemini 1.5 Pro/Flash, Gemini 2.5 Pro |
| **OpenRouter** | Aggregates 100+ models; auto-updates available models |
| **AWS Bedrock** | Claude and other Bedrock models |
| **Azure OpenAI** | Enterprise Azure-hosted models |
| **GCP Vertex** | Claude via Vertex AI |
| **Cerebras** | Ultra-fast inference |
| **Groq** | Fast open-source models |
| **LM Studio** | Local models via OpenAI-compatible API |
| **Ollama** | Local models (Llama, Mistral, CodeLlama, etc.) |

**Default recommended model**: Claude 3.5 Sonnet (excellent balance of capability and cost for agentic tasks)

---

## Human-in-the-Loop Safety

Cline's core philosophy is **"human-in-the-loop at every step"**:

### Permission model

Every action type can be configured independently:

| Action type | Default | Can be auto-approved |
|-------------|---------|---------------------|
| Read files | Auto-approved | N/A |
| Write/edit files | Requires approval | ✅ |
| Terminal commands | Requires approval | ✅ (pattern-based) |
| Browser actions | Requires approval | ✅ |
| MCP tool calls | Requires approval | ✅ |

### Per-session auto-approve settings

```
✅ Allow Cline to read files freely
□  Auto-approve file writes (caution)
□  Auto-approve terminal: npm test, pytest (specific commands)
□  Auto-approve terminal: all commands (dangerous)
□  Auto-approve browser actions
```

### Why this matters

Unlike Devin or cloud agents that operate autonomously in a sandbox, Cline runs **in your local environment**. This means mistakes can affect your actual files and running processes. The human-in-the-loop design prevents accidents while still enabling high productivity.

---

## Cline vs GitHub Copilot

| Feature | Cline | GitHub Copilot |
|---------|-------|----------------|
| Type | VS Code extension (open source) | VS Code extension + GitHub integration |
| Inline autocomplete | ❌ (focus is on tasks) | ✅ Core feature |
| Chat mode | ✅ | ✅ |
| Multi-file editing | ✅ (agent-driven) | ✅ (Copilot Edits) |
| Agent mode | ✅ (primary mode) | ✅ (agent mode 2025) |
| Terminal access | ✅ (shell integration) | ✅ |
| Browser use | ✅ (Puppeteer) | ❌ |
| MCP integration | ✅ (first-class) | ✅ (via agent mode) |
| Model choice | Any LLM (100+) | Curated list (5-10 models) |
| Human-in-loop | ✅ Explicit approval UI | ✅ (command approval) |
| GitHub integration | Via MCP | ✅ Native |
| Plan/Act modes | ✅ | ❌ (single mode) |
| Cost | Token-cost only (no subscription) | $10-19/mo + tokens |
| Open source | ✅ Apache 2.0 | ❌ |
| Computer use | ✅ | ❌ |
| Self-extending via MCP | ✅ (Cline builds MCP servers) | Limited |

### Key differentiator

Cline's biggest edge over Copilot is **depth of autonomy** — it's built from the ground up as an agent, not a chat assistant. The Plan/Act modes, browser use, MCP self-extension, and transparent approval UI represent a fundamentally different design philosophy.

Copilot's edge is **GitHub integration and autocomplete quality** — it lives inside GitHub's ecosystem and has mature, well-tuned inline suggestions.

---

## Cline CLI

In late 2025, Cline released a **CLI version** (preview):

```bash
# Install
npm install -g cline-cli

# Run a task
cline run "Implement OAuth2 authentication in src/auth/"

# Interactive mode
cline

# With specific model
cline --model anthropic/claude-3-5-sonnet-20241022
```

The CLI brings Cline's agentic capabilities outside of VS Code — useful for:
- Automation scripts
- CI/CD pipelines
- Server-side code generation
- Users who prefer other editors

---

## Community & Marketplace

Cline has a vibrant open-source community:

### GitHub activity (2025)

- 5M+ VS Code marketplace downloads
- Active contributors from across the world
- Regular releases with new features
- Community-maintained MCP server list

### Official resources

- Documentation: https://docs.cline.bot
- MCP Marketplace: Built into the extension
- Blog: https://cline.ghost.io
- GitHub: https://github.com/cline/cline

### Ecosystem forks

Cline inspired several forks and derivatives:
- **Roo Code** (Nov 2024): Cline fork with additional customization
- **Kilo Code**: Fork with 500+ model support
- Several enterprise-focused forks

---

## Strengths & Weaknesses

### ✅ Strengths

1. **Genuinely autonomous**: End-to-end task handling from planning to implementation to testing
2. **Deep tool use**: File system, terminal, browser, MCP — complete control of the environment
3. **Plan/Act separation**: Structured thinking before doing — better results on complex tasks
4. **Open source**: Fully auditable, forkable, customizable
5. **Model flexibility**: Works with any LLM provider including local models
6. **Self-extending via MCP**: Can build and install new tools on demand
7. **Transparent**: Shows every action before executing; human-in-the-loop at every step
8. **Cost transparency**: Real-time token/cost tracking
9. **Computer use**: Browser automation for visual debugging is genuinely powerful
10. **Zero subscription fee**: Pay only for tokens you use (your API key)

### ❌ Weaknesses

1. **No inline autocomplete**: Not designed for continuous code suggestions while typing
2. **Slow for simple tasks**: Agentic loop overhead for things Copilot handles instantly
3. **Token costs can add up**: Autonomous exploration of a large codebase burns tokens fast
4. **Setup friction**: Requires configuring API keys, choosing models, understanding permissions
5. **No cloud execution**: Runs locally (unlike Devin/Copilot Workspace cloud agents)
6. **VS Code-only** (mostly): CLI is new and limited vs the full extension
7. **Context window challenges**: Large codebase exploration can still hit limits

---

## Sources

- Cline GitHub: https://github.com/cline/cline
- Cline docs: https://docs.cline.bot
- Cline Plan & Act docs: https://docs.cline.bot/core-workflows/plan-and-act.md
- Cline MCP overview: https://docs.cline.bot/mcp/mcp-overview
- Cline blog (alternatives post): https://cline.ghost.io/6-best-open-source-claude-code-alternatives-in-2025-for-developers-startups-copy/
- Cline VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev
- DeployHQ Cline guide: https://www.deployhq.com/guides/cline
- AI coding agents comparison: https://artificialanalysis.ai/insights/coding-agents-comparison
- Morph 15 agents comparison: https://www.morphllm.com/ai-coding-agent
