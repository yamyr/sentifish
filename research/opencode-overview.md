# OpenCode AI Coding Agent — Comprehensive Overview

> Research compiled: March 2026  
> Sources: opencode.ai, GitHub (opencode-ai/opencode), official documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Project History & Open Source Status](#project-history--open-source-status)
3. [Architecture](#architecture)
4. [Key Features](#key-features)
5. [Tool System](#tool-system)
6. [Model Support](#model-support)
7. [Configuration](#configuration)
8. [MCP Integration](#mcp-integration)
9. [LSP Integration](#lsp-integration)
10. [Multi-Session Support](#multi-session-support)
11. [CLI & Interfaces](#cli--interfaces)
12. [Technical Details](#technical-details)
13. [Comparison with Other Harnesses](#comparison-with-other-harnesses)
14. [Sources](#sources)

---

## Overview

OpenCode is an open-source AI coding agent built for the terminal, IDE, and desktop. It bills itself as "The open source AI coding agent" and has grown to significant community adoption — reportedly over 120,000 GitHub stars, 800 contributors, and 5 million monthly developers as of early 2026.

The core value proposition:
- **Privacy-first**: No code or context stored on OpenCode servers
- **Multi-provider**: Works with 75+ LLM providers through Models.dev
- **Multi-interface**: Terminal TUI, desktop app, IDE extension
- **Multi-session**: Run parallel agents on the same project
- **Open source**: MIT-licensed

OpenCode is distinct from many proprietary coding tools because it stores all sessions locally (SQLite), respects user privacy, and is fully extensible through MCP servers and LSP integrations.

---

## Project History & Open Source Status

### GitHub Repos

There are two notable OpenCode repositories:

1. **`opencode-ai/opencode`** — The Go-based terminal TUI (older project)  
   - Originally built as a powerful terminal-based AI coding agent
   - Uses Bubble Tea (charmbracelet) for TUI
   - MIT Licensed
   - **Note**: This repository was eventually archived; the project continued as [Crush](https://github.com/charmbracelet/crush) by the original author and the Charm team

2. **`anomalyco/opencode`** — The current active OpenCode platform  
   - Available at opencode.ai
   - Full platform: terminal, desktop, IDE extension
   - 120K+ GitHub stars
   - Continues active development

### Open Source Status

- **License**: MIT (both repositories)
- **Contributions**: 800+ contributors (anomalyco/opencode)
- **Activity**: 10,000+ commits
- **Funding**: Supported by OpenCode Zen (paid curated model tier) while keeping the core agent free

---

## Architecture

### Core Components

The `opencode-ai/opencode` (Go-based) architecture is modular:

```
opencode/
├── cmd/                    # CLI interface (Cobra)
├── internal/
│   ├── app/               # Core application services
│   ├── config/            # Configuration management
│   ├── db/                # SQLite database operations & migrations
│   ├── llm/               # LLM providers and tools integration
│   ├── tui/               # Terminal UI (Bubble Tea)
│   ├── logging/           # Logging infrastructure
│   ├── message/           # Message handling
│   ├── session/           # Session management
│   └── lsp/               # Language Server Protocol integration
```

### Agent Architecture

OpenCode uses a **multi-agent architecture** with configurable sub-roles:

```json
{
  "agents": {
    "coder": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 5000
    },
    "task": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 5000
    },
    "title": {
      "model": "claude-3.7-sonnet",
      "maxTokens": 80
    }
  }
}
```

- **Coder agent**: Primary coding/editing tasks
- **Task agent**: Sub-tasks delegated by the coder
- **Title agent**: Generates session titles (lightweight)

### Data Layer

- **SQLite** for persistent session storage
- Sessions stored locally in `.opencode/` directory
- All conversation history, tool calls, and file states are persisted

### Agentic Loop

OpenCode's agentic loop:
1. User sends a prompt
2. The configured model receives the prompt with context (file contents, session history, tool definitions)
3. Model generates a response, potentially with tool calls
4. OpenCode executes tool calls (file ops, shell commands, web fetch)
5. Tool results feed back into the model
6. Loop continues until model produces final assistant message or user interrupts

**Plan mode**: OpenCode supports a read-only "Plan mode" where file modifications and commands are disabled — the agent can only analyze and propose a plan for user review.

---

## Key Features

### 1. LSP-Enabled Context

OpenCode automatically loads Language Server Protocol (LSP) integrations for the project language. This means the AI receives:
- Type diagnostics
- Linter errors
- Syntax errors after file edits

The LSP integration allows OpenCode to **proactively fix** issues it creates without user prompting.

### 2. Multi-Session / Parallel Agents

Developers can start **multiple agents in parallel on the same project**. Each session is independent with its own context window and history. This enables:
- Running competing approaches simultaneously
- Isolating different feature branches
- Parallel exploration

### 3. Share Links

Any OpenCode session can be shared via a link (e.g., `opencode.ai/s/4XP1fce5`). This is useful for:
- Debugging with teammates
- Sharing AI-assisted workflows
- Reviewing what changes the agent made

### 4. GitHub Copilot Integration

OpenCode supports GitHub Copilot authentication — users can log in with GitHub and use their existing Copilot subscription (including ChatGPT Plus/Pro accounts).

### 5. Auto-Compact

OpenCode monitors token usage and automatically compacts/summarizes conversations when approaching the context limit (default threshold: 95%). This creates a new session from a summary, preserving continuity without losing context.

### 6. AGENTS.md Memory

Like Claude Code, OpenCode supports an `AGENTS.md` (or `OpenCode.md`) file in project roots, which contains project-specific instructions loaded at session start. This persistent memory helps the agent understand project conventions, coding patterns, and architecture without repeated re-explanation.

### 7. Custom Commands

Custom commands are predefined prompts stored as Markdown files:
- **User commands**: `~/.config/opencode/commands/*.md`
- **Project commands**: `.opencode/commands/*.md`

Commands support named argument placeholders (`$ISSUE_NUMBER`, `$AUTHOR_NAME`) for parameterized workflows.

### 8. Undo/Redo

Sessions support `/undo` and `/redo` commands to revert or re-apply changes made during a session.

---

## Tool System

OpenCode provides the AI model with a comprehensive tool suite:

### File Operation Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `glob` | Find files by pattern | `pattern` (required), `path` (optional) |
| `grep` | Search file contents | `pattern`, `path`, `include`, `literal_text` |
| `ls` | List directory contents | `path`, `ignore` |
| `view` | View file contents | `file_path`, `offset`, `limit` |
| `write` | Write files | `file_path`, `content` |
| `edit` | Edit files | Various edit parameters |
| `patch` | Apply patches | `file_path`, `diff` |
| `diagnostics` | Get LSP diagnostics | `file_path` |

### Execution Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `bash` | Execute shell commands | `command`, `timeout` |
| `fetch` | Fetch from URLs | `url`, `format`, `timeout` |
| `sourcegraph` | Search code across public repos | `query`, `count`, `context_window` |
| `agent` | Run sub-tasks with a sub-agent | `prompt` |

### Permission System

OpenCode uses a permission prompt system:
- `a` — Allow once
- `A` — Allow for session
- `d` — Deny

The permission system is visible in the TUI at each tool invocation, giving users explicit control over what the agent can do.

---

## Model Support

OpenCode supports 75+ LLM providers through Models.dev, including:

### Anthropic
- Claude 4 Sonnet / Opus
- Claude 3.7 Sonnet (with Thinking)
- Claude 3.5 Sonnet / Haiku
- Claude 3 Haiku / Opus

### OpenAI
- GPT-4.1 family (gpt-4.1, mini, nano)
- GPT-4o / mini
- O1 / O1-pro / O1-mini
- O3 / O3-mini
- O4 Mini

### Google
- Gemini 2.5 Pro / Flash
- Gemini 2.0 Flash / Flash Lite

### Groq
- Llama 4 Maverick (17b)
- Llama 4 Scout (17b)
- QWEN QWQ-32b
- Deepseek R1 distill
- Llama 3.3 70b

### OpenRouter
- Any model available on OpenRouter

### GitHub Copilot
- All models in Copilot subscription

### Local / Self-hosted
- Ollama (`LOCAL_ENDPOINT=http://localhost:11434/v1`)
- LM Studio
- Any OpenAI-compatible API

### OpenCode Zen (Curated Tier)
OpenCode Zen provides a curated set of models specifically tested and benchmarked for coding agent performance. This is the commercial offering that funds OpenCode's development.

---

## Configuration

### Configuration File Locations

OpenCode searches for configuration in:
1. `$HOME/.opencode.json`
2. `$XDG_CONFIG_HOME/opencode/.opencode.json`
3. `./.opencode.json` (local directory — project-level override)

### Full Configuration Schema

```json
{
  "data": {
    "directory": ".opencode"
  },
  "providers": {
    "openai": { "apiKey": "...", "disabled": false },
    "anthropic": { "apiKey": "...", "disabled": false },
    "copilot": { "disabled": false }
  },
  "agents": {
    "coder": { "model": "claude-3.7-sonnet", "maxTokens": 5000 },
    "task": { "model": "claude-3.7-sonnet", "maxTokens": 5000 },
    "title": { "model": "claude-3.7-sonnet", "maxTokens": 80 }
  },
  "shell": {
    "path": "/bin/bash",
    "args": ["-l"]
  },
  "mcpServers": {
    "example": {
      "type": "stdio",
      "command": "path/to/mcp-server",
      "env": [],
      "args": []
    }
  },
  "lsp": {
    "go": { "disabled": false, "command": "gopls" },
    "typescript": { "disabled": false, "command": "typescript-language-server", "args": ["--stdio"] }
  },
  "debug": false,
  "debugLSP": false,
  "autoCompact": true
}
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude models |
| `OPENAI_API_KEY` | OpenAI models |
| `GEMINI_API_KEY` | Google Gemini |
| `GITHUB_TOKEN` | GitHub Copilot |
| `GROQ_API_KEY` | Groq models |
| `LOCAL_ENDPOINT` | Self-hosted models |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock |
| `SHELL` | Default shell for bash tool |

---

## MCP Integration

OpenCode implements the **Model Context Protocol (MCP)** for extensibility:

### Supported Transport Types
- **Stdio**: Communicate via stdin/stdout
- **SSE**: Server-Sent Events over HTTP

### MCP Configuration Example

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "mcp-server-filesystem",
      "args": ["/home/user/projects"]
    },
    "web": {
      "type": "sse",
      "url": "https://mcp.example.com",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

### MCP Tool Discovery

MCP tools are automatically discovered and made available alongside built-in tools. They follow the same permission model — each MCP tool invocation requires user approval.

---

## LSP Integration

Language Server Protocol integration gives OpenCode code intelligence:

### Supported Languages (configurable)
- Go (gopls)
- TypeScript/JavaScript (typescript-language-server)
- Python (pyright, pylsp)
- Rust (rust-analyzer)
- Any LSP-compatible language

### LSP Capabilities Exposed to Agent

Currently, only **diagnostics** are exposed to the AI model via the `diagnostics` tool:
- Compilation errors
- Type errors
- Linter warnings

The underlying LSP client supports the full protocol (completions, hover, definitions, references) but these are not yet exposed to the agent.

---

## Multi-Session Support

OpenCode's multi-session system:

- **Keyboard**: `Ctrl+N` (new session), `Ctrl+A` (switch session)
- **Session dialog**: Shows all active sessions
- **Isolation**: Each session has its own context window
- **Persistence**: All sessions stored in SQLite locally
- **Parallel execution**: Multiple agents can work on the same project simultaneously

---

## CLI & Interfaces

### Installation

```bash
# Install script
curl -fsSL https://opencode.ai/install | bash

# npm
npm install -g opencode-ai

# Homebrew
brew install anomalyco/tap/opencode

# Go
go install github.com/opencode-ai/opencode@latest
```

### CLI Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help |
| `--debug` | `-d` | Enable debug mode |
| `--cwd` | `-c` | Set working directory |
| `--prompt` | `-p` | Non-interactive single prompt |
| `--output-format` | `-f` | Output format: `text` or `json` |
| `--quiet` | `-q` | Hide spinner |

### Non-Interactive Mode

```bash
# Run a single prompt
opencode -p "Explain the use of context in Go"

# JSON output format (useful for scripting)
opencode -p "List all exported functions in main.go" -f json

# Quiet mode (no spinner, good for piping)
opencode -p "Fix lint errors in *.go" -q
```

### Available Interfaces

1. **Terminal TUI** — Primary interface, Vim-inspired keybindings
2. **Desktop App** — Native desktop application
3. **IDE Extension** — VS Code and JetBrains plugins

---

## Technical Details

### Storage

- **Database**: SQLite via `.opencode/` directory
- **Sessions**: Stored with full message history, tool calls, and results
- **Context compaction**: Automatic summarization at 95% context window usage

### Context Management

OpenCode's auto-compact feature:
1. Monitors token count during conversation
2. At 95% of model's context window: triggers summarization
3. Creates a new session with the summary as context
4. Continues seamlessly without context errors

### Build Requirements

- Go 1.24.0 or higher
- SQLite (bundled)

### Performance Considerations

- **Vim-like editor** for message composition
- **External editor support** (opens `$EDITOR`)
- **Spinner** for model processing indication (suppressible with `-q`)
- **Streaming output** supported for real-time feedback

---

## Comparison with Other Harnesses

| Feature | OpenCode | Claude Code | Aider | Cursor | Cline |
|---------|----------|-------------|-------|--------|-------|
| **Interface** | Terminal TUI | Terminal CLI | Terminal CLI | IDE (VS Code) | IDE (VS Code) |
| **Open Source** | ✅ MIT | ❌ Proprietary | ✅ Apache 2 | ❌ Proprietary | ✅ Apache 2 |
| **Multi-session** | ✅ Built-in | ✅ (worktrees) | ❌ | ✅ | ❌ |
| **LSP Integration** | ✅ Diagnostics | ✅ Full (plugins) | ❌ | ✅ Full | ❌ |
| **MCP Support** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Git Integration** | Limited | ✅ Native | ✅ Deep | ✅ | ✅ |
| **Permission Model** | Session-based | Tiered + managed | Minimal | Session-based | Per-action |
| **Model Providers** | 75+ | Anthropic + proxies | 100+ | Claude/OpenAI/Gemini | 10+ |
| **Local Models** | ✅ Ollama/LMStudio | ✅ | ✅ Ollama | ✅ | ✅ |
| **Context Management** | Auto-compact | Auto-compact + manual | Manual | Auto | Manual |
| **Sub-agents** | ✅ `agent` tool | ✅ Subagents | ❌ Architect mode | ✅ Multi-agent | ❌ |

### Strengths vs. Other Tools

**vs. Claude Code:**
- OpenCode is fully open source; Claude Code is proprietary
- OpenCode supports more model providers out of the box
- Claude Code has deeper enterprise features (managed settings, GitHub Actions)

**vs. Aider:**
- OpenCode has a richer TUI experience
- Aider has a more developed benchmark leaderboard and git-native workflow
- OpenCode supports MCP; Aider does not natively

**vs. Cursor:**
- OpenCode is terminal-native; Cursor is IDE-native
- Cursor has a more polished multi-agent management UI
- OpenCode is open source; Cursor is proprietary

**vs. Cline:**
- OpenCode targets terminal users; Cline targets VS Code users
- Both support MCP; both are open source
- Cline has better browser automation integration

---

## Sources

1. [OpenCode Official Website](https://opencode.ai/)
2. [opencode-ai/opencode GitHub](https://github.com/opencode-ai/opencode) — Go-based terminal agent
3. [anomalyco/opencode GitHub](https://github.com/anomalyco/opencode) — Current active platform
4. [OpenCode Documentation](https://opencode.ai/docs)
5. [OpenCode GitHub Releases](https://github.com/anomalyco/opencode/releases)
6. [charmbracelet/crush GitHub](https://github.com/charmbracelet/crush) — Continuation of opencode-ai/opencode
7. Models.dev — LLM provider directory used by OpenCode

---

*Last updated: March 2026*
