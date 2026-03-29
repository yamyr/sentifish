# GitHub Copilot Agent Mode: Deep Research

> Comprehensive analysis of GitHub Copilot's agentic capabilities — local agents, cloud coding agents, @workspace context, MCP integration, agent extensions, and enterprise features.
> Last updated: March 2026

---

## Table of Contents

1. [Overview & Evolution](#overview--evolution)
2. [Agent Types in VS Code](#agent-types-in-vs-code)
3. [Local Agent Mode (VS Code)](#local-agent-mode-vs-code)
4. [Copilot Edits (Edit Mode)](#copilot-edits-edit-mode)
5. [@workspace Context](#workspace-context)
6. [Cloud Coding Agent](#cloud-coding-agent)
7. [Copilot CLI](#copilot-cli)
8. [Custom Agents & Agent Skills](#custom-agents--agent-skills)
9. [MCP Integration](#mcp-integration)
10. [Model Selection](#model-selection)
11. [Copilot Spaces & Memory](#copilot-spaces--memory)
12. [GitHub Spark](#github-spark)
13. [Enterprise Features](#enterprise-features)
14. [Chat Mode vs Agent Mode: Key Differences](#chat-mode-vs-agent-mode-key-differences)
15. [Copilot vs Cursor](#copilot-vs-cursor)
16. [Pricing](#pricing)
17. [Strengths & Weaknesses](#strengths--weaknesses)
18. [Sources](#sources)

---

## Overview & Evolution

**GitHub Copilot** launched in 2021 as an autocomplete tool powered by OpenAI Codex. Since then, it has evolved dramatically:

| Year | Milestone |
|------|-----------|
| 2021 | Copilot launches as autocomplete (GitHub + OpenAI) |
| 2023 | Copilot Chat added to VS Code |
| 2023 | `@workspace` context for codebase-wide questions |
| 2024 | Copilot Edits (multi-file editing) |
| Feb 2025 | **Agent mode launched** (VS Code Insiders) |
| May 2025 | **Copilot coding agent** (cloud, GitHub issues → PRs) |
| 2025 | MCP support added to agent mode |
| 2025 | Multi-model support (Claude, Gemini alongside GPT) |
| 2025 | Custom agents, agent skills API |
| 2026 | Third-party agents (Anthropic, OpenAI) integrated into VS Code |

As of 2025–2026, Copilot is no longer just autocomplete — it's a full **agentic platform** with local execution, cloud agents, custom agent creation, MCP integration, and deep GitHub platform integration.

> "In agent mode, Copilot determines which files to make changes to, offers code changes and terminal commands to complete the task, and iterates to remediate issues until the original task is complete."
> — GitHub Copilot docs

---

## Agent Types in VS Code

VS Code now has a unified **Agents framework** for Copilot. There are four types of agents:

### 1. Local Agent
Runs in VS Code on your machine. Full access to workspace, terminal, and tools.

### 2. Copilot CLI
Runs on your machine via the command line. Can use git worktrees for isolation. Good for background work.

### 3. Cloud Agent
Runs on GitHub's infrastructure. Integrates with GitHub PRs. Best for async tasks.

### 4. Third-party Agents
Claude Code (Anthropic) and Codex CLI (OpenAI) can now run directly inside VS Code's agent framework.

### Which to use?

| Scenario | Agent type |
|----------|-----------|
| Interactive exploration/debugging | Local |
| Implementing while you keep working | CLI or Cloud |
| GitHub issue → PR | Cloud |
| Need specific AI provider | Third-party |
| Custom tooling for your team | Custom agent |

### Permission levels

The VS Code agent framework has a **permissions picker**:
- **Ask everything**: Approve every tool call
- **Auto-run safe tools**: Auto-approve reads, manual for writes/commands
- **Full auto**: Agent runs without approval (for trusted sessions)

---

## Local Agent Mode (VS Code)

**Agent mode** is the primary agentic interface in VS Code Copilot (as of Feb 2025).

### How to enable

1. Open VS Code Insiders (now VS Code Stable)
2. Open Copilot Edits view
3. Select **Agent** from the mode dropdown
4. Enter your prompt

### What agent mode can do

```
analyze codebase ──► read relevant files ──► propose edits
                                              + run commands
                                              + check errors
                                              ──► iterate until done
```

From the official VS Code blog:
> "Copilot agent mode operates in a more autonomous and dynamic manner to achieve the desired outcome. To process a request, Copilot loops over the following steps and iterates multiple times as needed:
> - Determines the relevant context and files to edit autonomously
> - Offers both code changes and terminal commands to complete the task
> - Monitors the correctness of code edits and terminal command output and iterates to remediate issues"

### Tools available in local agent mode

| Tool | Description |
|------|-------------|
| `read_file` | Read file contents with line range |
| `edit_file` | Apply code changes to a file |
| `create_file` | Create new files |
| `delete_file` | Delete files |
| `run_terminal_command` | Execute shell commands |
| `search_workspace` | Semantic search across the codebase |
| `get_errors` | Fetch compile/lint errors from VS Code diagnostics |
| `list_directory` | List files in a directory |
| `grep_search` | Pattern search across files |
| `run_test` | Run test suite |
| + MCP tools | Any tools from configured MCP servers |

### Example `read_file` tool definition

From the VS Code team's blog post on how they built agent mode:

```json
{
  "name": "read_file",
  "description": "Read the contents of a file. You must specify the line range you're interested in, and if the file is larger, you will be given an outline of the rest of the file.",
  "parameters": {
    "type": "object",
    "properties": {
      "filePath": {
        "description": "The absolute paths of the files to read.",
        "type": "string"
      },
      "startLineNumberBaseZero": {
        "type": "number",
        "description": "The line number to start reading from, 0-based."
      },
      "endLineNumberBaseZero": {
        "type": "number",
        "description": "The inclusive line number to end reading at, 0-based."
      }
    },
    "required": ["filePath", "startLineNumberBaseZero", "endLineNumberBaseZero"]
  }
}
```

### The agent's system prompt

The VS Code team invested heavily in the system prompt and tool descriptions. From their blog:
> "A lot of our development time went into refining these tool descriptions and the system prompt so the LLM uses tools accurately — also noted by Anthropic in their building effective agents blog."

They found different behaviors across GPT-4o and Claude Sonnet and tailored prompts per model.

### Undo & intervention

- Every tool call is displayed in the UI
- Terminal commands require approval before running
- **Undo Last Edit** button in the view title bar reverts to pre-edit state

---

## Copilot Edits (Edit Mode)

**Copilot Edits** is the predecessor to agent mode — a more controlled, user-guided multi-file editing experience.

### Edit mode characteristics

- **User controls file set**: You specify which files Copilot can modify
- **One turn at a time**: Each prompt → review → accept/reject
- **No terminal access**: Purely file editing
- **Token-efficient**: No autonomous exploration; faster and cheaper

### When to use Edit mode vs Agent mode

| Use Edit mode when... | Use Agent mode when... |
|-----------------------|------------------------|
| Task is well-defined | Task involves unknowns |
| You know exactly which files need changing | You need Copilot to figure out what to change |
| You want full control over token usage | You want autonomous completion |
| Simple, scoped changes | Complex, multi-step tasks |

---

## @workspace Context

`@workspace` is a Copilot chat participant that gives Copilot access to your entire codebase for answering questions.

### How @workspace works

1. VS Code indexes your workspace (similar to Cursor's embedding index)
2. When you use `@workspace`, Copilot semantically searches the index
3. The most relevant files are pulled into the context window
4. Copilot answers based on your actual codebase

### Usage

```
@workspace How is authentication handled in this app?
@workspace Where are database queries defined?
@workspace What does the UserService class do?
@workspace Explain the data flow from frontend to backend
```

### Context references

You can pin additional context with:

```
#file:src/auth.ts    - Include specific file
#selection           - Include current editor selection
#codebase            - Trigger full codebase search
#web                 - Include web search results
#terminal            - Include recent terminal output
```

### @workspace vs @codebase

- `@workspace` — Semantic search across indexed files, answers questions
- `@codebase` — Trigger deeper search, used within agent/edits prompts

---

## Cloud Coding Agent

The **Copilot coding agent** (cloud) is GitHub's fully autonomous cloud-based coding assistant. It's triggered from GitHub.com and runs on GitHub's infrastructure.

### How it works

1. **Assign a GitHub issue** to Copilot (via the assignees section)
2. Copilot reads the issue, creates a plan
3. Copilot spins up a **sandboxed cloud environment** with your repo
4. The agent works on the task autonomously (tools: bash, file editing, test runners)
5. Copilot commits changes to a new branch and **opens a PR**
6. You review the PR, can @mention `@copilot` for changes
7. Merge when satisfied

### Triggering from multiple surfaces

| Surface | How to trigger |
|---------|---------------|
| GitHub issue | Assign Copilot as the issue assignee |
| Copilot Chat (web/IDE) | "Create a PR for this" |
| GitHub CLI | `gh copilot create-pr` |
| VS Code | `/delegate` command in chat |
| Slack | GitHub + Slack integration |
| Jira | GitHub + Jira integration |
| Teams | GitHub + Teams integration |
| Linear | GitHub + Linear integration |
| Azure Boards | GitHub + Azure Boards integration |

### Session tracking

Track Copilot's progress via:
- **Agents panel** in VS Code or GitHub.com
- **Session logs** for full audit trail
- Email notifications when PR is ready

### Sandboxed environment

The cloud agent runs in a **firewall-isolated VM**:
- Network access to allowed domains only
- Custom dev container support (`.devcontainer/`)
- Configurable tools (additional packages, scripts)
- Copilot memory (knowledge about the repo)

### Customizing the agent environment

In `.github/copilot-setup.sh` or via devcontainer:
```bash
#!/bin/bash
# Install additional tools needed for this repo
pip install -r requirements-dev.txt
npm install
# Any other setup steps
```

---

## Copilot CLI

The **Copilot CLI** runs Copilot as a background agent on your local machine from the terminal.

### Key features

- Runs in the background while you continue other work
- Can use **git worktrees** for isolation (avoids touching your current working directory)
- `/delegate` command routes tasks to cloud agent from the CLI session
- Access from VS Code's integrated terminal

### Usage

```bash
# Start a Copilot CLI session
gh copilot start

# Delegate to cloud agent
/delegate Implement the user settings page from issue #42

# Ask questions
What does the payment module do?

# Make local changes
Refactor the auth middleware to support JWT
```

---

## Custom Agents & Agent Skills

### Custom agents

Organizations can create **custom agents** with tailored behavior:

```yaml
# .github/copilot-agents/security-reviewer.yaml
name: Security Reviewer
description: Reviews code changes for security vulnerabilities
instructions: |
  You are a security-focused code reviewer.
  Focus on: SQL injection, XSS, auth bypass, secrets in code.
  Always explain why something is a risk.
tools:
  - codeSearch
  - readFile
  - githubApi
```

Custom agents:
- Have specific personas (security reviewer, documentation writer, etc.)
- Can be scoped to specific tools
- Can be workspace-level (project-specific) or organization-level
- Available from the agents dropdown in VS Code Copilot Chat

### Agent skills

**Agent skills** are reusable behaviors that modify how the coding agent performs specific tasks:

```yaml
# .github/skills/run-tests.yaml
name: run-tests
description: After making changes, always run the test suite
steps:
  - run: npm test
  - check: output for failures
  - if failures: fix and re-run
```

Skills let teams encode project-specific knowledge into the agent's behavior.

---

## MCP Integration

GitHub Copilot's agent mode fully supports **Model Context Protocol (MCP)** servers.

### Configuration in VS Code

In `settings.json`:
```json
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
        }
      }
    }
  }
}
```

### What MCP enables for Copilot

- **Jira integration**: Read tickets, create issues, update status
- **Slack**: Post messages, read channel history
- **Database**: Query schemas, run read-only queries
- **Custom internal tools**: Any proprietary tooling exposed via MCP
- **Figma**: Read design specs and layouts

The Copilot agent mode is described as best for tasks that "require Copilot to integrate with external applications, such as an MCP server."

---

## Model Selection

GitHub Copilot supports multiple models (expanded significantly in 2025):

### Available models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4.1, o3-mini, o1, o3 |
| Anthropic | Claude 3.5 Sonnet, Claude 3.7 Sonnet |
| Google | Gemini 2.0 Flash, Gemini 2.5 Pro (some tiers) |

### Model selection

- Choose via the model dropdown in Chat/Agent/Edits view
- Different models can be selected for different tasks
- Enterprise admins can restrict available models
- The cloud coding agent has configurable default models

> "Today, the VS Code team prefers Claude Sonnet over GPT-4o for our Copilot agent mode use cases."
> — VS Code team, Feb 2025 blog post

---

## Copilot Spaces & Memory

### Copilot Spaces

**Spaces** let teams organize context around specific tasks:
- Include code, docs, specs, design docs, etc.
- Grounded context for specific domains (e.g., "payment team space")
- Multiple team members share the same contextual grounding
- Agent uses Space context as baseline knowledge

### Copilot Memory

**Copilot Memory** (public preview) lets Copilot learn and store knowledge about a repo:
- Learns from previous interactions
- Used by coding agent and code review features
- Stored per-repository
- Can improve quality over time as it understands your patterns

---

## GitHub Spark

**GitHub Spark** (public preview) is a higher-level abstraction:
- Build full-stack applications from natural language prompts
- Seamless integration with the GitHub platform
- Deploys to GitHub infrastructure
- More opinionated than raw Copilot agent mode

```
"Build me a task management app with a React frontend
 and Node backend, with user auth and PostgreSQL"
  ↓
Spark creates full app structure
  ↓
Deploys to GitHub-managed hosting
```

---

## Enterprise Features

For **GitHub Copilot Business** and **Copilot Enterprise** plans:

### Policy management
- Control which Copilot features are available to users
- Allow/block specific models
- Restrict agent mode capabilities
- Configure network access for cloud agents

### Audit logs
- Full audit trail of Copilot usage
- Agent session logs (what the agent did, which files it touched)
- API call history

### Content exclusion
- Exclude specific files/patterns from Copilot context
- Prevent sensitive files from being sent to LLM APIs

### Custom knowledge bases (Enterprise)
- Ingest internal documentation, architecture docs, coding standards
- Agent uses this as context when working in your codebase

### SAML/SSO
- Single sign-on integration
- GitHub Enterprise Cloud + Copilot Enterprise

---

## Chat Mode vs Agent Mode: Key Differences

| Aspect | Chat mode | Agent mode |
|--------|-----------|------------|
| File editing | No (suggests code in chat) | Yes (directly edits files) |
| Multi-file | No | Yes (autonomous file selection) |
| Terminal | No | Yes (with approval) |
| Autonomy | Low (Q&A + suggestions) | High (loops until done) |
| Context determination | User specifies | Copilot determines automatically |
| Speed | Fast | Slower (multiple LLM calls) |
| Token usage | Low | High (exploration + iteration) |
| Best for | Questions, code gen snippets | End-to-end feature implementation |

---

## Copilot vs Cursor

| Feature | GitHub Copilot | Cursor |
|---------|---------------|--------|
| Primary install | VS Code extension | VS Code fork (separate app) |
| VS Code compatibility | ✅ Native | ✅ (VS Code fork) |
| Inline autocomplete | ✅ Industry standard | ✅ Better next-edit prediction |
| Codebase indexing | ✅ @workspace | ✅ Deeper embedding index |
| Agent mode | ✅ (Feb 2025+) | ✅ (Earlier, more mature) |
| Cloud agent | ✅ GitHub Copilot Workspace | ✅ Background Agents |
| GitHub integration | ✅ Native (issues, PRs) | Via MCP |
| MCP support | ✅ | ✅ |
| Model choice | 5-10 models | 10+ models |
| Custom agents | ✅ (skill YAML) | Limited |
| Third-party agents | ✅ Claude Code, Codex | N/A |
| Enterprise features | ✅ Deep (SSO, audit, policy) | ✅ SOC2, privacy mode |
| Price | $10-19/user/mo | $20-40/user/mo |
| GitHub.com workflow | ✅ Native | Limited |

---

## Pricing

| Plan | Price | Users |
|------|-------|-------|
| Individual | $10/month | Individual developers |
| Business | $19/user/month | Teams, org policy controls |
| Enterprise | $39/user/month | Enterprise features, custom knowledge |

All plans include: inline suggestions, chat, multi-model support, agent mode.
Business+ adds: policy management, audit logs, content exclusion.
Enterprise adds: custom knowledge base, Copilot Workspace, SSO.

---

## Strengths & Weaknesses

### ✅ Strengths

1. **GitHub-native**: Deepest integration with GitHub issues, PRs, Actions, CI/CD
2. **Best autocomplete**: Years of tuning on the world's largest code dataset
3. **Most users**: 15M+ developers — battle-tested at scale
4. **Cloud coding agent**: Assign issues → get PRs automatically
5. **Multi-model**: GPT-4o, Claude, Gemini options
6. **Enterprise-grade**: Best-in-class policy controls, audit logs, SSO
7. **Custom agents & skills**: Teams can encode domain expertise
8. **Third-party agent support**: Claude Code + Codex run inside VS Code now
9. **Copilot Spaces + Memory**: Gets smarter about your codebase over time
10. **Price**: Cheapest of the major agents at $10/month

### ❌ Weaknesses

1. **Less deep codebase understanding vs Cursor**: Embedding index less powerful for large repos
2. **Agent mode came later**: Cline/Cursor were earlier and more mature in agentic workflows
3. **Limited model choice**: Smaller model roster than Cursor
4. **No computer use**: No browser automation (unlike Cline)
5. **Microsoft/OpenAI alignment**: Historically favored OpenAI models; Claude/Gemini added but not primary
6. **Extension, not fork**: VS Code extension can't modify the editor as deeply as Cursor
7. **Complex pricing tiers**: Enterprise features locked behind $39/user/month

---

## Sources

- GitHub Copilot features: https://docs.github.com/en/copilot/get-started/features
- GitHub Copilot coding agent: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent
- VS Code agents overview: https://code.visualstudio.com/docs/copilot/agents/overview
- VS Code Copilot agent mode launch: https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode
- Creating custom agents: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents
- MCP in VS Code: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
- Copilot agent mode and multi-model (DevOps.com): https://devops.com/github-copilot-evolves-agent-mode-and-multi-model-support-transform-devops-workflows-2/
- AI coding agents comparison: https://artificialanalysis.ai/insights/coding-agents-comparison
