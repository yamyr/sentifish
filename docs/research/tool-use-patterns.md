# Tool Use Patterns in Agentic Coding Frameworks

> Research compiled March 2026. Sources: Anthropic "Building Effective Agents", Weaviate blog, Medium agentic patterns, seangoedecke.com learnings.

---

## Overview

Tool use is the mechanism by which LLM agents interact with the external world — executing code, modifying files, browsing the web, and taking actions that persist beyond the model's context window. The design of tools (what they do, how they're defined, how feedback is returned) profoundly affects agent performance.

This document explores:
- The core tool categories used in agentic coding frameworks
- How tools are defined and invoked
- Design patterns for effective tool use
- Approval flows and safety guardrails
- Advanced patterns like computer use and browser automation

---

## The Augmented LLM Model

Anthropic's "Building Effective Agents" defines the foundational architecture:

```
┌────────────────────────────────────────────────────┐
│                  Augmented LLM                     │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Retrieval│  │  Tools   │  │     Memory       │ │
│  │ (RAG,    │  │ (bash,   │  │ (context window, │ │
│  │  search) │  │  files,  │  │  external DB,    │ │
│  └──────────┘  │  browser)│  │  summaries)      │ │
│                └──────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────┘
                        ↕
              External Environment
           (filesystem, APIs, terminal)
```

The augmented LLM:
- **Generates tool calls**: decides when and how to use tools
- **Processes tool results**: incorporates output into context
- **Maintains memory**: decides what to remember across turns
- **Performs retrieval**: fetches relevant context on demand

---

## Core Tool Categories

### 1. Shell / Bash Execution

The most fundamental coding tool. An agent that can run bash commands can do almost anything.

**Typical interface**:
```json
{
  "name": "bash",
  "description": "Run a bash command and return stdout/stderr",
  "parameters": {
    "command": "string — the command to execute",
    "timeout": "integer — max seconds (optional)"
  }
}
```

**What agents use bash for**:
- Installing dependencies: `pip install requests`
- Running tests: `pytest tests/ -v`
- Building projects: `npm run build`
- Git operations: `git diff HEAD~1`, `git add -A && git commit -m "fix"`
- Environment setup: `export DATABASE_URL=...`
- Code linting: `ruff check src/`, `eslint src/`
- File operations: `mkdir -p src/utils`, `cp .env.example .env`

**Design considerations**:
- **Persistent vs one-shot**: Persistent shells maintain state (environment variables, working directory) across calls; one-shot shells don't
- **Timeout limits**: Long-running commands (test suites, builds) need generous timeouts
- **Output truncation**: Large outputs need smart truncation; full outputs may overflow context
- **Error handling**: Distinguish between exit code 0 (success) and non-zero (failure)

**Risk level**: High — bash execution can have irreversible consequences (file deletion, network calls, etc.)

### 2. File System Tools

File tools provide more structured, safer file operations than raw bash.

**Common file tools**:

```json
// Read file
{
  "name": "read_file",
  "params": {
    "path": "string",
    "start_line": "integer (optional)",
    "end_line": "integer (optional)"
  }
}

// Write file
{
  "name": "write_file",
  "params": {
    "path": "string",
    "content": "string"
  }
}

// Edit file (patch/replace)
{
  "name": "edit_file",
  "params": {
    "path": "string",
    "old_string": "string — exact text to find",
    "new_string": "string — replacement text"
  }
}

// Search
{
  "name": "search_files",
  "params": {
    "pattern": "string (regex or literal)",
    "directory": "string (optional)",
    "file_pattern": "string (glob, optional)"
  }
}
```

**Design patterns**:

1. **Search/Replace editing** (Claude Code, Aider): Specify exact text to find and replace. Safer than full-file rewrites. Fails gracefully if text not found (prevents silent corruption).

2. **Line-range editing** (SWE-agent): Specify start/end line numbers. Requires viewing the file first to know line numbers. Good for surgical edits.

3. **Whole-file rewrite**: Write the entire file from scratch. Simple but wasteful and error-prone for large files.

4. **Unified diff format** (Agentless, Aider): Generate a standard `diff -u` formatted patch. Apply with `patch` command. Familiar format; reviewable by humans.

**Read tools best practice**: Windowed file reading (show 50-100 lines at a time with scroll) avoids context overflow on large files. Custom file viewers (SWE-agent) include line numbers, which are critical for subsequent edit operations.

### 3. Code Search / Navigation Tools

Agents need to find relevant code before editing it.

```json
{
  "name": "grep",
  "params": {
    "pattern": "string",
    "path": "string",
    "case_insensitive": "boolean"
  }
}

{
  "name": "find_file",
  "params": {
    "name": "string",
    "directory": "string (optional)"
  }
}

{
  "name": "list_directory",
  "params": {
    "path": "string",
    "recursive": "boolean"
  }
}
```

**Repository map (Aider)**: Instead of exposing raw search tools, Aider pre-computes a hierarchical map of the entire repository using Tree-sitter. This map includes:
- File paths and sizes
- Class names and method signatures
- Import relationships
- Call graphs

The repo-map is included in every prompt, giving the model a "table of contents" without sending all file contents.

**Semantic search**: Tools that use embeddings to find semantically similar code. Cursor uses this for its "codebase understanding" feature.

### 4. Browser / Web Tools

Browser tools allow agents to:
- Look up documentation
- Research solutions to errors
- Test web applications they build
- Access real-time information

**Approaches**:

1. **Full browser automation** (Devin, Cline):
   - Agent controls a real browser (Chromium via Playwright/Puppeteer)
   - Can navigate, click, type, screenshot
   - Sees page content as structured HTML or screenshot
   - High capability, high complexity

2. **Web search API** (many frameworks):
   - Tool that queries a search API (Brave, Google, Perplexity)
   - Returns structured results (title, URL, snippet)
   - Agent can then fetch specific pages
   - Lower capability than full browser, more reliable

3. **HTTP fetch** (minimal):
   - Agent calls a URL and receives text/HTML content
   - Simpler than full browser but sufficient for documentation

**Devin's browser approach**: Uses a full embedded Chromium browser visible in the UI. The agent navigates autonomously, with screenshots periodically captured for context. Can interact with web applications it builds.

**Cline's browser**: Puppeteer-based browser automation. Every browser action requires user approval in the standard human-in-loop flow.

### 5. Code Execution / Testing Tools

Beyond bash, specialized code execution tools provide safer sandboxed execution:

```json
{
  "name": "run_python",
  "params": {
    "code": "string",
    "timeout": "integer"
  }
}

{
  "name": "run_tests",
  "params": {
    "test_file": "string (optional)",
    "test_function": "string (optional)"
  }
}
```

**Test-driven loop pattern** (common in all frameworks):
1. Run existing tests → see which fail
2. Write/modify code to fix failures
3. Re-run tests → check progress
4. Repeat until all tests pass

This loop is the core of automated software engineering. Tools that make it efficient (fast test execution, good output formatting) directly improve agent performance.

### 6. Computer Use (Anthropic)

Anthropic's "Computer Use" API allows Claude to control a computer via screenshot-action-screenshot loops:

```json
{
  "name": "computer",
  "type": "computer_20241022",
  "display_width_px": 1920,
  "display_height_px": 1080
}
```

**Available actions**:
- `screenshot`: Capture current screen
- `key`: Press keyboard shortcut
- `type`: Type text
- `mouse_move`: Move cursor
- `left_click` / `right_click` / `double_click`: Mouse actions
- `left_click_drag`: Drag operation
- `scroll`: Scroll at position

**Use cases in coding**:
- Interacting with GUIs that lack APIs
- Testing desktop applications
- Navigating browser-based tools
- Accessing IDEs visually

**Limitations**:
- Slow (screenshot → LLM → action loop is expensive)
- Screenshot analysis introduces errors
- Not suitable as primary coding tool
- Best for tasks where no API/CLI alternative exists

---

## Tool Design Principles

### From Anthropic's "Building Effective Agents"

1. **Give the LLM enough context to use tools correctly**: Tool descriptions must be precise and include examples
2. **Format outputs for LLM consumption**: Structured JSON > raw text; truncate intelligently
3. **Fail explicitly**: Return clear error messages; don't silently succeed with wrong results
4. **Keep tool interfaces small**: Many focused tools beat few multi-purpose tools
5. **Start simple, add complexity only when needed**: A model with just bash + file read/write can solve most coding tasks

### From SWE-agent's ACI Research

1. **Error prevention > error recovery**: Add linters, validators, schema checks that prevent bad actions before they're taken
2. **Custom viewers > raw commands**: A custom file viewer with line numbers is more useful than `cat`
3. **Reduce action space thoughtfully**: Too many tools causes decision paralysis; too few limits capability
4. **Feedback must be machine-readable**: JSON output > human-readable prose for subsequent reasoning

### From seangoedecke.com (Practitioner Learnings)

1. **Persistent shell sessions win**: Stateful shells are much more effective than one-shot execution
2. **Leave mistakes in context**: For capable models, keeping errors in history actually helps (don't truncate failed tool calls)
3. **Models that understand git work better**: git-aware tools and workflows improve agent reliability
4. **Patch format is undertrained**: Models learn to use whatever file editing format is in their training data

---

## Approval Flow Patterns

### Pattern 1: Always Approve (Fully Autonomous)

Used by: Devin, Claude Code (default), SWE-agent

```
User → Task → Agent executes → Done
                ↕ no human
         (all tools auto-approved)
```

**Appropriate when**:
- Task is in a sandboxed environment
- Agent has been trusted with full autonomy
- Speed matters more than oversight
- Errors are easily reversible (git-tracked changes)

### Pattern 2: Human-in-the-Loop (Cline default)

Used by: Cline, Cursor (approval for destructive ops)

```
Agent → Propose action → Human approves/rejects → Execute
                         ↕
              (every file/terminal action requires OK)
```

**Approval UI shows**:
- What file will be changed
- Exact diff of proposed change
- What command will be run
- Expected outcome

**Appropriate when**:
- Working on production code
- User wants oversight
- Building trust with a new agent
- Actions are potentially irreversible

### Pattern 3: Risk-Based Approval

Used by: Claude Code (with permission settings), emerging pattern

```
Agent → Classify action risk → 
  Low risk (read files, search) → Auto-approve
  Medium risk (write files, run safe commands) → Auto with logging
  High risk (delete, network, secrets) → Human approval required
```

**Risk classification criteria**:
- Reversible vs irreversible (git-tracked changes are reversible)
- Scope (current file vs entire codebase)
- External effects (local vs network calls)
- Data sensitivity (plain code vs credentials/env vars)

### Pattern 4: Trust Delegation

Used by: Claude Code Teams, multi-agent patterns

```
Orchestrator (trusted) → Sub-agent (trusted by orchestrator)
                         → Sub-agent has same permissions as orchestrator
```

In Claude Code Teams, the orchestrator agent spawns sub-agents and delegates tasks. Sub-agents inherit a permission scope set by the orchestrator.

---

## Tool Use Loop Patterns

### ReAct Pattern (Reason + Act)

Used by SWE-agent, most agent frameworks:

```
1. REASON: "I need to find where the bug occurs. Let me search for the error message."
2. ACT: search_files("AttributeError: 'NoneType'")
3. OBSERVE: "Found in src/parser.py:142"
4. REASON: "Let me read that file to understand context."
5. ACT: read_file("src/parser.py", start_line=130, end_line=160)
6. OBSERVE: [file content]
7. REASON: "The issue is that obj can be None. I should add a null check."
8. ACT: edit_file(...)
9. OBSERVE: "Edit applied successfully"
10. ACT: run_tests()
11. OBSERVE: "All tests pass"
12. SUBMIT patch
```

**Key property**: Each action is informed by previous observations. The "reason" step is what makes the loop adaptive.

### Plan-then-Execute Pattern

Used by Devin, Cursor Agent, Claude Code with `--plan` mode:

```
1. PLAN: Decompose task into steps
2. REVIEW: Human reviews and approves plan (optional)
3. EXECUTE: Run each step in order
4. VERIFY: Check outcomes
5. LOOP: If step fails, debug and retry
```

**Advantage**: Reduces mid-task surprises; easier to audit

### Prompt Chaining (Agentless-style)

```
Step 1: Localization LLM call → suspicious files
Step 2: Repair LLM call → candidate patches
Step 3: Validation → select best patch
```

No tool use loop; each step is a structured LLM call with fixed inputs/outputs. More predictable but less adaptive.

---

## Advanced Tool Patterns

### Tool Composition

Complex capabilities emerge from combining simple tools:

```python
# "Find all TODO comments and create GitHub issues"
files = search_files("TODO:")
for file, line in files:
    content = read_file(file)
    issue_text = extract_todo(content, line)
    github_create_issue(title=issue_text, body=f"Found in {file}:{line}")
```

### Tool Retry with Backoff

When tools fail, smart retry patterns prevent infinite loops:

```python
def run_with_retry(tool, args, max_retries=3):
    for attempt in range(max_retries):
        result = tool(**args)
        if result.success:
            return result
        # Analyze failure, modify approach
        args = adapt_args(result.error, args, attempt)
    return None  # or escalate to human
```

### Tool Output Summarization

For tools that return large outputs (test suites, grep results), a summarization step keeps context manageable:

```
bash("pytest . -v") → 500 lines of output
→ LLM summarize: "3 tests failing: test_auth, test_parser, test_db"
→ Agent works with summary, not full output
```

---

## Sources

1. Anthropic — "Building Effective Agents": https://www.anthropic.com/research/building-effective-agents
2. Weaviate — "What Are Agentic Workflows?": https://weaviate.io/blog/what-are-agentic-workflows
3. seangoedecke.com — "What have we learned about building agentic AI tools?": https://www.seangoedecke.com/ideas-in-agentic-ai-tooling/
4. Medium — "Multi-Agent System Patterns": https://medium.com/@mjgmario/multi-agent-system-patterns-a-unified-guide-to-designing-agentic-architectures-04bb31ab9c41
5. Medium — "Agentic Workflows with Claude": https://medium.com/@reliabledataengineering/agentic-workflows-with-claude-architecture-patterns-design-principles-production-patterns-72bbe4f7e85a
6. SWE-agent ACI documentation: https://github.com/SWE-agent/SWE-agent/blob/main/docs/background/aci.md
7. SWE-agent Tools docs: https://swe-agent.com/latest/config/tools/
8. Anthropic — Claude Code overview: https://www.anthropic.com/engineering/claude-code-best-practices
9. Anthropic Computer Use API documentation
