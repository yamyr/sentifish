# SWE-agent: Agent-Computer Interface Framework

> Research compiled March 2026. Sources: arXiv paper 2405.15793, GitHub repo, NeurIPS 2024 proceedings, Princeton/Stanford research team.

---

## Overview

**SWE-agent** is an open-source framework for automated software engineering, developed by researchers at **Princeton University** (with co-authors from Stanford). It was published as a NeurIPS 2024 paper: *"SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering"* (arXiv:2405.15793).

The framework's central thesis is that the **interface between an LLM agent and the computer** — called the **Agent-Computer Interface (ACI)** — is as important as the underlying model. Poor interfaces cause agents to fail not because of model capability, but because of bad tooling design.

SWE-agent is designed to:
1. Take a **GitHub issue** as input
2. Navigate the codebase autonomously
3. Write a **patch** (diff) that fixes the issue
4. Submit the patch for evaluation

It also supports offensive cybersecurity (CTF challenges) and competitive coding via modular ACIs.

---

## The Agent-Computer Interface (ACI) Concept

The ACI is the paper's core contribution. It is defined as the set of:
- **Commands** the agent can issue to the computer
- **Feedback** the computer returns to the agent

The ACI is analogous to how a **Human-Computer Interface (HCI)** is designed for human usability. The SWE-agent team argues that just as bad HCI makes software unusable for humans, bad ACI makes computers unusable for LLM agents.

### ACI Design Principles (from the paper)

1. **Action space matters**: Raw bash is too powerful (too many ways to fail); too restricted means the agent can't do its job
2. **Feedback must be interpretable**: The agent needs to understand what happened after each action
3. **Error prevention is better than error recovery**: Lint before committing; validate before applying
4. **Reduce cognitive load**: Custom tools reduce how much the model has to remember

### Key ACI Features in SWE-agent

| Feature | Description |
|---------|-------------|
| Custom file viewer | Shows files with line numbers in a windowed view (not raw `cat`) |
| Syntax-checked editing | Linter runs before any edit is applied; rejects syntactically invalid changes |
| Search/navigation tools | `find_file`, `search_file`, `search_dir` for structured code navigation |
| File editor | `edit` command with line ranges instead of full-file rewrites |
| Context management | `open` shows file with scrollable window; `scroll_up`/`scroll_down` navigate |
| Interactive bash | Persistent bash session, not one-shot commands |

---

## Architecture

### System Components

```
SWE-agent
├── Environment (Docker container with repo)
│   ├── Bash shell (persistent session)
│   ├── File system (checked-out repository)
│   └── Git integration
├── Agent
│   ├── Thought generation (CoT reasoning)
│   ├── Action selection (command from ACI)
│   └── Memory (conversation history)
├── ACI Layer
│   ├── Tool bundles (configurable)
│   ├── Custom commands (search, view, edit)
│   └── Feedback formatter
└── Orchestrator
    ├── Issue → Agent → Patch pipeline
    └── Evaluation harness
```

### Execution Loop

At each step, SWE-agent follows a **thought-action-observation** loop:

1. **Thought**: The LLM generates reasoning about what to do next (chain-of-thought)
2. **Action**: The LLM issues one ACI command
3. **Observation**: The ACI returns structured feedback
4. **Repeat** until `submit` is called with the patch

This ReAct-style loop (Reasoning + Acting) runs until the agent submits a patch or hits the step limit.

### Environment

SWE-agent runs each task in a **Docker container** that:
- Contains the exact repository version referenced in the issue
- Has Python/pip pre-installed
- Includes the SWE-agent ACI tool suite
- Has network access disabled (no browser) — unlike Devin

---

## Tool Bundles

SWE-agent organizes tools into configurable **bundles**:

### Core Tools (Default Bundle)

- **`bash`**: Run shell commands in persistent session
- **`open [path] [line]`**: View a file with windowed context (50 lines by default)
- **`scroll_up` / `scroll_down`**: Navigate within the open file
- **`goto [line]`**: Jump to specific line
- **`find_file [name]`**: Find files matching a name pattern
- **`search_file [term]`**: Search for string in current file
- **`search_dir [term] [dir]`**: Recursive string search across directory
- **`edit [start:end]`**: Edit lines in current file (validated before applying)
- **`submit`**: Submit the current git diff as the patch

### File Editor Tools

- Range-based editing (specify line numbers)
- Search-and-replace operations
- Whole-file rewrites (discouraged; range edits preferred)

### Linter Integration

Before any edit command is applied:
1. The proposed change is written to a temp file
2. The appropriate linter runs (flake8 for Python, eslint for JS, etc.)
3. If there are syntax errors, the edit is **rejected** and the agent receives the error message
4. The agent must fix the syntax before the edit is accepted

This dramatically reduces the occurrence of syntactically broken code in submitted patches.

---

## Benchmark Performance

### SWE-bench (Original)

SWE-bench presents 2,294 GitHub issues from 12 Python repositories. Agents must produce patches that pass the associated test suites.

| Model | Score (% resolved) |
|-------|-------------------|
| SWE-agent + GPT-4 | 12.5% |
| SWE-agent + Claude 3 Opus | 6.7% |
| SWE-agent + Claude 3.5 Sonnet | ~23% |
| Devin (launch, unassisted) | 13.86% |
| Previous SOTA (non-agent) | ~4.8% |

### SWE-bench Verified (subset of 500 verified instances)

By 2025, with stronger models:

| System | Score |
|--------|-------|
| SWE-agent + Claude 3.7 Sonnet | ~50%+ |
| SWE-agent + various | competitive with commercial agents |

### SWE-bench Lite (300 instances)

- SWE-agent + GPT-4: ~10-12%
- Later versions with better models: 30-40%+

### Key Insight from Ablation Studies

The paper includes extensive ablation studies showing that **ACI design directly impacts scores**:

- Removing the custom file viewer: -4-6% absolute
- Removing the linter: -3-5% absolute
- Using only raw bash: significant degradation
- Removing search tools: agent gets lost in large codebases

This validates the paper's core thesis that interface design is as important as model capability.

---

## How SWE-agent Differs from Other Harnesses

### vs. Devin

| Dimension | SWE-agent | Devin |
|-----------|-----------|-------|
| Open source | ✅ Yes (MIT) | ❌ No |
| Browser access | ❌ No | ✅ Yes |
| Deployment | ❌ No | ✅ Yes |
| Multi-agent | ❌ No | ✅ v2.0 |
| Slack integration | ❌ No | ✅ Yes |
| Cost | Free (bring your own API key) | Enterprise pricing |
| Focus | Benchmark/research | Production use |
| Sandboxing | Docker | Ubuntu VM |

### vs. Agentless

| Dimension | SWE-agent | Agentless |
|-----------|-----------|-----------|
| Architecture | Agent loop with tools | Fixed pipeline (no agent loop) |
| LLM autonomy | High (LLM chooses actions) | Low (LLM fills slots in pipeline) |
| Tool complexity | High (full ACI) | Low (file read + diff generation) |
| Cost per issue | Higher (many LLM calls) | Lower ($0.34/issue average) |
| Explainability | Lower | Higher |
| Performance ceiling | Higher (can adapt) | Lower (but surprisingly competitive) |

### vs. Aider

| Dimension | SWE-agent | Aider |
|-----------|-----------|-------|
| Interaction mode | Autonomous (no human) | Collaborative (human-in-loop) |
| Context management | Windowed file views | Repo-map + full file context |
| Target use | Benchmark automation | Daily coding assistance |
| Model flexibility | Configurable | Multi-model (Architect+Editor) |

---

## Open Source & Ecosystem

SWE-agent is hosted at: https://github.com/SWE-agent/SWE-agent

Key repo structure:
```
SWE-agent/
├── config/           # YAML configs for tools and models
│   └── tools/        # Tool bundle definitions
├── sweagent/         # Core library
│   ├── agent/        # Agent loop, history management
│   ├── environment/  # Docker container interface
│   └── tools/        # ACI implementation
├── trajectories/     # Saved agent runs for analysis
└── docs/             # Documentation site (swe-agent.com)
```

### Extensions

- **SWE-agent for CTF**: Modified ACI for capture-the-flag cybersecurity challenges (published as EnIGMA)
- **SWE-agent for competitive coding**: Adapts to programming contest problems
- **Open SWE (LangChain)**: LangChain's open-source async coding agent inspired by SWE-agent
- **Multi-agent SWE**: Research extensions for multi-agent coordination

---

## Configuration System

SWE-agent uses YAML-based configuration for maximum flexibility:

```yaml
# Example tool bundle config
tools:
  - name: bash
    description: Run a bash command
    args:
      - command: str
  - name: open_file  
    description: Open a file in the viewer
    args:
      - path: str
      - line_number: int (optional)
  - name: edit_file
    description: Edit specific lines in the open file
    args:
      - start_line: int
      - end_line: int
      - replacement_text: str
```

This allows researchers to swap in different tool implementations, test ACI variants, and compare performance across configurations.

---

## Research Impact

The SWE-agent paper had significant impact:

1. **Established ACI as a research area**: Inspired a wave of work on LLM-specific interface design
2. **Provided an open benchmark harness**: Researchers can evaluate new models on SWE-bench easily
3. **Demonstrated browser-free performance**: Showed that careful tool design can substitute for web access
4. **Ablation methodology**: The systematic ACI ablations became a template for future agent research
5. **NeurIPS 2024**: Peer-reviewed publication adds credibility to claims

---

## Limitations

1. **No web access**: Cannot look up documentation like Devin can
2. **Python-centric**: Original SWE-bench is Python-only; JS/TS support added later
3. **No deployment**: Stops at patch submission; no end-to-end deployment
4. **Step limits**: Long tasks may hit token/step limits before resolving
5. **Docker dependency**: Requires Docker for sandboxed execution
6. **No multi-agent**: Single agent per task (though extensions exist)

---

## Sources

1. Yang et al. — "SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering" (arXiv:2405.15793, NeurIPS 2024): https://arxiv.org/abs/2405.15793
2. SWE-agent GitHub: https://github.com/SWE-agent/SWE-agent
3. SWE-agent Documentation: https://swe-agent.com/latest/
4. SWE-agent ACI background: https://github.com/SWE-agent/SWE-agent/blob/main/docs/background/aci.md
5. NeurIPS 2024 proceedings: https://proceedings.neurips.cc/paper_files/paper/2024/file/5a7c947568c1b1328ccc5230172e1e7c-Paper-Conference.pdf
6. Princeton University publication listing: https://collaborate.princeton.edu/en/publications/swe-agent-agent-computer-interfaces-enable-automated-software-eng/
7. FavTutor — "Open-Source AI SWE-Agent Takes on Devin": https://favtutor.com/articles/swe-agent-devin-alternative/
