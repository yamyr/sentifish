# Aider AI Coding Agent — Comprehensive Overview

> Research compiled: March 2026  
> Sources: aider.chat documentation, GitHub Aider-AI/aider

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Edit Formats](#edit-formats)
4. [Chat Modes](#chat-modes)
5. [Repository Map](#repository-map)
6. [Git Integration](#git-integration)
7. [Model Support](#model-support)
8. [Performance & Benchmarks](#performance--benchmarks)
9. [Configuration](#configuration)
10. [Linting & Testing](#linting--testing)
11. [Context Management](#context-management)
12. [Voice Integration](#voice-integration)
13. [Browser Interface](#browser-interface)
14. [Scripting & Automation](#scripting--automation)
15. [Advanced Features](#advanced-features)
16. [Comparison with Other Harnesses](#comparison-with-other-harnesses)
17. [Sources](#sources)

---

## Overview

Aider is an open-source AI pair programming tool for the terminal. Unlike many newer AI coding tools, Aider pioneered the pattern of AI pair programming directly in the terminal within a git repository. It's written in Python, works with virtually any LLM provider, and has a sophisticated approach to managing how code edits are communicated between the AI and the file system.

### Key Facts

- **Name**: Aider (AI + coder)
- **License**: Apache 2.0
- **Language**: Python
- **GitHub**: [Aider-AI/aider](https://github.com/Aider-AI/aider)
- **First release**: 2023
- **Tagline**: "AI pair programming in your terminal"
- **Primary use**: Interactive coding sessions with deep git integration

### Why Aider is Different

Aider's core innovations:
1. **Edit formats**: Specialized text formats that tell the LLM *how* to express code changes, optimized per-model
2. **Repository map**: Graph-ranked summary of the codebase included in every prompt
3. **Architect mode**: Two-model pipeline where one plans, another edits
4. **Deep git integration**: Every change is committed with AI-generated messages
5. **Benchmark-driven**: Publishes and optimizes for public coding benchmarks

---

## Architecture

### High-Level Components

```
aider/
├── coders/
│   ├── base_coder.py      # Core Coder class with agentic loop
│   ├── editblock_coder.py # SEARCH/REPLACE format
│   ├── wholefile_coder.py # Whole-file format
│   ├── udiff_coder.py     # Unified diff format
│   └── architect_coder.py # Architect mode orchestration
├── commands.py            # In-chat /commands implementation
├── io.py                  # Terminal I/O, streaming output
├── models.py              # LLM provider abstraction
├── repo.py                # Git repository operations
├── repomap.py             # Repository map generation
├── linter.py              # Linting integration
└── voice.py               # Voice input support
```

### Core Coder Class

The `Coder` class is the central engine:

```python
class Coder:
    abs_fnames = None  # Files added to the chat context
    
    @classmethod
    def create(cls, main_model, edit_format, io, ...):
        # Factory method — picks the right coder subclass for the edit format
        ...
    
    def run(self, with_message=None):
        # Main conversation loop
        # Handles user input → LLM → edit application → git commit
        ...
    
    def abs_root_path(self, path):
        # Resolve paths relative to git root
        ...
```

### Agentic Loop

Aider's agentic flow:

1. **User sends message** (or reads from stdin in scripted mode)
2. **Build prompt**:
   - System prompt (edit format instructions)
   - Repository map (ranked codebase summary)
   - Chat file contents (explicitly added files)
   - Conversation history
   - User message
3. **Query LLM** (streaming)
4. **Parse response** for edit blocks matching the active edit format
5. **Apply edits** to files
6. **Auto-fix issues** (if lint/test errors detected and auto-fix enabled)
7. **Git commit** with AI-generated message
8. **Return control** to user

### Context Window Management

Aider carefully manages what goes into the context:
- Explicitly added files: full content included
- Non-added files: only repo map entries (classes, function signatures)
- Conversation history: included up to context limit
- System prompt: static, always included

---

## Edit Formats

Edit formats are how Aider instructs the LLM to express file changes. This is one of Aider's key architectural innovations — different formats work better with different models.

### 1. `whole` Format

The simplest format — LLM returns the complete updated file:

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

**Pros**: Simple, reliable  
**Cons**: Expensive — entire file sent back even for small changes  
**Best for**: Small files, models that struggle with diff formats

### 2. `diff` Format (SEARCH/REPLACE)

The most common format — LLM specifies edits as search/replace blocks:

```
mathweb/flask/app.py
```
<<<<<<< SEARCH
from flask import Flask
=======
import math
from flask import Flask
>>>>>>> REPLACE
```
```

**Pros**: Efficient — only changed parts returned  
**Cons**: Requires exact match of SEARCH content  
**Best for**: Most models — used by default with Claude and GPT-4 family

### 3. `diff-fenced` Format

Like `diff` but with file path inside the fence:

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

**Best for**: Gemini family models (which struggle with external file path placement)

### 4. `udiff` Format

Based on unified diff format (simplified):

```diff
--- mathweb/flask/app.py
+++ mathweb/flask/app.py
@@ ... @@
-class MathWeb:
+import sympy
+
+class MathWeb:
```

**Best for**: GPT-4 Turbo (reduces "lazy coding" tendencies)

### 5. `editor-diff` and `editor-whole`

Streamlined versions for use with the **editor model** in architect mode:
- Narrower prompt focused purely on editing (not problem-solving)
- The architect has already solved the problem; the editor just applies the solution
- Reduces edit errors by separating reasoning from formatting

### Edit Format Selection

Aider automatically chooses the optimal edit format for the configured model. Override with:
```bash
aider --edit-format diff
```

---

## Chat Modes

Aider supports four chat modes:

### 1. `code` Mode (Default)

Aider makes changes to your code to satisfy requests:
```
> Refactor the authentication module to use JWT tokens
[Aider reads relevant files and applies changes]
```

### 2. `ask` Mode

Pure Q&A — Aider discusses code but never makes changes:
```
ask> What's the best way to implement rate limiting in this API?
[Aider explains options without modifying files]
```

### 3. `architect` Mode

Two-model pipeline:
1. **Architect model** (strong reasoning) proposes *how* to solve the problem
2. **Editor model** (efficient) translates proposal into specific file edits

```
architect> Can we simplify the authentication flow?
[Architect proposes: "Replace custom JWT with a library..."]
[Editor applies the specific code changes]
```

This is especially powerful with:
- OpenAI o1/o3 as architect + GPT-4o as editor
- Claude Opus as architect + Sonnet as editor

### 4. `help` Mode

Aider answers questions about its own usage and configuration:
```
help> How do I use aider with ollama?
> Run aider --model ollama/<ollama-model>.
```

### Switching Modes

```bash
# Switch mode for one message
/ask What's happening in auth.ts?
/architect Can we simplify this module?
/code Now implement the plan

# Sticky mode switch
/chat-mode architect

# Launch in architect mode
aider --architect
```

### Ask/Code Workflow Pattern

Recommended workflow:
1. Use `/ask` to discuss approach and get consensus
2. Switch to `/code` with minimal prompt ("go ahead")
3. The reasoning from ask mode improves code mode results

---

## Repository Map

The repository map is Aider's context-management innovation. Instead of loading all files, it generates a compact representation of the entire codebase.

### What the Repo Map Contains

For each file, the repo map includes:
- Key class names
- Function/method signatures (with types)
- Most frequently referenced symbols

Example output:
```
aider/coders/base_coder.py:
⋮...
│class Coder:
│ abs_fnames = None
⋮...
│ @classmethod
│ def create(cls, main_model, edit_format, io, ...):
│
│ def abs_root_path(self, path):
│
│ def run(self, with_message=None):
```

### How Map Optimization Works

1. Build a **dependency graph** where nodes are source files, edges are dependencies
2. Apply **graph ranking algorithm** (similar to PageRank) to identify important symbols
3. Select the most-referenced portions that fit within the **token budget**
4. Default token budget: 1024 tokens (adjustable with `--map-tokens`)

The budget is **dynamic** — expands when no files are added to chat (global understanding needed) and contracts when files are present (focused context).

### Benefits

- LLM can understand the codebase structure without reading every file
- LLM can identify which files to request for more context
- LLM writes new code that properly uses existing abstractions and APIs
- Scales to large codebases where full-file loading is impossible

---

## Git Integration

Aider is tightly coupled to git — it's designed to work *inside* a git repository.

### Auto-Commit

Every change Aider makes is automatically committed:
```bash
$ aider
> Add error handling to the login function

aider/auth.py: Added try/except block for database errors
aider/auth.py: Handle ConnectionError specifically

[Committed: "Add error handling to login function - handle DB and connection errors"]
```

### Commit Features

- **AI-generated commit messages**: Aider describes the change accurately
- **Atomic commits**: Each response results in one commit
- **Clean history**: Easy to track what Aider changed
- **Easy revert**: `git revert` any Aider commit if needed

### Git Configuration

```bash
# Disable auto-commit (review before committing)
aider --no-auto-commits

# Specify git repo root
aider --git /path/to/repo

# Auto-fix and commit after lint errors
aider --auto-lint

# Auto-run tests and fix on failure
aider --auto-test
```

### Working with Branches

Aider works on the current branch — no special branch management. Recommended workflow:
1. Create a feature branch: `git checkout -b feature/xyz`
2. Run aider: `aider`
3. Make changes interactively
4. Review commits with `git log`
5. Push and create PR

---

## Model Support

Aider supports 100+ LLM providers via [litellm](https://github.com/BerriAI/litellm):

### Supported Providers

| Provider | Key Config |
|----------|------------|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |
| Groq | `GROQ_API_KEY` |
| AWS Bedrock | AWS credentials |
| Azure OpenAI | `AZURE_API_KEY` |
| Cohere | `COHERE_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY` |
| xAI | `XAI_API_KEY` |
| Ollama | Local endpoint |
| LM Studio | Local endpoint |
| OpenRouter | `OPENROUTER_API_KEY` |
| GitHub Copilot | `GITHUB_TOKEN` |
| Vertex AI | GCP credentials |
| Any OpenAI-compatible | Custom `--openai-api-base` |

### Model Configuration

```bash
# Use specific model
aider --model claude-3-7-sonnet-20250219

# Use Gemini
aider --model gemini/gemini-2.5-pro-exp-03-25

# Use local Ollama model
aider --model ollama/codellama

# Architect mode with different models
aider --architect \
  --model claude-3-7-sonnet-20250219 \
  --editor-model claude-3-5-haiku-20241022

# Use reasoning model
aider --model o3 --reasoning-effort high
```

### Model Warnings

Aider warns when:
- Using a model not in its known-good list
- Applying reasoning settings to models that don't support them
- Context window may be insufficient

---

## Performance & Benchmarks

### Aider LLM Leaderboards

Aider publishes [public benchmarks](https://aider.chat/docs/leaderboards/) on coding tasks:

**Code Editing Leaderboard**
Tests basic code editing ability — given a task and failing tests, can the model make the tests pass?

**Refactoring Leaderboard**
Tests ability to refactor complex code while maintaining functionality.

### Top Performers (as of early 2026)

Based on Aider's benchmarks:
- **Claude models**: Consistently high performers, especially Sonnet 3.7
- **Gemini 2.5 Pro**: Strong performance on editing tasks
- **o-series models**: Strong on architect tasks but less optimal for editing alone

### Architect Mode Performance

Architect mode improves results for:
- Models that are strong reasoners but weaker editors (like o1/o3)
- Complex refactoring tasks where planning matters
- Large codebase changes requiring coordination

---

## Configuration

### YAML Config File

```yaml
# ~/.aider.conf.yml or .aider.conf.yml in project

model: claude-3-7-sonnet-20250219
edit-format: diff
auto-commits: true
auto-lint: true
auto-test: false
map-tokens: 1024
chat-history-file: .aider.chat.history.md
input-history-file: .aider.input.history
dark-mode: true
```

### .env File

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
```

### Key CLI Options

| Option | Description |
|--------|-------------|
| `--model` | Primary LLM model |
| `--editor-model` | Editor model in architect mode |
| `--edit-format` | Override edit format |
| `--chat-mode` | Starting mode (code/ask/architect) |
| `--architect` | Start in architect mode |
| `--auto-commits` / `--no-auto-commits` | Toggle auto-commit |
| `--auto-lint` | Auto-fix lint errors |
| `--auto-test` | Auto-run and fix test failures |
| `--map-tokens` | Repository map token budget |
| `--read` | Add read-only file to context |
| `--file` | Add file to chat context |
| `--yes-always` | Auto-confirm all prompts |
| `--voice-language` | Language for voice mode |

---

## Linting & Testing

### Auto-Lint

When enabled, after every edit:
1. Run the configured linter
2. If errors found, send them back to the LLM for fixing
3. Repeat until clean or limit reached

```bash
aider --auto-lint
# OR in config:
# auto-lint: true
```

### Auto-Test

Similar to auto-lint but for tests:
```bash
aider --auto-test --test-cmd "pytest tests/"
```

After each edit, runs the test suite. On failure, sends the error output to the LLM for fixing.

### Linter Configuration

```yaml
# .aider.conf.yml
lint-cmd:
  - "python: flake8 {files}"
  - "javascript: eslint --fix {files}"
  - "typescript: tsc --noEmit"
```

---

## Context Management

### Adding Files to Chat

```bash
# Add files at startup
aider auth.py user.py

# In-chat commands
/add src/auth.py
/add src/*.ts  # glob patterns

# Add read-only files (for context, not editing)
/read-only README.md architecture.md

# Drop files from context
/drop old-file.py
```

### Context Window Awareness

Aider provides visual feedback on context usage:
- Shows token count in prompt
- Warns when approaching limit
- Repository map automatically adjusts to fit budget

### Prompt Caching

Aider supports prompt caching to reduce costs:
```yaml
# Enable caching
cache-prompts: true
```

When enabled, static parts of the prompt (system prompt, repo map) are cached for reuse.

---

## Voice Integration

Aider supports voice-to-code:

```bash
# Start with voice enabled
aider --voice

# In-session
/voice
```

Workflow:
1. User speaks a coding request
2. Aider transcribes via the configured speech-to-text provider
3. Treats transcription as a text prompt
4. Makes code changes as usual

---

## Browser Interface

Aider has an experimental browser UI:

```bash
aider --browser
```

Opens a web interface (localhost) for users who prefer not to use the terminal. All functionality same as terminal — just a different front-end.

---

## Scripting & Automation

### Command-Line Scripting

```bash
# Non-interactive single shot
echo "Add docstrings to all functions" | aider --no-auto-commits

# Process files from a list
aider --yes-always --message "Add type hints" $(cat files_to_update.txt)

# CI/CD integration
aider --yes-always \
  --model claude-3-5-sonnet-20241022 \
  --auto-lint \
  --message "Fix all pylint errors"
```

### Python Scripting

```python
from aider.coders import Coder
from aider.models import Model
from aider.io import InputOutput

model = Model("claude-3-5-sonnet-20241022")
io = InputOutput(yes=True)

coder = Coder.create(
    main_model=model,
    io=io,
    fnames=["src/auth.py", "src/user.py"]
)

coder.run("Add comprehensive error handling")
```

---

## Advanced Features

### AI Comments (IDE Integration)

Aider can watch files for special AI comments:
```python
# ai: this function needs error handling
def process_data(items):
    for item in items:
        db.save(item)
```

When Aider detects `# ai:` comments, it automatically processes them.

### Infinite Output Support

For models that support prefill (output continuation), Aider can handle "infinite output" — responses longer than a single API call window by using completion/continuation patterns.

### Model Aliases

```yaml
# ~/.aider.conf.yml
model-aliases:
  fast: gpt-4o-mini
  smart: claude-3-7-sonnet-20250219
  local: ollama/codellama
```

Then use: `aider --model fast`

### Reasoning Models Configuration

```bash
# Use reasoning model with effort level
aider --model o3 --reasoning-effort high

# For secondary provider reasoning
aider --model claude-3-7-sonnet-20250219 --thinking-tokens 10000
```

### Copy/Paste with Web Chat

For models without API access, Aider supports a copy/paste workflow:
```bash
aider --copy-paste
```
Generates prompts you can paste into any web chat UI, then paste the response back.

---

## Comparison with Other Harnesses

| Feature | Aider | Claude Code | Codex CLI | OpenCode | Cline |
|---------|-------|-------------|-----------|----------|-------|
| **Open Source** | ✅ Apache 2 | ❌ | ✅ Apache 2 | ✅ MIT | ✅ Apache 2 |
| **Language** | Python | TypeScript | Rust | Go | TypeScript |
| **Interface** | Terminal CLI | Terminal + IDE | Terminal CLI | Terminal TUI | VS Code |
| **Git Integration** | ✅ Deep | ✅ | Limited | Limited | ✅ |
| **Edit Formats** | ✅ 5+ formats | Internal | Internal | Internal | Internal |
| **Architect Mode** | ✅ 2-model | ✅ Plan mode | ❌ | ✅ Plan mode | ❌ |
| **Repo Map** | ✅ Graph-ranked | ✅ (via tools) | ✅ (via tools) | ✅ | ✅ |
| **MCP Support** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Auto-commit** | ✅ Default on | Via hooks | ❌ | ❌ | ❌ |
| **Auto-lint** | ✅ | Via hooks | ❌ | Via LSP | Via LSP |
| **Benchmarks** | ✅ Public | ❌ | ❌ | ❌ | ❌ |
| **Voice** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Browser UI** | ✅ Experimental | ✅ claude.ai | ❌ | Desktop app | VS Code |
| **Model Support** | 100+ providers | Anthropic | OpenAI + compat | 75+ providers | 10+ providers |

### Aider's Unique Strengths

1. **Edit formats**: The most sophisticated approach to telling LLMs how to express file edits
2. **Repository map**: Graph-ranked codebase summary — a unique approach to context efficiency
3. **Public benchmarks**: Only tool that publishes and optimizes for public coding leaderboards
4. **Git-native**: Deepest git integration — auto-commits with AI messages, clean history
5. **Architect mode**: Best multi-model pipeline for separating planning from editing
6. **Python scripting API**: Can be embedded in other tools

### Aider's Limitations

1. **No MCP support**: Cannot extend with MCP servers
2. **Terminal-only**: No native IDE integration (though AI comments enable some IDE use)
3. **No cloud mode**: Always runs locally
4. **No subagents**: Architect mode is the closest (2-model), but no general sub-agent spawning

---

## Sources

1. [Aider Documentation](https://aider.chat/docs/)
2. [Aider Edit Formats](https://aider.chat/docs/more/edit-formats.html)
3. [Aider Chat Modes](https://aider.chat/docs/usage/modes.html)
4. [Repository Map](https://aider.chat/docs/repomap.html)
5. [Git Integration](https://aider.chat/docs/git.html)
6. [LLM Leaderboards](https://aider.chat/docs/leaderboards/)
7. [Scripting Aider](https://aider.chat/docs/scripting.html)
8. [Aider GitHub Repository](https://github.com/Aider-AI/aider)
9. [Aider Blog - Architect Mode](https://aider.chat/2024/09/26/architect.html)
10. [Aider Blog - Repository Map](https://aider.chat/2023/10/22/repomap.html)

---

*Last updated: March 2026*
