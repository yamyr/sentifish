# Tool Use Patterns in Agentic Coding Frameworks

> Deep research note on how coding agents call tools, the schemas involved, parallel execution, chaining, retry logic, and how different frameworks implement it under the hood.

---

## 1. What Is Tool Use in Agent Context?

Tool use (also called function calling) is the mechanism by which a large language model delegates side-effecting operations to external code. The model never executes anything itself — it **emits a structured request**, your code (or the provider's infrastructure) runs the operation, and the result flows back into the conversation.

From the Anthropic documentation:

> "Tool use is a contract between your application and the model. You specify what operations are available and what shape their inputs and outputs take; Claude decides when and how to call them."

This contract makes the model behave less like a text generator and more like a function caller. Engineers can integrate tool use the same way they'd integrate any typed interface: define the schema, handle the callback, return a result. The caller on the other side is an LLM choosing which function to invoke based on conversation context.

---

## 2. The Tool Schema: Anatomy of a Function Definition

Every tool has three mandatory fields:

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Regex `^[a-zA-Z0-9_-]{1,64}$`. Must be unique in the tool array. |
| `description` | string | Detailed natural-language description of what the tool does, when to call it, caveats. |
| `input_schema` | JSON Schema object | Defines expected parameters with types, enums, required fields. |

Optional fields: `input_examples`, `cache_control`, `strict`, `defer_loading`, `allowed_callers`.

### Example — Good Tool Definition

```json
{
  "name": "get_stock_price",
  "description": "Retrieves the current stock price for a given ticker symbol. The ticker symbol must be a valid symbol for a publicly traded company on a major US stock exchange like NYSE or NASDAQ. The tool will return the latest trade price in USD. It should be used when the user asks about the current or most recent price of a specific stock. It will not provide any other information about the stock or company.",
  "input_schema": {
    "type": "object",
    "properties": {
      "ticker": {
        "type": "string",
        "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
      }
    },
    "required": ["ticker"]
  }
}
```

### Example — Poor Tool Definition (anti-pattern)

```json
{
  "name": "get_stock_price",
  "description": "Gets the stock price for a ticker.",
  "input_schema": { "type": "object", "properties": { "ticker": { "type": "string" } }, "required": ["ticker"] }
}
```

The good description explains what the tool does, when to use it, what data it returns, and what the parameter means. The poor version leaves the model guessing.

### Key Best Practices (from Anthropic Engineering)

- **Detailed descriptions are the single most important factor** in tool performance — aim for 3-4+ sentences per tool.
- **Consolidate related operations** into fewer tools: instead of `create_pr`, `review_pr`, `merge_pr`, use one tool with an `action` parameter.
- **Namespace tool names** when tools span multiple services: `github_list_prs`, `slack_send_message`.
- **Return only high-signal information** — semantic IDs, not opaque internal refs; only the fields Claude needs for its next step.
- If a human engineer can't definitively say which tool to call in a given situation, an AI agent won't either.

---

## 3. The Agentic Loop: How Tool Calling Works

### Client Tool Flow (User-Defined + Anthropic-Schema Tools)

```
while stop_reason == "tool_use":
    1. Send request with tools[] array + messages
    2. Claude responds: stop_reason="tool_use", content=[tool_use blocks]
    3. Execute each tool_use block
    4. Format outputs as tool_result blocks
    5. Append assistant response + tool_results to messages
    6. Send new API request
```

The loop exits on: `end_turn`, `max_tokens`, `stop_sequence`, or `refusal`.

### Server Tool Flow (web_search, code_execution, web_fetch)

Anthropic runs these tools server-side. One request from your application may trigger several tool calls internally before a response arrives. You see `server_tool_use` blocks showing what ran, but execution is already complete. If the server hits its iteration limit, `stop_reason` is `pause_turn` — re-send the conversation to continue.

### Code Skeleton (Python)

```python
import anthropic

client = anthropic.Anthropic()
messages = [{"role": "user", "content": "What files are in /tmp?"}]
tools = [{"type": "bash_20250124", "name": "bash"}]

while True:
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        tools=tools,
        messages=messages
    )
    
    messages.append({"role": "assistant", "content": response.content})
    
    if response.stop_reason != "tool_use":
        break
    
    tool_results = []
    for block in response.content:
        if block.type == "tool_use":
            result = execute_tool(block.name, block.input)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result
            })
    
    messages.append({"role": "user", "content": tool_results})
```

---

## 4. Tool Categories in Practice

### 4.1 Anthropic Built-In (Schema-Provided, Client-Executed)

These tools have a trained-in schema — the model has been optimized on thousands of successful trajectories using these exact signatures, so it calls them more reliably:

| Tool | Version String | What It Does |
|------|----------------|--------------|
| `bash` | `bash_20250124` | Persistent bash session, stateful, env vars survive |
| `text_editor` | `text_editor_20250124` | view/create/str_replace/insert operations on files |
| `computer` | `computer_20250124` | Mouse/keyboard/screenshot for GUI automation |
| `memory` | `memory_20250818` | Client-side memory file directory (CRUD on `/memories`) |

The bash tool key features:
- Maintains a **persistent session** between calls (env vars, working directory carry over)
- Supports `restart: true` to reset the session
- Underlying is a `BashSession` class that pipes to `/bin/bash`, collects stdout+stderr

### 4.2 Server-Executed Tools (Anthropic-Managed)

| Tool | What It Does |
|------|--------------|
| `web_search_20260209` | Real-time web search |
| `web_fetch` | Fetches URL content |
| `code_execution_20250825` | Code sandbox (bash + file ops) |
| `tool_search` | Tool discovery within large tool libraries |

### 4.3 User-Defined Tools

Any custom function you want the model to be able to call. The vast majority of production tool-use traffic falls here.

---

## 5. Parallel Tool Use

Claude can issue **multiple tool calls in a single response** — this is the default behavior.

```json
// Claude response with parallel tool calls
{
  "content": [
    {"type": "tool_use", "id": "toolu_01", "name": "read_file", "input": {"path": "main.py"}},
    {"type": "tool_use", "id": "toolu_02", "name": "read_file", "input": {"path": "tests/test_main.py"}},
    {"type": "tool_use", "id": "toolu_03", "name": "bash", "input": {"command": "git log --oneline -5"}}
  ],
  "stop_reason": "tool_use"
}
```

Your application should execute all three in parallel (using `asyncio.gather`, `Promise.all`, etc.) then return all results in a single `user` message:

```python
tool_results = await asyncio.gather(*[execute_tool(b) for b in tool_use_blocks])
```

To **disable** parallel tool use (force sequential):

```python
# Anthropic SDK
response = client.messages.create(
    ...,
    tool_choice={"disable_parallel_tool_use": True}
)

# LangChain / LangChain-Anthropic
model_with_tools = model.bind_tools(tools, parallel_tool_calls=False)
```

Note: Claude Sonnet 3.7 was observed to be less likely to make parallel calls even without the flag set.

---

## 6. Tool Chaining

Tool chaining is when the output of one tool becomes the input to another — the model reasons over intermediate results to decide next steps. This is implicit in the agentic loop: every `tool_result` is added to the conversation, and the model reasons over all of it.

### Chain Example: Bug Fix Workflow

```
Turn 1: Claude calls bash("grep -r 'NullPointerException' src/")
Turn 2: Claude reads the specific file with text_editor(view, path)
Turn 3: Claude applies the fix with text_editor(str_replace, old, new)
Turn 4: Claude runs tests with bash("pytest tests/ -v")
Turn 5: Claude sees failure, reads error, applies another fix
Turn 6: Tests pass. Claude calls bash("git commit -am 'fix NPE in handler'")
```

Each step is informed by the previous output. This is the standard SWE pattern.

---

## 7. Tool Use in Different Agent Implementations

### 7.1 Claude Code (Anthropic)

Claude Code operates in three layers:

```
┌─ Extension Layer ─── MCP | Hooks | Skills | Plugins ─────────────┐
├─ Delegation Layer ─── Subagents (up to 10 parallel) ──────────────┤
└─ Core Layer ──────── Read | Edit | Bash | Glob | Grep | etc ──────┘
```

The core tools are `Read`, `Edit` (str_replace based), `Bash`, `Glob`, `Grep`, `WebFetch`. Claude Code uses different sub-models for different roles:
- **Haiku**: fast read-only exploration — glob, grep, read, safe bash commands
- **Opus/Sonnet**: implementation — write, edit, bash with mutations

Context overflow prevention: exploration results from subagents don't bloat the main context — only conclusions/summaries return.

The hook system guarantees shell execution independent of model behavior (deterministic automation layer).

### 7.2 SWE-agent (Princeton/Stanford)

SWE-agent introduced the **Agent-Computer Interface (ACI)** concept — the idea that the shape of the tool interface matters as much as the model.

Key ACI design insights:
- **Action space simplification**: Replacing raw shell commands with specialized types (e.g., `edit` or `find_file`) reduces agent confusion and computational burden (e.g., not needing to do arithmetic on line ranges)
- **Informative error messages**: When tools fail, the error message is designed to guide the agent toward correct usage
- **History processing**: The harness keeps agent context concise by processing history before each turn

Original SWE-agent tool set:
```
open <file> [<line>]     # Opens file, optionally at line
goto <line>              # Jumps to line in currently open file
scroll_down / scroll_up  # Navigate file by window
edit <start>:<end>       # Edit line range with heredoc syntax
search_dir <query>       # Search directory
search_file <query>      # Search current file
find_file <name>         # Find file by name in repo
```

### 7.3 mini-SWE-agent (Princeton/Stanford, 2025)

In 2025, the SWE-agent team released a simpler version that challenges the need for custom tool interfaces:

> "Does not have any tools other than bash — it doesn't even need to use the tool-calling interface of the LMs. Instead of implementing custom tools for every specific thing the agent might want to do, the focus is fully on the LM utilizing the shell to its full potential."

Architecture: ~100 lines of Python. No fancy dependencies. Every action is `subprocess.run()` — completely independent (no stateful shell session). Scores >74% on SWE-bench verified.

Key insight: **As LMs become more capable, custom tool scaffolding matters less.** The model can figure out `sed`, `grep`, `patch`, `git` without custom wrappers.

### 7.4 Aider

Aider uses a **whole-diff editing model** rather than targeted tool calls:
- No `text_editor` or `bash` tool in the traditional sense
- The model outputs a full diff/patch in a custom format
- Aider applies the patch, runs tests, and feeds results back
- Multiple backends: udiff, whole-file, search/replace blocks

This approach is optimized for multi-file, cross-cutting refactors where targeted edits would miss connections.

### 7.5 Devin (Cognition AI)

Devin operates in a full VM environment with:
- Browser (web navigation, authentication)
- Terminal (bash, build tools)
- File editor
- GitHub integration (PR creation, review response)

Tool invocations are made through an internal planner that maintains a task graph. Unlike Claude Code's flat tool list, Devin has persistent state across the entire session — more like an OS process than an API loop.

---

## 8. Error Handling and Retry Logic

### Common Error Patterns

| Error Type | Agent Behavior | Recommended Pattern |
|-----------|---------------|---------------------|
| Command not found | Retry with correct binary path | Include error in next turn |
| Permission denied | Try sudo / check permissions | Escalate to ask user |
| Syntax error in edit | Re-read file, apply corrected edit | Include file content in error context |
| Test failure | Read failure output, identify root cause, fix | Feed full test output |
| Timeout | Retry with simpler command | Break complex command into steps |
| Rate limit (429) | Exponential backoff | Wait + retry with jitter |

### Retry Implementation Pattern

```python
import time
import random

def execute_with_retry(tool_fn, max_retries=3, base_delay=1.0):
    for attempt in range(max_retries):
        try:
            return tool_fn()
        except RateLimitError:
            delay = base_delay * (2 ** attempt) + random.uniform(0, 0.5)
            time.sleep(delay)
        except ToolExecutionError as e:
            if attempt == max_retries - 1:
                raise
            # Return error as tool_result so model can adapt
            return {"error": str(e), "attempt": attempt + 1}
    raise MaxRetriesExceeded()
```

### Agent-Level Self-Correction

When a tool call produces an error, the model receives the error in `tool_result` content. Well-designed harnesses:
1. Include the full error output (not just exit code)
2. Include relevant context (current file state, recent commands)
3. Allow the model to change strategy — try a different approach

The model's ability to self-correct from tool errors is one key reason `text_editor` outperforms raw bash for file editing: the schema-trained model knows exactly how to recover.

---

## 9. Tool Design Anti-Patterns

### Bloated Tool Sets

> "One of the most common failure modes we see is bloated tool sets that cover too much functionality or lead to ambiguous decision points about which tool to use." — Anthropic Engineering

If you have 50 tools and the model can't decide between `create_document` and `write_file`, consolidate.

### Opaque Return Values

Tools that return internal IDs, raw SQL rows, or unparsed HTML force the model to do extra work. Return semantic, stable identifiers and only the fields needed for the next decision.

### Stateless Tools That Should Be Stateful

If the agent needs to `open_connection`, then `execute_query`, then `close_connection` — consider wrapping in a single tool that manages the lifecycle internally.

### Missing Error Structure

Tools that throw exceptions with no detail make agent debugging impossible. Always return structured error info:

```python
{
    "success": false,
    "error_type": "timeout" | "blocked" | "not_found" | "permission_denied",
    "error_message": "Human-readable explanation",
    "partial_results": [...]  # Any data captured before failure
}
```

---

## 10. Strict Tool Use

Adding `strict: true` to a tool definition enforces that Claude's tool calls always match the schema exactly:

```json
{
  "name": "create_ticket",
  "description": "...",
  "input_schema": { ... },
  "strict": true
}
```

Useful in production pipelines where downstream code parses tool call arguments without validation.

---

## 11. Tool Use with Prompt Caching

For agents using large tool libraries, tool definitions themselves consume substantial tokens on every request. Prompt caching (`cache_control: {"type": "ephemeral"}`) avoids re-tokenizing unchanged tool schemas across turns, significantly reducing cost and latency in long agentic loops.

---

## Sources

- Anthropic: How tool use works — https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
- Anthropic: Define tools — https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- Anthropic: Bash tool — https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool
- Anthropic Engineering: Writing tools for agents — https://www.anthropic.com/engineering/writing-tools-for-agents
- SWE-agent paper (arXiv:2405.15793) — https://arxiv.org/abs/2405.15793
- mini-SWE-agent GitHub — https://github.com/SWE-agent/mini-swe-agent
- Microsoft AI Agents for Beginners: Tool Use Design Pattern — https://microsoft.github.io/ai-agents-for-beginners/04-tool-use/
- MIT Missing Semester: Agentic Coding — https://missing.csail.mit.edu/2026/agentic-coding/
- Introl: Claude Code CLI Reference — https://introl.com/blog/claude-code-cli-comprehensive-guide-2025
- arXiv: AI Agentic Programming Survey (2508.11126) — https://arxiv.org/html/2508.11126v1
