# Agentic Coding Harness Comparison: 2024–2026

> Comprehensive comparison of all major coding agent harnesses — Devin, SWE-agent, Claude Code, Codex CLI, Aider, Cursor, Cline, Copilot, and OpenCode. Includes benchmarks, pricing, strengths, and use case fit.
> Last updated: March 2026

---

## Table of Contents

1. [The Landscape Overview](#the-landscape-overview)
2. [SWE-bench Benchmark Explained](#swe-bench-benchmark-explained)
3. [Benchmark Scores: Top Agents 2025–2026](#benchmark-scores-top-agents-20252026)
4. [Agent Profiles](#agent-profiles)
   - Claude Code
   - Codex CLI
   - Cursor
   - Cline
   - Aider
   - GitHub Copilot
   - Devin
   - OpenCode
   - SWE-agent
   - OpenHands / OpenDevin
5. [Head-to-Head Comparison Tables](#head-to-head-comparison-tables)
6. [Pricing Comparison](#pricing-comparison)
7. [Use Case Fit Matrix](#use-case-fit-matrix)
8. [The Big Three (2026)](#the-big-three-2026)
9. [Architecture Categories](#architecture-categories)
10. [What the Benchmarks Miss](#what-the-benchmarks-miss)
11. [Sources](#sources)

---

## The Landscape Overview

The coding agent landscape exploded between 2023 and 2026. As of early 2026, there are 80+ active coding agents — from simple autocomplete tools to fully autonomous cloud-based agents.

### Key categorization axes

**By deployment model:**
- **Terminal agents**: Claude Code, Codex CLI, Aider, OpenCode, Gemini CLI, Goose
- **IDE extensions**: Cline, Copilot, Augment, Continue, Roo Code
- **Dedicated IDEs**: Cursor, Windsurf, Zed, Kiro, Google Antigravity
- **Cloud platforms**: Devin, OpenHands, Genie, Jules, Codex Cloud, Cursor Background Agents

**By autonomy level:**
- **Autocomplete**: Suggestions while typing (Copilot, Cursor Tab)
- **Chat/Edit**: Ask → review → apply (Copilot Edits, Cursor Composer)
- **Agentic**: Autonomous multi-step task execution (Claude Code, Cline, Devin)
- **Fully autonomous**: Works asynchronously, opens PRs without human involvement (Devin, Copilot Workspace)

**By model flexibility:**
- **Locked**: Devin (proprietary), Claude Code (Anthropic only), Codex (OpenAI only)
- **Flexible**: Aider (any), Cline (any), OpenCode (any), Cursor (most major providers)
- **Curated**: Copilot (5-10 options), Windsurf (several providers)

---

## SWE-bench Benchmark Explained

**SWE-bench** is the standard benchmark for evaluating coding agents on real-world software engineering tasks.

### What it tests

- **Dataset**: Real GitHub issues from 12 popular Python repositories (Django, Flask, NumPy, scikit-learn, etc.)
- **Task**: Given an issue description, patch the code to fix the bug
- **Evaluation**: Automated test suite verifies the fix works
- **Metric**: % of issues resolved correctly

### Variants

| Variant | Size | Notes |
|---------|------|-------|
| SWE-bench (full) | 2,294 issues | Original, Python only |
| SWE-bench Lite | 300 issues | Easier subset, faster to evaluate |
| SWE-bench Verified | 500 issues | Human-validated subset (with OpenAI collaboration) — most trusted |
| SWE-bench Multimodal | Variable | Adds image/screenshot tasks |
| SWE-PolyBench | Variable | Multi-language (Python, JS, Java, Go, etc.) |

**SWE-bench Verified** is considered the most meaningful as human annotators confirmed problem descriptions, test patches, and task solvability.

### Bash-only mini-SWE-agent evaluation

The SWE-bench team also maintains a **bash-only** comparison using mini-SWE-agent:
- All models evaluated with identical setup (just a bash shell, ReAct loop)
- Allows apples-to-apples model comparison without scaffold bias
- Scores here are lower than scaffold-optimized agent scores

### Important caveats

1. **Scaffold matters**: The same model can score 10-20 percentage points differently depending on which agent harness runs it
2. **Python-only** (full SWE-bench): Most repos are Python; may not reflect JS/TypeScript/Go performance
3. **Benchmarks vs real work**: SWE-bench measures bug-fixing on known repos; may not predict performance on your internal codebase
4. **Overfitting risk**: Agents that trained on GitHub may have seen some SWE-bench repos

---

## Benchmark Scores: Top Agents 2025–2026

### SWE-bench Verified (best reported scores)

| Agent / Model | Score | Notes |
|---------------|-------|-------|
| Claude Opus 4.5 (best scaffold) | **80.9%** | Top score as of March 2026 |
| Claude Opus 4.6 (SWE-Rebench) | **~82%** | On re-bench leaderboard |
| GPT-5 (OpenAI Codex scaffold) | **77–88%** | Range across compute budgets |
| Gemini 2.5 Pro (32k thinking) | **83.1%** | Via Aider benchmark |
| o3 (high, Aider) | **81.3%** | Via Aider benchmark |
| Devin 2.0 | **~55–60%** | Cognition AI's proprietary system |
| OpenHands + Claude Sonnet | **~50–55%** | Open-source multi-agent |
| SWE-agent 1.0 (Claude 3.7) | ~45–50% | Princeton research agent |
| Amazon Q Developer | ~38–45% | AWS-native agent |
| Aider + DeepSeek R1 | ~57–74% | Cost-effective option |
| Aider + Claude 3.7 Sonnet | ~60–65% | Good balance |

> Note: Scores vary significantly by evaluation methodology. The Aider leaderboard tests code editing ability (133 exercises), not SWE-bench directly. The morphllm data reports SWE-bench Verified specifically.

### Aider code editing benchmark (Aider's own benchmark)

The Aider leaderboard measures performance on 133 polyglot coding exercises across Python, JS, TypeScript, Go, Rust, Ruby, PHP, etc.

| Model | Aider benchmark score | Cost/run |
|-------|----------------------|----------|
| GPT-5 (high) | 88.0% | $29.08 |
| o3-pro (high) | 84.9% | $146.32 |
| Gemini 2.5 Pro (32k think) | 83.1% | $49.88 |
| o3 (high) | 81.3% | $21.23 |
| Claude Opus 4 (32k think) | 72.0% | $65.75 |
| DeepSeek R1 (0528) | 71.4% | $4.80 |
| Claude 3.7 Sonnet (no think) | 60.4% | $17.72 |
| DeepSeek V3 (0324) | 55.1% | $1.12 |
| Claude 3.5 Sonnet | 51.6% | $14.41 |
| DeepSeek Chat V3 (prev) | 48.4% | $0.34 |

The DeepSeek models provide exceptional value — near Claude-level performance at 5–20× lower cost.

---

## Agent Profiles

### 1. Claude Code

**By**: Anthropic  
**Type**: Terminal-native CLI  
**Model**: Anthropic models only (Claude 3.5 Sonnet, 3.7 Sonnet, Opus 4.5)

Claude Code is Anthropic's own agentic CLI. It runs in the terminal with direct access to shell, file system, and tools. It's known for deep reasoning on complex tasks.

**Revenue**: Claude Code reportedly hit $2.5B ARR and accounts for >50% of Anthropic's enterprise revenue (SemiAnalysis, 2025).

**SWE-bench Verified**: ~80.9% (Opus 4.5) — top of the public leaderboard

**Key features**:
- 200K token context window
- Auto-compaction for long sessions
- Multi-agent coordination (Agent Teams, Feb 2026)
- MCP server integration
- Custom hooks system
- Git worktree support for parallel agents

**Pricing**: $20/month (Claude.ai Pro) or $200/month (Max plan); heavy API usage can hit $150-200/month

**Ideal for**: Complex architectural refactors, hard debugging, large codebases, users who want the best reasoning

**Not ideal for**: Budget-conscious users, those who want non-Anthropic models, simple autocomplete tasks

---

### 2. Codex CLI (OpenAI)

**By**: OpenAI  
**Type**: Terminal CLI (open source, Rust)  
**Model**: OpenAI models (GPT-5.x family)

OpenAI's open-source terminal agent, released April 2025. Written in Rust for performance. Acquired 1M+ developers in its first month.

**Terminal-Bench 2.0**: 77.3% (GPT-5.3) — leads on terminal tasks

**Key features**:
- 240+ tokens/second (2.5× faster than Claude Opus)
- Multi-agent via Agents SDK + MCP
- Git worktrees for parallel work
- Open source (MIT license)
- Large community (4200+ weekly contributors on r/Codex)

**Pricing**: OpenAI API usage + $20/month OpenAI subscription

**Ideal for**: Speed, throughput, code review, high-volume tasks, open-source users

**Not ideal for**: Deep architectural reasoning (Claude Code is better here), non-OpenAI model users

---

### 3. Cursor

**By**: Anysphere  
**Type**: Dedicated IDE (VS Code fork)  
**Model**: GPT-5, Claude Opus/Sonnet, Gemini, Grok, Cursor Fast

Cursor is the dominant AI-native IDE with 1M+ users and 360K paying customers. It wraps VS Code with deep AI integration including codebase indexing, agent mode, and background cloud agents.

**Key features**:
- Deep vector embedding codebase index
- Agent mode (autonomous, terminal + web access)
- Background agents (cloud VMs)
- Tab completion with next-edit prediction
- Multi-model flexibility
- `.cursorrules` for project conventions

**Pricing**: $20/month (Pro), $40/user/month (Business), $200/month (Ultra)

**Ideal for**: Daily IDE workflow, feature development, teams wanting a polished all-in-one solution

**Not ideal for**: Privacy-critical environments (code goes to Anysphere servers by default), terminal-only workflows

---

### 4. Cline

**By**: Cline Team (open source)  
**Type**: VS Code Extension  
**Model**: Any (100+ providers)

Cline (formerly Claude Dev) is the most capable open-source VS Code extension for agentic coding. 5M+ downloads. Features Plan/Act modes, browser use, MCP integration, and self-extension capability.

**Key features**:
- Plan/Act mode separation
- Browser (Puppeteer) automation for visual debugging
- MCP first-class support (can build its own MCP servers)
- Terminal with shell integration
- Token cost tracking
- Supports every major LLM provider including local models

**Pricing**: Free (pay only for API tokens)

**Ideal for**: Power users who want full control, open-source advocates, teams with custom LLM providers

**Not ideal for**: Users who want autocomplete (Cline is task-focused, not suggestion-focused)

---

### 5. Aider

**By**: Paul Gauthier / Aider-AI (open source)  
**Type**: Terminal CLI  
**Model**: Any LLM via litellm

Aider is the original open-source terminal coding assistant. Git-native, with sophisticated edit formats and an architect mode. Top performer on Aider's own code editing benchmark.

**Key features**:
- 5 edit formats (whole/diff/udiff/diff-fenced/editor)
- Architect mode (dual-model planning + editing)
- Repository map (tree-sitter AST analysis)
- Voice coding (Whisper integration)
- Deep git integration (auto-commit, undo)
- Model-flexible (any LLM)

**Pricing**: Free (pay only for API tokens)

**Ideal for**: Terminal-first developers, git-centric workflows, model experimentation, voice coding

**Not ideal for**: Non-git projects, users who want an IDE experience, browser automation

---

### 6. GitHub Copilot

**By**: GitHub / Microsoft  
**Type**: VS Code extension + cloud platform  
**Model**: GPT-4o, Claude, Gemini (curated selection)

The most-used coding AI with 15M+ developers. Evolved from autocomplete to a full agent platform with local agent mode, cloud coding agents, MCP support, and enterprise controls.

**Key features**:
- Industry-standard inline autocomplete
- Copilot Chat with @workspace
- Agent mode (Feb 2025)
- Cloud coding agent (issue → PR)
- Custom agents and agent skills
- MCP support
- Deep GitHub platform integration

**Pricing**: $10/month (individual), $19/user/month (Business), $39/user/month (Enterprise)

**Ideal for**: Teams already in GitHub ecosystem, users who want autocomplete + agent in one, enterprise teams

**Not ideal for**: Users who need maximum autonomy (vs Devin/Claude Code), non-GitHub workflows

---

### 7. Devin

**By**: Cognition AI  
**Type**: Cloud platform  
**Model**: Proprietary

Devin is the most ambitious cloud-based coding agent — a fully autonomous "AI software engineer." It was the first to score >13% on SWE-bench Full (a landmark in 2024). Now scores ~55-60% on Verified in 2025.

**Key features**:
- Fully autonomous — runs for hours without human input
- Browser, terminal, file editing all in sandboxed cloud VM
- GitHub integration (issues → PRs)
- Long-horizon planning (can work on multi-day tasks)
- Knowledge base for project-specific context

**Pricing**: $20/month base + credit-based usage (drew criticism in 2025 when pricing changed)

**Ideal for**: Well-defined, spec-driven tasks; teams comfortable with autonomous AI

**Not ideal for**: Complex architectural decisions (needs human judgment), budget-sensitive teams, tasks requiring constant context

---

### 8. OpenCode

**By**: SST  
**Type**: Terminal CLI  
**Model**: Any LLM (95K GitHub stars)

OpenCode is a newer open-source terminal agent from the SST team. Gained rapid adoption (95K GitHub stars) in 2025–2026. Designed as a lightweight, fast alternative to Claude Code.

**Key features**:
- Open source
- Multi-model support
- Terminal-native
- Fast and lightweight

**Pricing**: Free (API costs only)

**Ideal for**: Open-source fans who want a lighter alternative to Claude Code

---

### 9. SWE-agent

**By**: Princeton NLP (research)  
**Type**: Research agent framework  
**Model**: Various (research-oriented)

SWE-agent is the academic research project that introduced the SWE-bench benchmark. It pioneered many concepts now used by commercial agents (ReAct loops, bash-only evaluation). The mini-SWE-agent v2 is now used for the official bash-only benchmark.

**SWE-bench Verified**: ~45-50% (SWE-agent 1.0 with Claude 3.7, 2025)

**Key features**:
- Research-grade — designed for reproducibility
- ACI (Agent-Computer Interface) abstraction
- Used as reference implementation for SWE-bench evaluation

**Ideal for**: Researchers studying agent behavior; not for production use

---

### 10. OpenHands (formerly OpenDevin)

**By**: All Hands AI  
**Type**: Cloud platform (open source)  
**Model**: Most public APIs

OpenHands is an open-source cloud-based coding agent. It supports a sandboxed environment with browser, terminal, and file access. Available as a hosted service.

**SWE-bench Verified**: ~50-55% with Claude

**Key features**:
- Open source under Apache 2.0
- Browser automation built-in
- Full tool access in sandboxed environment
- Self-hostable

**Pricing**: Usage-based (cloud) or self-hosted

**Ideal for**: Teams wanting a Devin-like experience without the proprietary lock-in

---

## Head-to-Head Comparison Tables

### Capability Matrix

| Feature | Claude Code | Codex CLI | Cursor | Cline | Aider | Copilot | Devin |
|---------|------------|-----------|--------|-------|-------|---------|-------|
| Terminal access | ✅ | ✅ | ✅ | ✅ | Limited | ✅ | ✅ |
| Multi-file editing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Browser/computer use | Limited | ❌ | Limited | ✅ | ❌ | ❌ | ✅ |
| Git native | ✅ | ✅ | ✅ | ✅ | ✅ (best) | ✅ | ✅ |
| Voice coding | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| MCP support | ✅ | ✅ (Agents SDK) | ✅ | ✅ | ❌ | ✅ | Limited |
| Model flexibility | ❌ (Anthropic only) | ❌ (OpenAI only) | ✅ | ✅ | ✅ (any) | Partial | ❌ |
| Codebase indexing | ✅ | Partial | ✅ (deep) | Partial | ✅ (AST map) | ✅ (@workspace) | ✅ |
| Auto-commit | ✅ | ✅ | ✅ | ✅ | ✅ (native) | Via agent | ✅ |
| Background/async | ✅ (worktrees) | ✅ (worktrees) | ✅ (cloud) | ❌ | ❌ | ✅ (cloud) | ✅ |
| Open source | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Plan mode | ✅ (ask mode) | ❌ | Limited | ✅ (Plan/Act) | ✅ (ask mode) | ✅ (Plan) | ❌ |
| Local models | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Inline autocomplete | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ (best) | ❌ |

### Autonomy Spectrum

```
Less autonomous                              More autonomous
────────────────────────────────────────────────────────────
Copilot     Cursor      Aider       Cline     Claude Code   Devin
(autocomplete  (agent    (cli +     (plan/act  (terminal    (fully
+ chat)     + IDE)     git loop)    + tools)   + agents)   async)
```

---

## Pricing Comparison

| Tool | Free tier | Entry paid | Heavy usage |
|------|-----------|-----------|-------------|
| Aider | ✅ (own API key) | — | ~$1-50/mo (DeepSeek) / $15-50 (Claude) |
| Cline | ✅ (own API key) | — | ~$20-100/mo (API costs) |
| OpenCode | ✅ (own API key) | — | ~$20-100/mo |
| Claude Code | ❌ | $20/mo (Pro plan) | $200/mo (Max) |
| Codex CLI | ❌ | $20/mo (OpenAI) | API costs |
| Cursor | ❌ | $20/mo (Pro) | $200/mo (Ultra) |
| Copilot | ❌ | $10/mo (individual) | $39/user/mo (Enterprise) |
| Devin | ❌ | $20/mo base | Varies (ACU credits) |
| OpenHands | ✅ (self-host) | Usage-based | API costs |
| Windsurf | ❌ | $15/mo | Usage-based |

**Most cost-effective path**: Use Aider or Cline with DeepSeek V3 (~$0.34/run on benchmark) for high-volume tasks; Claude/GPT for complex reasoning.

---

## Use Case Fit Matrix

| Use case | Best tool | Runner-up |
|----------|-----------|-----------|
| Daily feature development (IDE) | Cursor | Copilot |
| Complex bug fixing / refactor | Claude Code | Aider + o3 |
| High-volume task automation | Codex CLI | Aider + DeepSeek |
| GitHub issue → PR (async) | Copilot Workspace | Devin |
| Open-source / budget-conscious | Cline | Aider |
| Voice coding | Aider | — |
| Browser / visual debugging | Cline | Cursor (limited) |
| Local models | Cline + Ollama | Aider + Ollama |
| Enterprise (GitHub) | Copilot Enterprise | Cursor Business |
| Research / academic | SWE-agent | OpenHands |
| API/tool integration via MCP | Claude Code | Cline |
| Full autonomous (multi-day tasks) | Devin | OpenHands |

---

## The Big Three (2026)

Based on user base, capability, and developer mindshare, three tools dominate:

### 1. Claude Code — "Depth champion"
- Best reasoning on hard problems
- 80.9% SWE-bench (Opus 4.5)
- $2.5B ARR, >50% of Anthropic revenue
- **Verdict**: Best when you hit a problem other tools give up on

### 2. Codex CLI — "Speed champion"  
- Fastest throughput (240+ tokens/sec)
- 77.3% Terminal-Bench 2.0
- 1M+ developers in first month
- Open source
- **Verdict**: Best for high-volume, speed-critical workflows

### 3. Cursor — "IDE champion"
- Most polished IDE experience
- 1M+ users, 360K paying
- Fortune 500 adoption
- Best codebase understanding in IDE context
- **Verdict**: Best for daily IDE-based feature development

---

## Architecture Categories

### Terminal agents (CLI-first)
**Tools**: Claude Code, Codex CLI, Aider, OpenCode, Gemini CLI, Goose

- Compose with Unix tools (piping, scripting)
- Work in any directory without IDE setup
- Better for automation and CI/CD
- Typically support git worktrees for parallelism

### IDE extensions
**Tools**: Cline, Copilot, Augment, Continue, Roo Code, Amazon Q

- Live inside VS Code / JetBrains
- See linting errors, diagnostics in real-time
- Better for interactive feedback loops
- Access to VS Code APIs (diff viewer, etc.)

### Dedicated IDEs
**Tools**: Cursor, Windsurf, Zed, Kiro, Google Antigravity

- VS Code fork or custom editor
- Deepest AI integration (can modify editor itself)
- Best for teams that want AI as the primary interface
- Higher adoption barrier (different app to install)

### Cloud platforms
**Tools**: Devin, OpenHands, Genie, Jules, Codex Cloud, Copilot Workspace

- Fully asynchronous — assign task, come back later
- Sandboxed VM environments (safer)
- GitHub integration for PR workflows
- Higher latency (minutes to hours per task)
- Best for well-defined, spec-driven tasks

---

## What the Benchmarks Miss

SWE-bench and similar benchmarks are valuable but miss important real-world factors:

### 1. Developer experience / friction
- How much back-and-forth does it take to get the right result?
- Is the UI intuitive?
- How fast is the edit loop?

### 2. Context quality on YOUR codebase
- SWE-bench uses well-known Python repos — your proprietary codebase is different
- Agents may struggle without codebase-specific knowledge

### 3. Cost predictability
- A tool that "burns $150/month unpredictably" is worse than a $20/month tool
- Token costs from autonomous exploration add up fast

### 4. Merge rate (not just solve rate)
- Devin reportedly achieves 67% PR merge rate on "defined tasks"
- Mergeability requires code quality, test coverage, and style compliance — not just passing tests

### 5. Multi-language performance
- SWE-bench full is Python-only
- SWE-PolyBench addresses this, but fewer agents are evaluated there

### 6. Privacy and data governance
- Enterprise teams can't send proprietary code to third-party LLMs
- On-premise / local model support is critical for some users

---

## Sources

- Aider LLM leaderboard: https://aider.chat/docs/leaderboards/
- SWE-bench Verified leaderboard: https://www.swebench.com/verified.html
- SWE-Rebench: https://swe-rebench.com
- Morph LLM 15 agents comparison: https://www.morphllm.com/ai-coding-agent
- Artificial Analysis agents comparison: https://artificialanalysis.ai/insights/coding-agents-comparison
- AI agent benchmark (80+ agents): https://github.com/murataslan1/ai-agent-benchmark
- Codegen.com best coding agents 2026: https://codegen.com/blog/best-ai-coding-agents/
- SemiAnalysis Claude Code ARR: https://newsletter.semianalysis.com/p/claude-code-is-the-inflection-point
- Epoch AI SWE-bench Verified: https://epoch.ai/benchmarks/swe-bench-verified
- Devin vs Claude guide: https://devin.no/blog/devin-vs-claude-2025-guide-to-ai-coding-assistants
- Best Devin alternatives: https://www.augmentcode.com/tools/best-devin-alternatives
