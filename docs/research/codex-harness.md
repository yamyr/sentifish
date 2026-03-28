# OpenAI Codex Agent Harness — Comprehensive Overview

> Research compiled: March 2026  
> Sources: openai.com/index/unrolling-the-codex-agent-loop, openai.com/index/unlocking-the-codex-harness, GitHub openai/codex

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture: The Agent Loop](#architecture-the-agent-loop)
3. [Prompt Construction](#prompt-construction)
4. [Tool Definitions](#tool-definitions)
5. [Sandbox Environments](#sandbox-environments)
6. [Context Window Management](#context-window-management)
7. [Permission System](#permission-system)
8. [MCP Integration](#mcp-integration)
9. [Skills System](#skills-system)
10. [Performance Optimizations](#performance-optimizations)
11. [Codex CLI Usage](#codex-cli-usage)
12. [Codex Cloud (Web Agent)](#codex-cloud-web-agent)
13. [Technical Implementation Details](#technical-implementation-details)
14. [Comparison with Other Harnesses](#comparison-with-other-harnesses)
15. [Sources](#sources)

---

## Overview

**Codex** is OpenAI's suite of software agent products, all built on the same underlying **Codex harness** — a core agent loop and execution framework. The Codex harness orchestrates the interaction between the user, OpenAI models, and tools the model invokes to perform software work.

The term "Codex harness" describes the framework layer that:
1. Constructs prompts for the Responses API
2. Manages tool execution (file operations, shell commands, MCP servers)
3. Enforces sandbox policies and approval workflows
4. Handles context window management and compaction

### Codex Product Family

- **Codex CLI** — Cross-platform local software agent (launched April 2025)
- **Codex Cloud** — Cloud-based agent with pre-loaded repository sandboxes
- **Codex VS Code Extension** — IDE-integrated agent

The Codex CLI is **open source** (Apache 2.0): [github.com/openai/codex](https://github.com/openai/codex)

### Primary Model

Codex uses OpenAI's **o-series reasoning models** (o4-mini, o3, etc.) — models specifically optimized for agentic software tasks with tool use, code generation, and multi-step reasoning.

---

## Architecture: The Agent Loop

The Codex agent loop is the core orchestration logic built in Rust (`codex-rs`):

### Simplified Agent Loop

```
┌─────────────────────────────────────────────────────────┐
│                    CODEX AGENT LOOP                     │
│                                                         │
│  User Input → Build Prompt → Responses API → Output     │
│                                  │                      │
│                          [Tool call?]                   │
│                                  │                      │
│                         Yes ─────┴──── No               │
│                          │              │               │
│                    Execute Tool    Assistant Msg        │
│                          │              │               │
│                    Append Result   Return to User       │
│                          │                              │
│                    Back to API                          │
└─────────────────────────────────────────────────────────┘
```

### Turn Structure

A **turn** in Codex is:
1. User sends a message
2. Codex builds the full prompt (instructions + tools + input history)
3. Sends HTTP POST to Responses API
4. Receives Server-Sent Events (SSE) stream
5. Model may emit tool calls → execute them → append results → re-query
6. Loop continues until model emits final assistant message
7. Control returns to user

**Multi-turn conversation**: Each new user message triggers a new turn. The growing conversation history is included in every subsequent Responses API request.

### Implementation

The Codex agent loop is implemented in Rust in `codex-rs/core/`:
- `codex.rs` — Core agent loop orchestration
- `model_provider_info.rs` — Provider configurations
- `project_doc.rs` — User instructions aggregation
- `skills/` — Skills system implementation

---

## Prompt Construction

### Responses API Request Structure

```json
{
  "instructions": "System/developer message describing sandbox and behavior",
  "tools": [...tool definitions...],
  "input": [...conversation history...]
}
```

### Prompt Assembly (Initial Turn)

Codex constructs the `input` array with these items in order:

**1. Sandbox Description (role=developer)**
Built from Markdown templates bundled in the CLI:
- `workspace_write.md` — describes file write permissions
- `on_request.md` — describes approval policy
- Sandbox mode constraints

**2. Developer Instructions (optional, role=developer)**
From `developer_instructions` in `~/.codex/config.toml`

**3. User Instructions (optional, role=user)**
Aggregated from multiple sources (most specific last):
- `AGENTS.override.md` and `AGENTS.md` in `$CODEX_HOME`
- `AGENTS.override.md`, `AGENTS.md`, or configured fallback files in project directories (from root to cwd)
- Skills preamble and metadata (if skills configured)

**4. User Message**
The actual user's request

### Subsequent Turns

```
[Initial Prompt Items]
[Previous tool calls + results]
[New user message]
```

The prompt grows as the conversation continues — this is **intentional for prompt caching**.

### Model Endpoint Configuration

Codex supports multiple Responses API endpoints:

| Auth Type | Endpoint |
|-----------|---------|
| ChatGPT login | `https://chatgpt.com/backend-api/codex/responses` |
| API key (OpenAI) | `https://api.openai.com/v1/responses` |
| Local (ollama) | `http://localhost:11434/v1/responses` |
| Local (LM Studio) | Local endpoint |
| Azure | Azure-hosted Responses API |

---

## Tool Definitions

### Built-in Codex Tools

**Shell Tool** — The primary tool for file and system operations:

```json
{
  "name": "shell",
  "description": "Execute a shell command in the sandboxed workspace",
  "parameters": {
    "command": "string — the command to execute",
    "timeout": "number — timeout in milliseconds (optional)"
  }
}
```

The shell tool is sandboxed by Codex's policy model. Other tools (MCP server tools) are **not sandboxed by Codex** and must enforce their own guardrails.

### Tool Call Flow

```
Model response: { "type": "function_call", "name": "shell", "arguments": "{\"command\": \"ls src/\"}" }
Codex executes: sandbox.run("ls src/")
Appends result: { "type": "function_call_output", "output": "auth.ts\nuser.ts\n..." }
Re-queries model with updated input
```

### MCP Tools

MCP server tools are registered alongside built-in tools in the `tools` field of the Responses API request. Codex discovered a notable bug where MCP tools had to be enumerated in **consistent order** to avoid breaking prompt caching (fixed in PR #2611).

### Tool Response Format

Tool results are JSON objects appended to the input array:
- `type: "function_call_output"` — result of a shell/function call
- `type: "reasoning"` — model reasoning tokens (preserved for efficiency)

---

## Sandbox Environments

### Local Sandbox (Codex CLI)

The Codex CLI runs tools in a **configurable local sandbox**:

#### Sandbox Modes

**1. `workspace-write` mode (default)**
- Full read access to workspace
- Write access restricted to workspace directory
- Network access depends on configuration

**2. Approval-based mode**
- Model proposes commands before execution
- User must approve or deny each command
- Used in interactive sessions with sensitivity

**3. Full sandbox**
- Strict filesystem restrictions
- Network access restrictions
- Highest isolation

#### Platform-specific Sandboxing

- **macOS**: Uses macOS Sandbox (`sandbox-exec`) or Seatbelt
- **Linux**: Uses seccomp, namespaces, or Docker
- **Windows**: Uses Windows Job Objects

### Sandbox Policy Model

The sandbox policy is described to the model in the `instructions` field:
- What filesystem paths can be read/written
- What network access is allowed
- What shell commands are permitted

This ensures the **model understands its constraints** and doesn't attempt disallowed operations.

### Codex Cloud Sandbox

Codex Cloud runs tasks in **isolated cloud VMs**:
- Each task gets its own VM with your repository pre-loaded
- Fresh sandbox per task
- Full internet access (configurable)
- Persistent during task execution
- Destroyed after completion

---

## Context Window Management

### The Quadratic Growth Problem

The Codex agent loop sends the **complete conversation history** in every Responses API request. This means:
- Turn 1: N tokens
- Turn 2: N + tools + results tokens
- Turn n: grows quadratically

**Why not use `previous_response_id`?**
Codex deliberately avoids server-side conversation state:
1. Keeps requests fully **stateless**
2. Supports **Zero Data Retention (ZDR)** customers
3. Simplifies provider implementation

ZDR customers don't lose reasoning context — encrypted reasoning tokens from previous turns can be decrypted by the server without storing the content.

### Prompt Caching Strategy

Codex is designed to maximize **cache hits** for efficiency:

**Cache hit requires**: Exact prefix match in the prompt

**Static prefix content** (for cache hits):
- Instructions (system/developer messages)
- Tool definitions
- Conversation history

**Things that cause cache misses**:
- Changing available tools mid-conversation
- Changing model
- Changing sandbox configuration or approval mode
- Changing working directory

**MCP tool ordering bug**: Early MCP support failed to enumerate tools in consistent order, causing cache misses on every request (fixed in PR #2611).

**Strategy for mid-conversation config changes**: Instead of modifying earlier messages (which would break the cache), Codex **appends new messages** reflecting the change:
- Sandbox config change → new `role=developer` message
- Working directory change → new `role=user` message

### Automatic Compaction

When context approaches the limit:

**Manual compaction** (original):
```
/compact  — triggers summarization query
```
Uses the existing conversation + summarization instructions → produces a summary as the new context.

**Automatic compaction** (current):
Uses the new `/responses/compact` endpoint:
- Returns a list of items to replace previous input
- Includes `type=compaction` item with encrypted context summary
- Preserves model's latent understanding of the original conversation
- Triggered automatically when `auto_compact_limit` is exceeded

The compacted output includes:
```json
[
  { "type": "compaction", "encrypted_content": "..." },
  { "type": "message", "role": "assistant", "content": "Summary: ..." }
]
```

---

## Permission System

### Approval Modes

Codex supports configurable approval policies for tool calls:

**`on_request`** (default interactive)
- Model proposes each command before execution
- User approves or rejects
- Shown in UI before execution

**`auto-edit`**
- File edits auto-approved
- Commands still require approval

**`full-auto`** (dangerous)
- All tool calls auto-approved
- No human-in-the-loop
- Primarily for CI/CD or isolated environments

**`sandbox-only`**
- All commands sandboxed, no approval needed
- Sandbox provides the safety guarantee

### Approval Configuration

In `~/.codex/config.toml`:
```toml
[approval]
mode = "on_request"  # on_request | auto-edit | full-auto | sandbox-only
```

Or via CLI flags:
```bash
codex --approval-mode auto-edit "Fix lint errors"
codex --full-auto "Run all tests and fix failures"
```

---

## MCP Integration

Codex supports MCP servers as first-class tool extensions:

### MCP Configuration

```toml
# ~/.codex/config.toml
[[mcp_servers]]
name = "filesystem"
command = "mcp-server-filesystem"
args = ["/home/user/projects"]

[[mcp_servers]]
name = "github"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "..." }
```

### MCP in the Prompt

MCP tools are included in the `tools` array of the Responses API request alongside built-in tools. Key considerations:
- MCP tools not sandboxed by Codex — they enforce their own policies
- MCP servers can dynamically update tool lists via `notifications/tools/list_changed`
- Dynamic updates mid-conversation **cause cache misses** — expensive
- Codex attempts to honor list changes without breaking efficiency

---

## Skills System

Skills are reusable workflows for Codex:

```yaml
# ~/.codex/skills/deploy.yaml
name: deploy-staging
description: "Deploy the current branch to staging environment"
commands:
  - npm run build
  - docker build -t app:latest .
  - kubectl apply -f k8s/staging/
```

### Skills in Context

At the start of a conversation, Codex includes:
1. A preamble about skills
2. Skill metadata (name, description) for each configured skill
3. Instructions on how to invoke skills

The model can choose to invoke a skill when the user's request matches.

---

## Performance Optimizations

### 1. Prompt Caching

Static content (instructions, tools, history) placed at prompt prefix for cache hit maximization. Cache hits make sampling **linear rather than quadratic**.

### 2. Streaming SSE

Responses API returns Server-Sent Events for incremental output:
- `response.output_text.delta` — streaming text
- `response.output_item.added` — new tool call/message
- `response.output_item.done` — tool call/message complete

This enables real-time UI updates while the model processes.

### 3. Reasoning Token Preservation

`type=reasoning` items are preserved in the conversation input across turns. This allows the model to benefit from prior reasoning without re-deriving it, even under ZDR constraints (via `encrypted_content`).

### 4. Context Window Monitoring

Codex tracks token count and triggers compaction before hitting the limit, preventing context overflow errors.

---

## Codex CLI Usage

### Installation

```bash
# npm
npm install -g @openai/codex

# From source (Rust)
cargo install codex-cli
```

### Basic Usage

```bash
# Interactive mode
codex

# Single prompt (non-interactive)
codex "Explain the authentication flow in this codebase"

# With approval mode
codex --approval-mode auto-edit "Fix all TypeScript errors"

# Using a specific model
codex --model o4-mini "Refactor the database module"

# Using local model (ollama)
codex --oss "Write unit tests for user.ts"
```

### AGENTS.md Support

Codex looks for AGENTS.md files for project context:
- `$CODEX_HOME/AGENTS.override.md` (highest priority)
- `$CODEX_HOME/AGENTS.md`
- Project root → cwd hierarchy `AGENTS.md` files

This mirrors Claude Code's `CLAUDE.md` pattern for persistent project memory.

### Config File

```toml
# ~/.codex/config.toml

[model]
provider = "openai"
name = "o4-mini"

[approval]
mode = "on_request"

[sandbox]
mode = "workspace-write"

developer_instructions = """
Always write tests alongside new code.
Use TypeScript strict mode.
"""

[[mcp_servers]]
name = "github"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
```

---

## Codex Cloud (Web Agent)

Codex Cloud extends the harness to cloud-hosted task execution:

### How It Works

1. User describes a task in the Codex web UI
2. A cloud VM is provisioned with your repository pre-loaded
3. The Codex harness runs on the VM
4. Agent executes the task autonomously
5. Changes are proposed as a pull request
6. User reviews and merges

### Key Features

- **Parallel tasks**: Multiple tasks run simultaneously in isolated VMs
- **No local setup required**: Works on any repo without a local clone
- **Async execution**: Tasks run in background, notify on completion
- **PR integration**: Changes land as reviewable PRs

### Use Cases

```
"Write a comprehensive test suite for the auth module"
"Fix all TypeScript errors in the codebase"
"Migrate from Express to Fastify"
"Add OpenTelemetry tracing to all API routes"
```

---

## Technical Implementation Details

### Rust Architecture (codex-rs)

```
codex-rs/
├── core/
│   ├── codex.rs           # Main agent loop
│   ├── model_provider_info.rs  # API endpoints config
│   ├── project_doc.rs     # AGENTS.md aggregation
│   └── skills/            # Skills system
│       ├── model.rs       # Skill metadata
│       └── render.rs      # Skill rendering
├── protocol/
│   └── prompts/
│       └── permissions/   # Permission prompt templates
│           ├── sandbox_mode/
│           │   └── workspace_write.md
│           └── approval_policy/
│               └── on_request.md
└── codex-api/
    └── sse/
        └── responses.rs   # SSE stream consumer
```

### Responses API vs Chat Completions

Codex uses the **Responses API** (not Chat Completions):
- Designed specifically for agentic/tool-use patterns
- Supports `previous_response_id` for stateful conversations
- Supports `/responses/compact` for context compaction
- Returns SSE stream with typed events

### Zero Data Retention (ZDR) Support

For enterprises with ZDR requirements:
- No `previous_response_id` used (stateless requests)
- Reasoning tokens included as `encrypted_content` in input
- Server can decrypt with customer's key to provide continuity
- Customer data never persisted server-side

PRs #642 and #1641 in the Codex repository implemented ZDR support.

---

## Comparison with Other Harnesses

| Feature | Codex CLI | Claude Code | OpenCode | Aider | Cline |
|---------|-----------|-------------|----------|-------|-------|
| **Open Source** | ✅ Apache 2 | ❌ | ✅ MIT | ✅ Apache 2 | ✅ Apache 2 |
| **Primary Model** | o-series | Claude | Any | Any | Any |
| **Written In** | Rust + TS | TypeScript | Go + TS | Python | TypeScript |
| **Responses API** | ✅ | Uses Messages API | Uses LiteLLM | Uses LLM APIs | Uses LLM APIs |
| **Sandbox** | ✅ Platform-native | ✅ Optional | ❌ | ❌ | ❌ |
| **MCP Support** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Skills** | ✅ | ✅ | Custom cmds | ❌ | ❌ |
| **Cloud Mode** | ✅ Codex Cloud | ✅ claude.ai/code | ❌ | ❌ | ❌ |
| **AGENTS.md** | ✅ | ✅ (CLAUDE.md) | ✅ | ❌ | ❌ |
| **Approval Modes** | 4 modes | 6 modes | 3 modes | Minimal | Per-action |
| **Reasoning Models** | ✅ Native | Sonnet/Opus | Via API | Configurable | Via API |
| **ZDR Support** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Prompt Caching** | ✅ Optimized | ✅ | ✅ | ✅ | ✅ |

### Codex vs. Claude Code

Both use similar agentic patterns (tool loops, AGENTS/CLAUDE.md memory, MCP), but differ in:
- **Model allegiance**: Codex → OpenAI o-series; Claude Code → Anthropic Claude
- **Implementation**: Codex in Rust (performance-critical); Claude Code in TypeScript
- **Permission system**: Claude Code has more granular modes; Codex has simpler approval policies
- **Enterprise**: Claude Code has more enterprise features (managed settings, SSO, analytics)

### Codex vs. Aider

- Codex is optimized for OpenAI's reasoning models; Aider is model-agnostic
- Codex has better MCP and skills integration
- Aider has deeper git integration and edit format specialization
- Aider has comprehensive LLM benchmark leaderboards; Codex does not publish similar benchmarks

---

## Sources

1. [Unrolling the Codex Agent Loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
2. [Unlocking the Codex Harness](https://openai.com/index/unlocking-the-codex-harness/)
3. [Introducing Codex](https://openai.com/index/introducing-codex/)
4. [openai/codex GitHub Repository](https://github.com/openai/codex)
5. [Codex CLI Documentation](https://developers.openai.com/codex/cli)
6. [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
7. [ZenML LLMOps: Codex CLI Architecture](https://www.zenml.io/llmops-database/building-production-ready-ai-agents-openai-codex-cli-architecture-and-agent-loop-design)

---

*Last updated: March 2026*
