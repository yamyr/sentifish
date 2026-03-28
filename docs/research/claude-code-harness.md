# Claude Code — Anthropic CLI Agent Harness

> Research compiled: March 2026  
> Sources: code.claude.com docs, Anthropic engineering blog, official tools reference

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture: The Agentic Loop](#architecture-the-agentic-loop)
3. [Tool Definitions](#tool-definitions)
4. [Permission System](#permission-system)
5. [Permission Modes](#permission-modes)
6. [Session Management](#session-management)
7. [Context Window Management](#context-window-management)
8. [Memory System (CLAUDE.md)](#memory-system-claudemd)
9. [MCP Integration](#mcp-integration)
10. [Sub-agents & Orchestration](#sub-agents--orchestration)
11. [Hooks System](#hooks-system)
12. [Skills System](#skills-system)
13. [Execution Environments](#execution-environments)
14. [Enterprise Features](#enterprise-features)
15. [Headless / Programmatic Mode](#headless--programmatic-mode)
16. [CLI Reference](#cli-reference)
17. [How It Agents: Deep Dive](#how-it-agents-deep-dive)
18. [Comparison with Other Harnesses](#comparison-with-other-harnesses)
19. [Sources](#sources)

---

## Overview

Claude Code is Anthropic's official agentic coding tool — an **agentic harness** built around Claude models. It runs in the terminal, IDE extensions (VS Code, JetBrains), desktop app, and browser. The harness provides Claude with tools, context management, permission control, and an execution environment that transforms the language model into a capable multi-step coding agent.

Claude Code is not open source; it is Anthropic's commercial product with a free tier and paid plans.

### Key Facts

- Available as: CLI (`claude`), VS Code extension, JetBrains extension, Desktop app, claude.ai/code
- Models: Claude family (Sonnet, Opus, Haiku)
- Permission model: Tiered with 6+ modes
- Storage: Local conversation history
- Enterprise: Team/Enterprise plans with managed settings, analytics, SSO

---

## Architecture: The Agentic Loop

Claude Code acts as the **agentic harness** — it provides:
1. **Tools** that make Claude actionable (vs. text-only responses)
2. **Context management** (what gets loaded, when, and how it's compacted)
3. **Permission enforcement** (what actions require approval)
4. **Execution environment** (local, cloud, or remote-controlled)

### Three-Phase Loop

When given a task, Claude Code cycles through:

```
┌──────────────────────────────────────────────────────────┐
│                    THE AGENTIC LOOP                      │
│                                                          │
│  Your Prompt → Gather Context → Take Action → Verify    │
│                     ↑                              │     │
│                     └──────── iterate ─────────────     │
│                     (until task complete or interrupted) │
└──────────────────────────────────────────────────────────┘
```

**Phase 1: Gather Context**
- Read files, search codebase, check git state
- Review CLAUDE.md instructions and auto memory
- Load skill definitions

**Phase 2: Take Action**
- Edit files, run commands, write new files
- Spawn subagents for delegated work
- Interact with MCP-connected services

**Phase 3: Verify Results**
- Run tests, check lint/compiler errors
- Read command output
- Review LSP diagnostics

The loop is driven by **tool calls**: each tool call returns information that feeds back into Claude's reasoning for the next step. This continues until Claude produces a final assistant message (no more tool calls).

---

## Tool Definitions

Claude Code provides a comprehensive built-in tool set. These are the exact tool names used in permission rules:

### Core Tools

| Tool | Permission Required | Description |
|------|---------------------|-------------|
| `Agent` | No | Spawn a subagent with its own context window |
| `AskUserQuestion` | No | Ask multiple-choice questions to clarify |
| `Bash` | **Yes** | Execute shell commands |
| `Edit` | **Yes** | Make targeted file edits |
| `Glob` | No | Find files by pattern |
| `Grep` | No | Search file contents with regex |
| `LSP` | No | Code intelligence via language servers |
| `NotebookEdit` | **Yes** | Modify Jupyter notebook cells |
| `PowerShell` | **Yes** | Execute PowerShell commands (Windows) |
| `Read` | No | Read file contents |
| `WebFetch` | **Yes** | Fetch content from URLs |
| `WebSearch` | **Yes** | Perform web searches |
| `Write` | **Yes** | Create or overwrite files |

### Orchestration Tools

| Tool | Description |
|------|-------------|
| `CronCreate` | Schedule recurring/one-shot prompts in session |
| `CronDelete` | Cancel a scheduled task |
| `CronList` | List all session scheduled tasks |
| `EnterPlanMode` | Switch to plan mode (read-only analysis) |
| `ExitPlanMode` | Present plan for approval and exit plan mode |
| `EnterWorktree` | Create isolated git worktree and switch |
| `ExitWorktree` | Exit worktree session |

### Task Management Tools

| Tool | Description |
|------|-------------|
| `TaskCreate` | Create a task in the task list |
| `TaskGet` | Get details for a specific task |
| `TaskList` | List all tasks with status |
| `TaskUpdate` | Update task status, dependencies |
| `TaskStop` | Kill a running background task |
| `TodoWrite` | Manage session task checklist (non-interactive mode) |

### MCP Tools

| Tool | Description |
|------|-------------|
| `ListMcpResourcesTool` | List resources from MCP servers |
| `ReadMcpResourceTool` | Read a specific MCP resource by URI |
| `ToolSearch` | Search for and load deferred MCP tools |

### Skill Tool

| Tool | Description |
|------|-------------|
| `Skill` | Execute a skill within the main conversation |

### Tool Call Example: Bash

```json
{
  "name": "Bash",
  "input": {
    "command": "npm run test -- --coverage",
    "timeout": 30000
  }
}
```

### Bash Tool Behavior

- Each Bash command runs in a **separate process**
- **Working directory persists** across commands
- **Environment variables do NOT persist** (each command is isolated)
- Use `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1` to reset cwd after each command

---

## Permission System

Claude Code uses a **tiered permission system** to balance power and safety.

### Permission Tiers by Tool Type

| Tool type | Example | Approval required | "Yes, don't ask again" behavior |
|-----------|---------|-------------------|--------------------------------|
| Read-only | File reads, Grep | **No** | N/A |
| Bash commands | Shell execution | **Yes** | Permanently per project + command |
| File modification | Edit/Write files | **Yes** | Until session end |

### Permission Rule Syntax

Rules follow the format `Tool` or `Tool(specifier)`:

**Match all uses:**
```
Bash        — matches all Bash commands
WebFetch    — matches all fetch requests
Read        — matches all file reads
```

**Specifier-based rules:**
```
Bash(npm run build)          — exact command match
Bash(npm run *)              — prefix glob
Bash(git * main)             — wildcard in middle
Read(./.env)                 — specific file
WebFetch(domain:example.com) — domain restriction
Edit(/src/**/*.ts)           — path pattern
```

**Permission rule precedence**: `deny → ask → allow` — deny always wins.

### Example settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Bash(git status)",
      "Bash(* --version)",
      "Read"
    ],
    "deny": [
      "Bash(git push *)",
      "WebFetch(domain:evil.com)",
      "Read(~/.ssh/*)"
    ]
  }
}
```

### Settings Precedence

1. **Managed settings** — Cannot be overridden (enterprise policy)
2. **Command line arguments** — Session-level overrides
3. **Local project settings** (`.claude/settings.local.json`)
4. **Shared project settings** (`.claude/settings.json`)
5. **User settings** (`~/.claude/settings.json`)

---

## Permission Modes

Claude Code supports 6 permission modes:

### 1. `default` (Standard)
Prompts for permission on first use of each tool. Most explicit user control.

### 2. `acceptEdits`
Automatically accepts file edit permissions for the session without prompting. Commands still require approval.

### 3. `plan`
**Plan Mode** — Claude can analyze files and propose plans but cannot modify files or execute commands. Read-only analysis phase.

### 4. `auto` (Research Preview)
Auto-approves tool calls with **background safety checks** via a classifier model. The classifier:
- Verifies actions align with the user's request
- Blocks potential data exfiltration
- Trusts the working directory and configured git remotes

Configurable via `autoMode.environment` in settings:
```json
{
  "autoMode": {
    "environment": [
      "Organization: Acme Corp. Software development.",
      "Source control: github.com/acme-corp",
      "Trusted domains: *.internal.acme.com"
    ]
  }
}
```

### 5. `dontAsk`
Auto-denies tools unless explicitly pre-approved via `/permissions` or `permissions.allow` rules. Maximum lockdown with explicit whitelist.

### 6. `bypassPermissions`
Skips all permission prompts. **Dangerous — only for isolated environments (containers/VMs).**

Protected paths still prompt even in bypassPermissions:
- `.git/` directory
- `.claude/`
- `.vscode/`
- `.idea/`

> Enterprise admins can disable bypassPermissions with `disableBypassPermissionsMode: "disable"` in managed settings.

### Switching Modes

- **CLI**: `Shift+Tab` cycles through modes
- **VS Code**: Mode selector in UI
- **Config**: Set `defaultMode` in settings.json

---

## Session Management

### Session Types

**Local sessions:**
- Stored in `.claude/` directory
- Full conversation history (messages, tool calls, results)
- Each session tied to a working directory

**Cloud sessions:**
- Run on Anthropic-managed VMs
- Work on repos without local clone
- Web-accessible at claude.ai/code

### Session Commands

```bash
# Start a new session
claude

# Resume last session
claude --continue

# Resume a specific session (interactive chooser)
claude --resume

# Fork a session (new ID, same history)
claude --continue --fork-session
```

### Session Isolation

- Each session starts with a **fresh context window**
- Previous session history not loaded by default
- **Auto memory** allows Claude to persist learnings across sessions
- Session-scoped permissions do NOT carry over on resume

### Working with Branches

- Sessions are directory-tied — switching branches shows new branch files
- For parallel work: use **git worktrees** (separate directories, separate sessions)

```bash
git worktree add ../feature-branch feature-branch
cd ../feature-branch
claude  # New session, isolated branch
```

---

## Context Window Management

### What Loads at Session Start

1. **CLAUDE.md** — Project/user instructions
2. **Auto memory** (first 200 lines or 25KB of MEMORY.md)
3. **Skill descriptions** (not full content — loaded on demand)
4. **Session history** (if resuming)
5. **System instructions** from harness

### Automatic Compaction

When context fills up:
1. **Older tool outputs** cleared first
2. **Conversation summarized** if needed
3. Key requests and code snippets preserved
4. Early instructions may be lost → **use CLAUDE.md for persistent rules**

### Manual Context Control

```bash
# Check what's using context space
/context

# Manually compact with focus
/compact focus on the API changes
```

### Cost-Effective Patterns

- Skills load on demand (descriptions only at start)
- Subagents have isolated context (don't bloat main session)
- Use `/compact` proactively before context gets full
- Set `disable-model-invocation: true` on rarely-used skills

---

## Memory System (CLAUDE.md)

### CLAUDE.md File

The primary memory mechanism — a markdown file containing:
- Project conventions and coding standards
- Architecture overview
- Preferred patterns and anti-patterns
- Compact Instructions (preserved during compaction)

### File Hierarchy

Claude looks for CLAUDE.md files in:
1. `~/.claude/CLAUDE.md` — User-level global instructions
2. `.claude/CLAUDE.md` or `CLAUDE.md` in project root
3. Subdirectory CLAUDE.md files (for monorepos)

### Auto Memory

Claude automatically accumulates learnings in `MEMORY.md`:
- Project patterns observed during work
- User preferences
- Discovered conventions

The first 200 lines / 25KB loaded at session start.

### Initialize a Project

```bash
/init
```
This command walks Claude through analyzing the project and creating CLAUDE.md with:
- Project structure
- Build/test commands
- Key architecture notes
- Coding conventions

---

## MCP Integration

Claude Code supports the Model Context Protocol for extending capabilities:

### MCP Tool Permission Syntax

```
mcp__puppeteer                    — all tools from "puppeteer" server
mcp__puppeteer__*                 — same with wildcard
mcp__puppeteer__puppeteer_navigate — specific tool
```

### MCP Configuration

In `.claude/settings.json`:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "mcp-server-filesystem",
      "args": ["/home/user/projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "..." }
    }
  }
}
```

### MCP Tool Search

For large MCP servers with many tools, Claude Code supports **deferred tool loading**:
- Tool names available in context, but definitions not loaded until needed
- Use `ToolSearch` to find and load specific tools on demand
- Dramatically reduces context usage for large tool catalogs

---

## Sub-agents & Orchestration

### Creating Subagents

Claude Code supports spawning **specialized subagents** via `.claude/agents/`:

```yaml
# .claude/agents/code-reviewer.md
---
name: CodeReviewer
description: Specialized agent for reviewing code quality and security
tools: [Read, Glob, Grep]
---

You are a senior code reviewer. Focus on:
- Security vulnerabilities
- Performance issues
- Code quality and maintainability
```

### Subagent Isolation

- Each subagent gets its own **fresh context window**
- Subagent's work does NOT bloat the main session
- When done, returns a summary to the parent session
- Tool access restricted to declared tools

### Agent Teams

```bash
# In settings.json
{
  "agentTeams": {
    "codeReview": ["Explore", "Plan", "CodeReviewer"],
    "bugFix": ["Explore", "Plan", "Implement", "Test"]
  }
}
```

### Multi-Agent Patterns

**Fan-out**: Main agent spawns multiple subagents for parallel work
**Pipeline**: Subagent A's output feeds to subagent B
**Orchestration**: Main agent coordinates specialist subagents

---

## Hooks System

Hooks let you run shell commands automatically on Claude Code events:

### Hook Events

| Event | Fires When |
|-------|-----------|
| `PreToolUse` | Before any tool is invoked |
| `PostToolUse` | After a tool completes |
| `SessionStart` | Session begins |
| `SessionEnd` | Session ends |
| `Notification` | Claude wants to notify you |

### Hook Exit Codes

- **Exit 0**: Continue normally
- **Exit 1**: Warn Claude (non-blocking)
- **Exit 2**: Block the tool call (blocks even if `allow` rule matches)

### Example Hooks

**Auto-format on file edit:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "prettier --write ${CLAUDE_TOOL_FILE_PATH}"
      }
    ]
  }
}
```

**Block sensitive file access:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "command": "block-sensitive-files.sh"
      }
    ]
  }
}
```

---

## Skills System

Skills extend Claude Code with custom workflows:

```yaml
# .claude/skills/deploy.md
---
name: deploy
description: Deploy the application to staging
disable-model-invocation: false
---

# Deploy Workflow

Run the following to deploy:

!`npm run build`
!`docker build -t app:latest .`
!`kubectl apply -f k8s/staging/`
```

### Skill Features

- Skills load descriptions at session start, full content on demand
- `disable-model-invocation: true`: Manual invocation only, keeps description out of context
- Shell blocks (`` !`command` ``) run in the configured shell
- Can specify `shell: powershell` in frontmatter for Windows

---

## Execution Environments

### 1. Local Execution

Default — runs on your machine with full access to local tools, environment, and files.

### 2. Cloud Execution (claude.ai/code)

Runs on Anthropic-managed VMs:
- Offload tasks without local clone
- Secure, isolated environment
- Access via web browser

### 3. Remote Control

Local machine, controlled from browser:
- Session runs locally
- UI accessible from phone/tablet/browser
- Works with claude.ai/code and mobile app

### 4. GitHub Actions Integration

```yaml
# .github/workflows/claude-review.yml
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    task: "Review this PR for security issues"
```

### 5. GitLab CI/CD Integration

Similar to GitHub Actions — spawn Claude Code jobs in CI pipelines.

---

## Enterprise Features

### Managed Settings

Organization-wide settings that cannot be overridden:

```json
// Deployed via MDM or managed settings file
{
  "permissions": {
    "deny": ["WebFetch(domain:*)"]
  },
  "disableBypassPermissionsMode": "disable",
  "allowManagedPermissionRulesOnly": true,
  "allowManagedHooksOnly": true,
  "allowManagedMcpServersOnly": true
}
```

### Analytics Dashboard

- Token usage per user/team
- Adoption tracking
- Engineering velocity metrics
- Cost reporting

### Authentication Options

- Personal API key
- SSO/SAML via Enterprise plan
- Server-managed settings for centralized config

### Network Configuration

- Proxy server support
- Custom Certificate Authority (CA)
- Mutual TLS (mTLS) authentication
- Zero Data Retention (ZDR) mode

### Chrome Integration (Beta)

Claude Code Desktop can connect to Chrome browser:
- Test web apps
- Debug with console logs
- Automate form filling
- Extract data from web pages

---

## Headless / Programmatic Mode

### CLI Non-Interactive Mode

```bash
# Single prompt, print result
claude -p "Explain the codebase architecture" --print

# With permission mode
claude --permission-mode bypassPermissions --print "Fix all lint errors"

# JSON output
claude --print --output-format json "List all API endpoints"
```

### Agent SDK (Python/TypeScript)

```python
from anthropic import Anthropic

client = Anthropic()

# Run Claude Code programmatically
result = client.claude_code.run(
    task="Fix the failing tests in src/",
    permission_mode="acceptEdits",
    directory="/path/to/project"
)
```

### Key SDK Options

- `permission_mode`: `default | acceptEdits | plan | auto | bypassPermissions`
- `allowed_tools`: Allowlist of tools
- `disallowed_tools`: Denylist of tools
- `system_prompt_append`: Additional system instructions

---

## CLI Reference

### Common Commands

| Command | Description |
|---------|-------------|
| `claude` | Start interactive session |
| `claude --continue` | Resume last session |
| `claude --resume` | Choose session to resume |
| `claude -p "prompt"` | Non-interactive single prompt |
| `claude --model claude-sonnet-4-5` | Specify model |

### In-Session Commands

| Command | Description |
|---------|-------------|
| `/init` | Initialize CLAUDE.md for project |
| `/permissions` | View/manage permissions |
| `/context` | Show context window usage |
| `/compact` | Compact conversation |
| `/compact focus on X` | Compact with focus hint |
| `/model` | Switch model |
| `/agents` | Configure subagents |
| `/doctor` | Diagnose installation issues |
| `/add-dir <path>` | Add directory to working set |
| `/undo` | Undo last change |
| `/mcp` | Check MCP server status |
| `Shift+Tab` | Cycle permission modes |

### Key Flags

| Flag | Description |
|------|-------------|
| `--permission-mode` | Set permission mode |
| `--print` | Non-interactive output |
| `--model` | Override model |
| `--add-dir` | Additional directory access |
| `--allowedTools` | Restrict to specific tools |
| `--disallowedTools` | Block specific tools |
| `--fork-session` | Fork from existing session |

---

## How It Agents: Deep Dive

### Context Window Contents

At session start, Claude's context window contains:
1. System prompt (harness instructions, tool definitions)
2. CLAUDE.md content (project instructions)
3. Auto memory (MEMORY.md first 200 lines)
4. Skill descriptions
5. Session history (if resuming)

### Decision Making

Claude's agentic decisions are driven by:
- **Task description** (user prompt)
- **Available tools** (defined in system context)
- **Observed state** (file contents, command output, error messages)
- **Project memory** (CLAUDE.md, auto memory)

### Tool Use Pattern

```
User: "Fix the failing tests"

Claude thinking:
  1. Run tests to see what's failing
     → Bash("npm test") 
  2. Read error output
     → (output: "TypeError: Cannot read property 'name' of undefined at user.js:45")
  3. Find relevant file
     → Read("src/user.js")
  4. Understand the bug
     → (reads context around line 45)
  5. Fix the issue
     → Edit("src/user.js", ...)
  6. Verify fix
     → Bash("npm test")
  7. Report result
     → "Fixed the null check issue in user.js. All tests passing."
```

### Safety Mechanisms

1. **Checkpoints**: File snapshot before every edit — press Esc×2 to rewind
2. **Permission prompts**: Human approves sensitive operations
3. **Plan mode**: Read-only analysis before making changes
4. **Auto mode classifier**: Background AI safety checks
5. **Sandboxing**: OS-level isolation for Bash commands (optional)

---

## Comparison with Other Harnesses

| Feature | Claude Code | OpenCode | Aider | Codex CLI | Cline | Cursor |
|---------|-------------|----------|-------|-----------|-------|--------|
| **Model** | Claude only | 75+ providers | 100+ providers | OpenAI | 10+ providers | Claude/OpenAI/Gemini |
| **Open Source** | ❌ | ✅ MIT | ✅ Apache 2 | ✅ Apache 2 | ✅ Apache 2 | ❌ |
| **Permission Modes** | 6 modes | Session-based | Minimal | 3 modes | Per-action | Session-based |
| **Subagents** | ✅ Native | ✅ `agent` tool | ❌ Architect mode | ❌ | ❌ | ✅ Multi-agent |
| **MCP** | ✅ Full | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Hooks** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Skills** | ✅ | Custom commands | ❌ | ✅ | ❌ | ❌ |
| **Managed Settings** | ✅ Enterprise | ❌ | ❌ | ❌ | Enterprise | Limited |
| **Git Worktrees** | ✅ | Manual | ❌ | ❌ | ❌ | ✅ |
| **Checkpoints** | ✅ | ✅ (undo/redo) | Git commits | ❌ | ✅ Snapshots | ✅ |
| **CI/CD Integration** | ✅ GitHub/GitLab | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Sources

1. [Claude Code Official Docs](https://code.claude.com/docs/en/overview.md)
2. [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works.md)
3. [Configure Permissions](https://code.claude.com/docs/en/permissions.md)
4. [Permission Modes](https://code.claude.com/docs/en/permission-modes.md)
5. [Tools Reference](https://code.claude.com/docs/en/tools-reference.md)
6. [Sub-agents](https://code.claude.com/docs/en/sub-agents.md)
7. [Hooks Guide](https://code.claude.com/docs/en/hooks-guide.md)
8. [Skills](https://code.claude.com/docs/en/skills.md)
9. [Headless Mode](https://code.claude.com/docs/en/headless.md)
10. [Claude Code Auto Mode Engineering Post](https://www.anthropic.com/engineering/claude-code-auto-mode)
11. [Claude Code Docs Index (llms.txt)](https://code.claude.com/docs/llms.txt)

---

*Last updated: March 2026*
