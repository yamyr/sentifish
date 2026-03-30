# Cursor AI Agent Mode: Deep Research

> Comprehensive analysis of Cursor's agentic coding architecture, Composer vs Agent mode, background agents, model switching, context building, and comparison with VS Code Copilot.
> Last updated: March 2026

---

## Table of Contents

1. [Overview & History](#overview--history)
2. [Cursor Architecture](#cursor-architecture)
3. [Tab Completion & Inline Suggestions](#tab-completion--inline-suggestions)
4. [Cmd+K: Inline Edits](#cmdk-inline-edits)
5. [Composer Mode](#composer-mode)
6. [Agent Mode](#agent-mode)
7. [Background Agents (Cloud)](#background-agents-cloud)
8. [Context Building & Codebase Indexing](#context-building--codebase-indexing)
9. [Model Switching](#model-switching)
10. [MCP Integration](#mcp-integration)
11. [Cursor 2.0 Changes](#cursor-20-changes)
12. [Privacy & Security](#privacy--security)
13. [Pricing](#pricing)
14. [Cursor vs VS Code Copilot](#cursor-vs-vs-code-copilot)
15. [Strengths & Weaknesses](#strengths--weaknesses)
16. [Sources](#sources)

---

## Overview & History

**Cursor** is a VS Code fork purpose-built for AI-assisted coding. Developed by Anysphere, it launched in March 2023 and has grown to over 1 million users with 360,000+ paying customers (as of 2025). It is used by engineers at NVIDIA, Y Combinator-backed companies, and over half the Fortune 500.

Unlike VS Code + Copilot (where AI is bolted on), Cursor bakes AI into every layer: the editor UI, the indexing system, the prompt construction, and the agent loop. The company describes itself as "an applied research team focused on building the future of software development."

> "My favorite enterprise AI service is Cursor. Every one of our engineers, some 40,000, are now assisted by AI and our productivity has gone up incredibly."
> — Jensen Huang, CEO, NVIDIA

> "The best LLM applications have an autonomy slider: you control how much independence to give the AI. In Cursor, you can do Tab completion, Cmd+K for targeted edits, or you can let it rip with the full autonomy agentic version."
> — Andrej Karpathy, CEO, Eureka Labs

### Key milestones

| Date | Event |
|------|-------|
| Mar 2023 | Cursor launches as VS Code fork |
| 2024 | Composer mode introduced |
| Feb 2025 | Agent mode reaches mainstream; 1M users |
| May 2025 | Background Agents (cloud) launch |
| Aug 2025 | Cursor CLI (agent in any terminal) preview |
| Jan 2026 | Cursor 2.0 ships with multi-model planning |

---

## Cursor Architecture

Cursor is a **VS Code fork** — it inherits the full VS Code editor, extension marketplace, and keybindings, while adding Cursor-specific AI features on top.

```
┌─────────────────────────────────────────────┐
│               Cursor IDE                     │
│  ┌───────────┐  ┌──────────────────────────┐│
│  │ VS Code   │  │   Cursor AI Layer        ││
│  │ Core      │  │  ┌────────┐ ┌──────────┐ ││
│  │ (editor,  │  │  │ Tab AI │ │ Composer │ ││
│  │ terminal, │  │  │ (next  │ │ / Agent  │ ││
│  │ git, etc) │  │  │ token) │ │ (multi-  │ ││
│  │           │  │  └────────┘ │ step)    │ ││
│  │           │  │  ┌────────┐ └──────────┘ ││
│  │           │  │  │ Cmd+K  │ ┌──────────┐ ││
│  │           │  │  │(inline │ │Codebase  │ ││
│  │           │  │  │ edit)  │ │ Index    │ ││
│  │           │  │  └────────┘ └──────────┘ ││
│  └───────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────┘
          │
          ▼
   Cursor LLM Proxy (Anysphere backend)
          │
          ├── OpenAI GPT-5, o3, o4-mini
          ├── Anthropic Claude Sonnet/Opus
          ├── Google Gemini 3 Pro
          ├── xAI Grok Code
          └── Cursor's proprietary models (Cursor Fast)
```

**Key design principles:**
- Codebase is **indexed** in a vector database on Anysphere's servers (or locally in privacy mode)
- **Prompt construction** is Cursor's core IP — how it assembles context, file contents, and repo structure into optimal LLM prompts
- **Speculative decoding** for edit application (faster diff application)

---

## Tab Completion & Inline Suggestions

Cursor's Tab completion is its most-used feature and differs from Copilot's:

- **Multi-line completions**: Predicts not just the next token but the entire next edit
- **Next edit prediction**: After accepting a completion, Cursor often predicts the *next* change you'll need to make (e.g., update a related function signature)
- **Context-aware**: Uses the full file + relevant indexed files, not just the current cursor position
- **Model**: Cursor uses a fast, proprietary model optimized for low-latency completions

---

## Cmd+K: Inline Edits

`Cmd+K` (or `Ctrl+K`) opens an inline prompt bar for **targeted edits**:

- Select code → `Cmd+K` → describe the change
- Cursor generates a diff directly in the editor
- Accept/reject the changes inline
- Does NOT require switching to a chat panel

This is the "scalpel" of Cursor — precise, quick, targeted. Best for: renaming, refactoring a single function, adding a parameter, etc.

```
Select: function calculateTax(amount) { ... }
Cmd+K → "Add support for tax exemptions and return breakdown object"
→ Inline diff appears
→ Accept with Tab
```

---

## Composer Mode

**Composer** was Cursor's first multi-file editing mode. It lets you describe a task in a chat interface, and Cursor proposes edits across multiple files simultaneously.

### How Composer works

1. Open Composer panel (`Cmd+I` or `Cmd+Shift+I`)
2. Describe your task (e.g., "Add a user settings page with profile and notification preferences")
3. Cursor analyzes context and proposes edits to multiple files
4. You review a diff for each file
5. Accept all changes at once or review file-by-file

### Composer vs Chat

| Feature | Chat | Composer |
|---------|------|---------|
| File editing | Suggests code, you apply | Directly edits files |
| Multi-file | No | Yes |
| Diff view | No | Yes (per-file) |
| Context | Conversation | Full workspace scan |
| Best for | Q&A, exploration | Implementing features |

---

## Agent Mode

**Agent mode** is the evolution of Composer into a fully autonomous coding agent. Introduced in late 2024 / early 2025, it became Cursor's headline feature.

### What makes it "agentic"

In agent mode, Cursor:

1. **Plans autonomously**: Determines which files to read, edit, and create
2. **Runs terminal commands**: `npm install`, `cargo build`, `python -m pytest`, etc.
3. **Reads documentation**: Can browse the web to understand libraries or APIs
4. **Iterates on errors**: If a command fails or tests fail, it reads the output and tries to fix
5. **Loops until done**: Keeps iterating until tests pass or the task is complete

### Tool set available to the agent

```
codebase_search    - Semantic search across indexed codebase
read_file          - Read specific file by path + line range
edit_file          - Apply changes to a file
create_file        - Create new files
delete_file        - Delete files
run_terminal_cmd   - Execute shell commands (with approval)
list_directory     - List files in a directory
grep_search        - Regex search across files
web_search         - Search the internet for documentation
fetch_url          - Fetch a specific URL
```

### Agent mode loop

```
User task
    │
    ▼
Determine context (which files are relevant?)
    │
    ▼
Read relevant files
    │
    ▼
Propose edits / run commands
    │
    ▼
Check output / run tests
    │   ┌─────────────────────┐
    ├───┤ Error? ──► Fix loop │
    │   └─────────────────────┘
    ▼
Report completion to user
```

### Terminal command approval

By default, agent mode **requires approval** before running terminal commands. This prevents accidental data loss or unintended side effects. Users can configure:

- **Auto-approve**: Certain command patterns (e.g., `npm test`, `cargo check`)
- **Always ask**: Default; every command shown with Accept/Reject
- **Block all**: Terminal access disabled

### Context specification

The agent automatically determines which files to read, but users can guide it:

```
@filename.py       - Include specific file
#web               - Allow web browsing
@Docs              - Include documentation context
@Codebase          - Trigger full codebase search
#terminal          - Include recent terminal output
```

---

## Background Agents (Cloud)

**Background Agents** (launched May 2025) move the agent execution from your local machine to the cloud. This enables:

- **Long-running tasks**: Run for hours without tying up your machine
- **Parallel agents**: Multiple agents working on different tasks simultaneously
- **Firewall-isolated environments**: Each agent runs in a sandboxed VM
- **Session resumption**: Pick up where you left off

### Architecture

```
User triggers task (from IDE or cursor.com)
    │
    ▼
Background Agent spawned in cloud VM
    │
    ├── Clones your repo into isolated environment
    ├── Runs agent loop (same tool set as local)
    ├── Commits changes to a new branch
    └── Opens PR for review
```

### Configuration

In the Cursor dashboard (Business/Enterprise plans), workspace admins can configure:
- Default model for background agents
- Allowed network domains (firewall rules)
- Repository access permissions
- Auto-PR settings

### From the UI

```
1. Open Cursor
2. Chat panel → "Run in background"  (or cursor.com/agents)
3. Describe task
4. Choose model
5. Cursor launches cloud agent
6. Monitor progress in the Agents panel
7. Review PR when complete
```

---

## Context Building & Codebase Indexing

Cursor's context building is one of its most important differentiators:

### Codebase Index

When you open a project in Cursor:

1. Cursor **scans the entire codebase** and creates embeddings (vector representations) of every file
2. This index is stored on Anysphere's servers (or locally in Privacy Mode)
3. When you ask a question or run an agent task, Cursor **semantically searches** this index to find the most relevant files

This is fundamentally different from Aider's tree-sitter repo map — Cursor uses embedding-based semantic search, which handles natural language queries better.

### Context sources

| Source | How triggered |
|--------|--------------|
| Indexed codebase | Automatic, always available |
| Open files | Always included in context |
| `@filename` mentions | Manual |
| Terminal output | `#terminal` reference |
| Git diff | Automatic in relevant contexts |
| Web search results | `#web` or `@Docs` |
| Recent chat history | Automatic |
| Custom instructions | `.cursorrules` file |

### `.cursorrules` file

Cursor reads a `.cursorrules` file in your project root for custom instructions:

```markdown
# Project conventions
- Use TypeScript strict mode
- Prefer functional components over class components
- All API calls should go through `src/api/client.ts`
- Tests use Jest + React Testing Library
- Never modify files in `src/generated/`
```

This gives Cursor persistent context about your project's conventions without needing to re-specify every session.

---

## Model Switching

Cursor supports multiple LLMs and lets you switch freely between them.

### Available models (2025–2026)

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5, GPT-4.1, GPT-4.1-mini, o3, o4-mini |
| Anthropic | Claude Sonnet 4.5, Claude Opus 4.5 |
| Google | Gemini 3 Pro |
| xAI | Grok Code |
| Cursor | Cursor Fast (proprietary, low latency) |

### How to switch

- **Model dropdown**: In the chat/composer/agent panel, click the model selector
- **Auto mode**: Cursor picks the model automatically based on task type
- **Per-task**: Different tasks can use different models in the same session

### Cursor 2.0's dual-model planning

From the Codecademy writeup on Cursor 2.0:
> "Cursor 2.0 separates planning from execution. Developers can assign one model to create a plan and a different model to build it. Planning can happen in the background while other work continues, or multiple agents can generate competing plans for review."

This mirrors Aider's architect mode — a reasoning-heavy model for planning, a faster model for execution.

### Cost management

Cursor uses a **credit system** on paid plans:
- **Hobby**: Limited free requests/month
- **Pro ($20/mo)**: 500 fast requests, unlimited slow requests
- **Business ($40/user/mo)**: More fast requests, admin controls
- **Ultra ($200/mo)**: Maximum limits

"Fast" requests use top-tier models (GPT-5, Opus). "Slow" requests fall back to lighter models.

---

## MCP Integration

Cursor supports **Model Context Protocol (MCP)** servers for extending the agent's toolset.

### Configuration

In `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

With MCP, the Cursor agent can:
- Query your database schema and run queries
- Interact with GitHub issues and PRs
- Access Figma designs
- Read Jira tickets
- Connect to any custom MCP server you build

---

## Cursor 2.0 Changes

Cursor 2.0 (shipped Jan 2026) was a significant architectural rethink:

### Multi-agent subagent system

The "Composer model" in Cursor 2.0 is not just the LLM — it's an orchestration layer:

```
User task
    │
    ▼
Planner agent (high-intelligence model)
    │
    ├── Spawns subagents for parallel work
    │   ├── Subagent A: frontend changes
    │   ├── Subagent B: backend changes
    │   └── Subagent C: tests
    │
    ▼
Coordinator merges results
    │
    ▼
User reviews unified PR/diff
```

### Cursor Fast model

Cursor 2.0 shipped a proprietary model ("Cursor Fast") optimized for:
- Low-latency tab completion
- Fast inline edits
- Routine Composer tasks

This reduces reliance on expensive frontier models for everyday tasks.

### Redesigned UI

- Agent panel replaces Composer as the primary interface
- Unified task history
- Better parallel task visualization

---

## Privacy & Security

Cursor has invested heavily in privacy features for enterprise adoption:

### Privacy Mode

In Privacy Mode (`Settings > Privacy Mode`):
- Code is **never stored** on Anysphere's servers
- Codebase indexing happens locally only
- Prompts are sent directly to LLM providers without logging

### SOC 2 Type II certification

Cursor is SOC 2 Type II certified — required by many enterprise procurement teams.

### Enterprise controls

Business/Enterprise plans add:
- SSO (SAML, Okta, etc.)
- Audit logs of agent actions
- Organization-wide model restrictions
- IP allowlisting
- Zero data retention agreements

---

## Pricing

| Plan | Price | Features |
|------|-------|---------|
| Hobby | Free | 2000 completions/month, 50 slow requests |
| Pro | $20/month | 500 fast requests, unlimited slow, background agents |
| Business | $40/user/month | Pro + admin controls, SSO, audit logs |
| Ultra | $200/month | Maximum request limits, priority |

---

## Cursor vs VS Code Copilot

| Feature | Cursor | GitHub Copilot (VS Code) |
|---------|--------|--------------------------|
| Editor | Fork of VS Code | Extension in VS Code |
| Tab completion | Custom model, next-edit prediction | Copilot model |
| Codebase indexing | Deep vector embedding (Anysphere servers) | `@workspace` semantic search |
| Agent mode | ✅ Full autonomy, terminal, web | ✅ Agent mode (Feb 2025) |
| Background agents | ✅ Cloud VMs | ✅ Cloud (Copilot Workspace) |
| Multi-file editing | ✅ Native | ✅ Copilot Edits |
| Model choice | GPT-5, Opus, Gemini, Grok, Cursor | GPT-4o, o3-mini, Sonnet (limited) |
| MCP support | ✅ | ✅ |
| Privacy mode | ✅ SOC2 certified | ✅ (GitHub's data policy) |
| VS Code extensions | ✅ (full compatibility) | ✅ |
| Open source | ❌ (proprietary) | ❌ (proprietary) |
| Pricing | $20/mo (Pro) | $10/mo (individual) |
| Git integration | Via VS Code built-in | Via GitHub deep integration |
| GitHub.com features | Via MCP | ✅ Native (issues, PRs, Workspace) |
| Enterprise | $40/user/mo | $19/user/mo (Business) |

### Key differences in practice

1. **Context quality**: Cursor's codebase indexing is generally considered deeper and more accurate for large projects
2. **Model flexibility**: Cursor lets you pick any frontier model; Copilot has a curated list
3. **GitHub integration**: Copilot wins here — it's deeply tied into GitHub issues, PRs, and Actions
4. **Cost**: Copilot is cheaper for basic use; Cursor is comparable for heavy users
5. **Privacy**: Both offer enterprise privacy controls; Cursor's Privacy Mode is more granular
6. **Agent autonomy**: Both are converging, but Cursor was earlier and more aggressive here

---

## Strengths & Weaknesses

### ✅ Strengths

1. **Best-in-class IDE experience**: Polished, fast, familiar (VS Code fork)
2. **Deep codebase understanding**: Vector embedding-based index for semantic search
3. **Model flexibility**: Switch between frontier models per task
4. **Agent mode with terminal access**: Full autonomy for complex tasks
5. **Background agents**: Long-running tasks without blocking your machine
6. **MCP ecosystem**: Extensible with any MCP server
7. **Next-edit prediction**: Tab completion predicts the *next* change, not just the current one
8. **Strong enterprise adoption**: Fortune 500, NVIDIA-scale deployments
9. **Active development**: Ships updates weekly

### ❌ Weaknesses

1. **Proprietary**: Closed source; you're dependent on Anysphere
2. **Credit system opacity**: Hard to predict costs; billing surprises reported
3. **Privacy concerns**: Code leaves your machine (except Privacy Mode)
4. **Indexing cost**: Index is on Anysphere's servers by default; requires trust
5. **Not GitHub-native**: Less integrated with GitHub ecosystem vs Copilot
6. **Heavy resource usage**: VS Code fork with background indexing uses significant RAM/CPU
7. **Context limits**: Even with indexing, very large monorepos can overwhelm context

---

## Sources

- Cursor official site: https://cursor.com
- Cursor features page: https://cursor.com/features
- Cursor product page: https://cursor.com/product
- Cursor background agents docs: https://docs.cursor.com/en/background-agent
- VS Code Copilot agent mode launch post: https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode
- Cursor AI Review 2025 (Skywork): https://skywork.ai/blog/cursor-ai-review-2025-agent-refactors-privacy/
- Cursor 2.0 and Composer analysis (CometAPI): https://www.cometapi.com/cursor-2-0-what-changed-and-why-it-matters/
- Cursor 2.0 explained (Codecademy): https://www.codecademy.com/article/cursor-2-0-new-ai-model-explained
- AI coding agents comparison: https://artificialanalysis.ai/insights/coding-agents-comparison
- Morph LLM 15 agents tested: https://www.morphllm.com/ai-coding-agent
