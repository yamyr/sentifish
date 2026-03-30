# Aider: AI Pair Programming in Your Terminal

> Deep-dive research into Aider's architecture, edit strategies, voice coding, model support, and benchmarks.
> Last updated: March 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Repository Map](#repository-map)
4. [Edit Formats (Strategies)](#edit-formats-strategies)
5. [Chat Modes](#chat-modes)
6. [Voice-to-Code](#voice-to-code)
7. [Model Support & Leaderboards](#model-support--leaderboards)
8. [CLI Usage & Key Commands](#cli-usage--key-commands)
9. [Git Integration](#git-integration)
10. [Large Repo Handling](#large-repo-handling)
11. [Architect Mode Deep Dive](#architect-mode-deep-dive)
12. [Benchmarks vs Other Agents](#benchmarks-vs-other-agents)
13. [Strengths & Weaknesses](#strengths--weaknesses)
14. [Sources](#sources)

---

## Overview

**Aider** is an open-source, terminal-based AI pair programming tool that lets you write and edit code by chatting with large language models. Unlike IDE plugins, Aider runs from the command line and integrates deeply with your existing git repository. It was created by Paul Gauthier and is maintained by the Aider-AI community under a permissive open-source license.

Key facts:
- Launched: 2023, active development through 2025–2026
- Category: Local Non-IDE CLI coding agent
- Model compatibility: Virtually any LLM (OpenAI, Anthropic, Google Gemini, DeepSeek, Groq, Ollama, local models via GGUF)
- Language support: 100+ programming languages
- Core design: works in any terminal alongside your existing editor; edits real files in your local git repo

Aider is positioned as a "coding agent you can trust" — it makes precise, reviewable edits to your files, commits them to git with auto-generated messages, and never requires you to leave your terminal.

---

## Architecture

Aider's architecture is relatively simple but clever:

```
User prompt
    │
    ▼
Aider CLI (Python)
    │
    ├── Repo Map generator (tree-sitter AST analysis)
    │
    ├── Context manager (file content + map → LLM prompt)
    │
    ▼
LLM API call (openai/anthropic/google/etc.)
    │
    ▼
Edit parser (format: whole / diff / udiff / diff-fenced)
    │
    ▼
File writer → Git commit
```

### Core components

| Component | Role |
|-----------|------|
| `Coder` class | Orchestrates chat, context, and file editing |
| `RepoMap` | Generates a compact AST-based map of the whole git repo |
| `Commands` | Handles in-chat slash commands (`/add`, `/drop`, `/commit`, etc.) |
| `Voice` | Transcribes audio input via OpenAI Whisper |
| `Model` | Abstraction layer over LLM APIs via `litellm` |
| `IO` | Handles terminal I/O, colored output, diffs display |

Aider uses the [`litellm`](https://github.com/BerriAI/litellm) library as a universal routing layer, which lets it call virtually any LLM API through a unified interface.

---

## Repository Map

One of Aider's most distinctive features is its **repository map** — a compact, token-efficient representation of the entire codebase.

### How it works

1. Aider uses **tree-sitter** to parse every file in the git repo and extract:
   - Class definitions and their methods
   - Function signatures with argument types
   - Call relationships between files

2. These symbols are organized into a graph where nodes are source files and edges are import/call dependencies.

3. A **PageRank-style graph ranking algorithm** identifies the most important symbols relative to the current conversation and the files being edited.

4. The top-ranked symbols (fitting within the configured token budget) are rendered into a compact text format and prepended to every LLM prompt.

### Example repo map snippet

```
aider/coders/base_coder.py:
⋮...
│class Coder:
│ abs_fnames = None
⋮...
│ @classmethod
│ def create(self, main_model, edit_format, io, ...)
⋮...
│ def abs_root_path(self, path):
⋮...

aider/commands.py:
⋮...
│class Commands:
│ voice = None
│ def get_commands(self):
│ def run(self, inp):
⋮...
```

### Configuration

- Default token budget: `--map-tokens 1024` (1k tokens)
- Aider **dynamically expands** the map when no files are in context (to maximize understanding)
- For monorepos: use `--subtree-only` or `.aiderignore` to scope the map
- The map is updated with every message to reflect current conversation state

### Benefits

- The LLM can understand the full codebase structure without reading every file
- The model can self-request additional files when needed
- Prevents "hallucinating" APIs that don't exist in the codebase

---

## Edit Formats (Strategies)

Aider supports multiple **edit formats** — the structured text format used to instruct the LLM how to specify code changes. Different models work better with different formats. Aider auto-selects the optimal format per model, but you can override with `--edit-format`.

### 1. `whole` — Simplest

The LLM returns the **complete updated file content**. Simple, reliable, but expensive for large files (tokens scale with file size, not change size).

```
show_greeting.py
```python
import sys

def greeting(name):
    print("Hey", name)

if __name__ == '__main__':
    greeting(sys.argv[1])
```
```

**Best for**: Small files; models that struggle with diff syntax; first-time setup.

**Downsides**: Token-heavy. A 500-line file with a 2-line fix still costs 500-line tokens.

---

### 2. `diff` — Search/Replace blocks

The LLM specifies changes as `SEARCH/REPLACE` blocks using a syntax similar to git merge conflicts:

```
mathweb/flask/app.py
<<<<<<< SEARCH
from flask import Flask
=======
import math
from flask import Flask
>>>>>>> REPLACE
```

- Only changed sections need to be returned
- Very token-efficient
- The SEARCH block must match exactly (whitespace-sensitive)
- **Default format for most modern models** (Claude Sonnet, DeepSeek, GPT-4o)

---

### 3. `udiff` — Unified diff format

Based on the classic `diff -u` format, but simplified:

```diff
--- mathweb/flask/app.py
+++ mathweb/flask/app.py
@@ ... @@
-class MathWeb:
+import sympy
+
+class MathWeb:
```

Originally developed to combat **lazy coding in GPT-4 Turbo** — when asked to return full files or search/replace blocks, early GPT-4 Turbo would elide large sections with `# … original code here …` comments. Unified diffs made it **3× less lazy** (see Aider blog, Dec 2023).

Still used as fallback or when `--edit-format udiff` is explicitly set.

---

### 4. `diff-fenced` — Diff with file path inside fence

Variation of `diff` used primarily for **Gemini models** that fail to properly place the file path before the opening fence:

```
```mathweb/flask/app.py
<<<<<<< SEARCH
from flask import Flask
=======
import math
from flask import Flask
>>>>>>> REPLACE
```
```

---

### 5. `editor-diff` / `editor-whole`

Streamlined versions of `diff`/`whole` used exclusively in **Architect mode** for the editor model. Uses a simpler prompt focused purely on file editing rather than problem-solving.

### Format selection heuristic

Aider selects the optimal format automatically:

| Model family | Default format |
|---|---|
| Claude Sonnet/Opus | `diff` |
| GPT-4o, GPT-4.1 | `diff` |
| o1, o3 family | `diff` |
| Gemini family | `diff-fenced` |
| Local models (Ollama) | `whole` |
| GPT-4 Turbo (legacy) | `udiff` |

---

## Chat Modes

Aider has four distinct chat modes that govern how it responds to messages:

### `code` mode (default)
Aider edits files. The LLM proposes code changes, Aider applies them, and commits to git.

```bash
> /code Fix the authentication bug in auth.py
```

### `ask` mode
Aider discusses code but **never modifies files**. Useful for exploration, understanding, and architecture discussions.

```bash
> /ask What's the best approach to refactor this module?
```

### `architect` mode
Two-model pipeline: one model plans, another edits. See [Architect Mode](#architect-mode-deep-dive).

```bash
> /architect Redesign the database schema for better performance
```

### `help` mode
Answers questions about Aider itself.

```bash
> /help How do I use Aider with a local Ollama model?
```

### Switching modes

```bash
# Sticky switch (affects all subsequent messages)
/chat-mode code
/chat-mode architect
/chat-mode ask

# Per-message switch (reverts after one message)
/ask What does this function do?
/code Now fix the bug we found
```

### Recommended ask/code workflow

1. Start in `/ask` mode — explore the problem, discuss options
2. Once aligned on the approach, switch to `/code`
3. Give a terse directive like "go ahead" — Aider uses the full conversation context from the ask phase

---

## Voice-to-Code

Aider supports **voice-controlled coding** via integration with OpenAI's Whisper speech recognition.

### How it works

1. User runs `/voice` in the Aider chat
2. Aider starts recording audio from the microphone
3. Press `ENTER` to stop recording
4. Audio is transcribed by Whisper API (or local Whisper model)
5. The transcript is injected into the chat as if you had typed it

### Setup

```bash
pip install aider-chat[voice]
# Or:
pip install pyaudio
```

Requires `OPENAI_API_KEY` for cloud Whisper, or a local Whisper installation.

### Example session

```
Aider v0.11.2-dev
Added app.py to the chat.

> /voice
Recording, press ENTER when done... 3.5sec
"add a factorial endpoint that uses math factorial"

Add a factorial endpoint that uses math.factorial.

app.py
<<<<<<< SEARCH
if __name__ == '__main__':
    print("Starting...")
    app.run()
=======
@app.route('/fact/<int:x>')
def factorial(x):
    result = math.factorial(x)
    return str(result)

if __name__ == '__main__':
    print("Starting...")
    app.run()
>>>>>>> REPLACE

Applied edit to app.py
Commit ef9e3e7 aider: Add a factorial endpoint that uses math.factorial.
```

### Workflow integration

Voice is particularly useful for:
- Hands-free coding while reviewing diffs on screen
- Rapid iteration ("make it async", "add error handling")
- Accessibility use cases

---

## Model Support & Leaderboards

Aider works with virtually any LLM via `litellm`. It maintains a public **code editing leaderboard** at `aider.chat/docs/leaderboards/` showing model performance on Aider's internal benchmark (polyglot coding tasks).

### Top performers (2025–2026, Aider code editing benchmark)

| Model | Score | Cost/run | Edit format |
|-------|-------|----------|-------------|
| GPT-5 (high) | 88.0% | $29.08 | diff |
| o3-pro (high) | 84.9% | $146.32 | diff |
| Gemini 2.5 Pro (32k think) | 83.1% | $49.88 | diff-fenced |
| o3 (high) | 81.3% | $21.23 | diff |
| Grok-4 (high) | 79.6% | $59.62 | diff |
| Gemini 2.5 Pro (default) | 79.1% | $45.60 | diff-fenced |
| o3 (high) + GPT-4.1 | 78.2% | $17.55 | architect |
| Claude Opus 4 (32k think) | 72.0% | $65.75 | diff |
| DeepSeek R1 (0528) | 71.4% | $4.80 | diff |
| Claude 3.7 Sonnet (32k think) | 64.9% | $36.83 | diff |
| Claude 3.7 Sonnet (no think) | 60.4% | $17.72 | diff |
| DeepSeek V3 (0324) | 55.1% | $1.12 | diff |
| claude-3-5-sonnet | 51.6% | $14.41 | diff |
| DeepSeek Chat V3 | 48.4% | $0.34 | diff |
| GPT-4o-2024-08-06 | 23.1% | $7.03 | diff |

### Connecting to different providers

```bash
# OpenAI
aider --model gpt-4o

# Anthropic
aider --model claude-3-5-sonnet-20241022

# DeepSeek (very cost-effective)
aider --model deepseek/deepseek-chat

# Google Gemini
aider --model gemini/gemini-2.5-pro-preview-03-25

# Architect mode with separate editor
aider --model o3 --editor-model claude-3-5-sonnet-20241022

# Local Ollama model
aider --model ollama/codellama:34b

# OpenRouter (access many models)
aider --model openrouter/anthropic/claude-3-opus
```

---

## CLI Usage & Key Commands

### Starting Aider

```bash
# Basic start in current git repo
aider

# Add specific files
aider src/auth.py src/models.py

# Add files with wildcards
aider src/*.py

# Start in architect mode
aider --architect

# Start with specific model
aider --model claude-3-5-sonnet-20241022

# Non-interactive (scripted) mode
aider --message "Add docstrings to all functions" src/utils.py

# Read from file
aider --message-file tasks.md
```

### In-chat slash commands

| Command | Description |
|---------|-------------|
| `/add <file>` | Add file to context |
| `/drop <file>` | Remove file from context |
| `/ls` | List files in context |
| `/diff` | Show git diff of recent changes |
| `/undo` | Undo last commit made by Aider |
| `/commit` | Commit current changes with AI-generated message |
| `/run <cmd>` | Run a shell command and optionally add output to context |
| `/test <cmd>` | Run tests; add failures to context for fixing |
| `/voice` | Start voice input recording |
| `/ask <question>` | Ask a question without editing |
| `/code <task>` | Request a code change |
| `/architect <task>` | Use architect mode for this message |
| `/model <name>` | Switch the active model |
| `/editor-model <name>` | Change editor model |
| `/chat-mode <mode>` | Switch active mode |
| `/reset` | Drop all files and clear chat history |
| `/clear` | Clear chat history only |
| `/tokens` | Show token usage for current context |
| `/map` | Show the current repo map |
| `/map-refresh` | Force refresh of repo map |
| `/git <cmd>` | Run a git command |
| `/help` | Show help |

### Important flags

```bash
--edit-format <format>      # Force specific edit format
--map-tokens <n>            # Repo map token budget (default 1024)
--subtree-only              # Limit map to current subdirectory
--no-auto-commits           # Disable auto git commits
--dirty-commits             # Allow commits with uncommitted changes
--auto-test                 # Run tests after each edit
--stream / --no-stream      # Toggle streaming output
--verbose                   # Show full prompts sent to LLM
--show-diffs                # Always show diffs of edits
--dark-mode / --light-mode  # Terminal color theme
--encoding <enc>            # File encoding (default utf-8)
--config <file>             # Load config from YAML file
--env-file <file>           # Load env vars from file
```

---

## Git Integration

Aider's git integration is first-class:

- **Auto-commits**: Every successful edit is committed with an AI-generated message
- **Commit message format**: `aider: <description of change>`
- **Undo support**: `/undo` reverts the last Aider commit
- **Dirty repo handling**: Aider warns about uncommitted changes before starting
- **Branch awareness**: Aider knows which branch you're on and respects git conventions
- **`.aiderignore`**: Like `.gitignore` — tells Aider to ignore certain files from its map/context

### Example commit history

```
git log --oneline
ef9e3e7 aider: Add a factorial endpoint that uses math.factorial
3a2f1b0 aider: Fix import ordering in auth.py
9c7d4e1 aider: Add docstrings to User model methods
```

---

## Large Repo Handling

Aider is not optimized for very large monorepos out of the box, but provides tools to manage them:

### Strategies

1. **Subtree mode**: `aider --subtree-only` limits the repo map to the current directory
2. **`.aiderignore`**: Exclude irrelevant directories

```
# .aiderignore
/node_modules/
/vendor/
/build/
/dist/
!src/
!src/**
```

3. **Manual file addition**: Only add the files you're working on
4. **Map token budget**: Reduce with `--map-tokens 512` for performance

---

## Architect Mode Deep Dive

Architect mode splits coding into two LLM passes:

```
User prompt
    │
    ▼
Architect model
(Reasoning: what needs to change and why)
    │ Plain text plan
    ▼
Editor model
(Implementation: exact diff/whole edits)
    │
    ▼
File changes
```

### Why it exists

Some models (especially o1, o3, DeepSeek R1) are excellent reasoners but poor at generating syntactically correct diffs. By separating the reasoning from the implementation:
- The architect focuses on *what* and *why*
- The editor focuses on *how* (precise file edits)

### Optimal pairings

| Use case | Architect | Editor |
|----------|-----------|--------|
| Maximum quality | o3 | GPT-4.1 or Sonnet |
| Cost-effective | DeepSeek R1 | DeepSeek Chat V3 |
| All-Claude | Claude Opus | Claude Sonnet |
| Speed | Sonnet | Haiku |

### Configuration

```bash
# Use o3 as architect, GPT-4.1 as editor (Aider's example)
aider --architect --model o3 --editor-model gpt-4.1

# Shorthand flag
aider --architect

# In chat
/architect Refactor the payment module to support multiple currencies
```

The editor model uses `editor-diff` or `editor-whole` format by default — a simplified version optimized for pure file editing tasks.

---

## Benchmarks vs Other Agents

### Aider's own benchmark

Aider maintains a **polyglot code editing benchmark** measuring correct code changes across 133 exercises in Python, JavaScript, TypeScript, Go, Rust, and more.

### SWE-bench Verified (representative scores, 2024–2025)

| Agent / System | SWE-bench Verified | Notes |
|---|---|---|
| Claude Opus 4.5 (best agent) | ~80.9% | Top result on leaderboard |
| GPT-5 Codex | ~77–80% | Via OpenAI Codex scaffold |
| Claude Code (Opus 4.5) | ~80.9% | Anthropic's own agent |
| Aider + o3 (high) | 81.3% | On Aider's benchmark |
| Aider + Gemini 2.5 Pro | 79.1–83.1% | Varies by thinking budget |
| Aider + DeepSeek R1 | 56.9–74.2% | Very cost-effective |
| OpenHands + Claude | ~50–60% | Multi-agent framework |
| SWE-agent 1.0 (Sonnet) | ~40–50% | Research agent |

> Note: Direct SWE-bench comparisons are complex — different agents use different evaluation methodologies.

### Aider vs other terminal agents (qualitative)

| Factor | Aider | Claude Code | Codex CLI |
|--------|-------|-------------|-----------|
| Model choice | Any LLM | Anthropic only | OpenAI only |
| Git integration | Native, deep | Good | Basic |
| Repo map | ✅ Tree-sitter AST | ✅ Context window | Limited |
| Edit formats | 5 formats | Tool-based | Tool-based |
| Voice input | ✅ | ❌ | ❌ |
| Cost control | Full (your API key) | Subscription + usage | Subscription + usage |
| Open source | ✅ Apache 2 | ❌ | ✅ MIT |
| SWE-bench | Top-tier w/ right model | 80.9% (Opus 4.5) | 77%+ (GPT-5) |
| UI | Terminal | Terminal | Terminal |

---

## Strengths & Weaknesses

### ✅ Strengths

1. **Model flexibility**: Use any LLM — from GPT-5 to local Ollama models. No lock-in.
2. **Token efficiency**: Diff formats and smart repo mapping minimize token costs
3. **Git-native**: Auto-commit, undo, diff — coding feels like pair programming with a careful teammate
4. **Voice coding**: Unique feature for hands-free workflows
5. **Architect mode**: Leverages reasoning models for planning + cheap models for editing
6. **Benchmark leader**: Consistently near top on code editing benchmarks with the right model
7. **Open source**: Fully auditable, customizable, extensible
8. **Works in any terminal**: No IDE dependency, compose with vim/emacs/VSCode as you prefer
9. **Active development**: Releases frequently, leaderboard updated regularly

### ❌ Weaknesses

1. **No IDE integration**: No diff viewer, syntax highlighting in edits, or inline suggestions
2. **Large repo performance**: Slow on massive monorepos; map computation takes time
3. **Context limits**: Very large files can overflow context even with diff formats
4. **No built-in browser/computer use**: Cannot browse the web or interact with GUIs (unlike Cline)
5. **No multi-agent**: Single-agent loop; no parallelism like Claude Code's subagents
6. **Setup friction**: Requires knowing which model to use; beginners may be confused by options
7. **No persistent memory**: Each session starts fresh; no project-level memory (unlike some cloud agents)

---

## Sources

- Official Aider documentation: https://aider.chat/docs/
- Edit formats: https://aider.chat/docs/more/edit-formats.html
- Unified diffs blog post: https://aider.chat/docs/unified-diffs.html
- Chat modes: https://aider.chat/docs/usage/modes.html
- Repository map: https://aider.chat/docs/repomap.html
- Voice coding: https://aider.chat/docs/usage/voice.html
- LLM leaderboards: https://aider.chat/docs/leaderboards/
- FAQ: https://aider.chat/docs/faq.html
- Aider GitHub: https://github.com/Aider-AI/aider
- Architect mode blog: https://aider.chat/2024/09/26/architect.html
- Unified diffs research: https://aider.chat/2023/12/21/unified-diffs.html
- SWE-bench Verified leaderboard: https://www.swebench.com/verified.html
- Aider coding tools comparison: https://www.ikangai.com/agentic-coding-tools-explained-complete-setup-guide-for-claude-code-aider-and-cli-based-ai-development/
