# Context Window Management in Long-Running Agents

> Comprehensive research note on how coding agents manage limited context windows across long tasks — sliding window, summarization, RAG-based memory, chunking, token budgeting, and how different harnesses handle context overflow.

---

## 1. The Context Problem

Every LLM has a fixed **context window** — the maximum number of tokens for combined input + output. As agents execute long tasks, they accumulate:
- System prompt (instructions, tool schemas)
- Tool definitions (100–500 tokens each, paid per request)
- Conversation history (every message, every tool call, every result)
- File contents loaded for analysis
- Test output, compilation logs, etc.

Eventually, the context fills. What happens then depends on the harness:
- Hard truncation: oldest messages silently drop
- Crash/error: agent halts
- Active management: the harness prunes, summarizes, or delegates

### Context Rot

From Anthropic's engineering blog on context engineering:

> "As the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases... Context, therefore, must be treated as a finite resource with diminishing marginal returns."

This concept — called **context rot** — emerges from the transformer architecture's n² pairwise attention relationships. As n grows, the model's attention gets stretched thin. Information from 100k tokens ago is retrieved less reliably than information from 5k tokens ago, even within the nominal context window.

**Key insight**: Bigger context windows don't solve context rot. They just push the cliff further away. The real solution is curating what's in the context.

### Context Windows by System (2025)

| System | Context Window | Persistent Memory |
|--------|---------------|-------------------|
| Claude Sonnet / Opus 4.x | 200K tokens (1M with premium) | Memory tool (file-based) |
| GPT-4.1 | 1M tokens | None native |
| Gemini 1.5 Pro | 2M tokens | None native |
| GitHub Copilot | 16K (active buffer) | Sliding window |
| Codeium | 32K | Dynamic token budgeting |
| Cursor IDE | 128K | Semantic search over project history |
| SWE-agent | 16K | Vector DB retrieval |
| Devika | 32K | SQLite + embeddings |
| Continue.dev | 32K | Embedding-based local recall |
| OpenDevin | 32K | RAG over command history |

(Source: AI Agentic Programming Survey, arXiv 2508.11126)

---

## 2. Strategies Overview

Context management strategies exist on a spectrum from "do nothing and crash" to "fully autonomous retrieval-augmented agents":

```
[Do nothing] → [Truncate] → [Sliding Window] → [Summarize] → [RAG/Memory] → [Subagents]
     ↑                                                                              ↑
  Simple/fragile                                                          Robust/complex
```

---

## 3. Sliding Window

The simplest active strategy: keep the **N most recent messages** in context, drop the oldest.

### Basic Implementation

```python
MAX_CONTEXT_MESSAGES = 20
MAX_CONTEXT_TOKENS = 100_000

def trim_to_window(messages: list, max_messages: int = 20) -> list:
    """Keep system message + last N messages"""
    system = [m for m in messages if m["role"] == "system"]
    non_system = [m for m in messages if m["role"] != "system"]
    return system + non_system[-max_messages:]
```

### Token-Based Sliding Window

More precise — count actual tokens:

```python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")

def trim_to_token_budget(messages: list, budget: int = 100_000) -> list:
    system = [m for m in messages if m["role"] == "system"]
    rest = [m for m in messages if m["role"] != "system"]
    
    system_tokens = sum(len(enc.encode(str(m))) for m in system)
    remaining_budget = budget - system_tokens
    
    # Walk backward through messages, including until budget exceeded
    included = []
    tokens_used = 0
    for msg in reversed(rest):
        msg_tokens = len(enc.encode(str(msg)))
        if tokens_used + msg_tokens > remaining_budget:
            break
        included.insert(0, msg)
        tokens_used += msg_tokens
    
    return system + included
```

**Drawback**: Sliding window loses important early context — decisions made at the start of a task, design constraints, key discoveries. Pure recency is often a poor proxy for relevance.

### GitHub Copilot Pattern

Copilot uses a simple 16K sliding window over the active edit buffer. The "active buffer" is not the full conversation history — it's the set of recently viewed/edited files. This is context management by scope restriction rather than history management.

---

## 4. Summarization

When important context must be preserved but the raw history is too long, **compress it with another LLM call**.

### Basic Summarization Loop

```python
SUMMARIZE_THRESHOLD = 0.8  # Summarize when 80% of budget used

async def maybe_summarize(messages: list, token_budget: int) -> list:
    current_tokens = count_tokens(messages)
    
    if current_tokens < token_budget * SUMMARIZE_THRESHOLD:
        return messages
    
    # Summarize oldest messages (keep last 10 intact)
    to_summarize = messages[1:-10]  # Skip system, keep recent
    recent = messages[-10:]
    
    summary_prompt = f"""Summarize the following agent work session. 
    Preserve key decisions, findings, file paths modified, and important context.
    Be concise but complete.
    
    {format_messages(to_summarize)}"""
    
    summary = await llm.complete(summary_prompt, model="claude-haiku-4-5")
    
    summary_message = {
        "role": "system",
        "content": f"[SUMMARY OF EARLIER WORK]\n{summary}\n[END SUMMARY]"
    }
    
    return [messages[0], summary_message] + recent
```

### Progressive Summarization

Rather than one big summary at the end, summarize as you go:

```
Turn 1-20: Full history
Turn 21: Summarize turns 1-10, keep 11-21 in full
Turn 31: Summarize "summary + turns 11-20", keep 21-31 in full
```

This creates a compressed "long-term memory" as a prefix, with recent full-fidelity turns appended.

### CrewAI: Automatic Context Window Respect

CrewAI agents with `respect_context_window=True` automatically summarize when approaching the limit:

```python
researcher = Agent(
    role="Senior Researcher",
    goal="...",
    respect_context_window=True,  # Auto-summarize if context fills
    max_iter=20,
)
```

---

## 5. RAG-Based Context (Retrieval-Augmented Generation)

Instead of keeping everything in context, store it externally and **retrieve only what's relevant** for each turn.

### Architecture

```
                    ┌──────────────────────┐
                    │   Vector Database     │
                    │  (tool outputs,       │
                    │   past decisions,     │
                    │   file contents,      │
                    │   test results)       │
                    └──────────┬───────────┘
                               │ semantic search
                    ┌──────────▼───────────┐
                    │   Context Builder    │
                    │   (top-K retrieval)  │
                    └──────────┬───────────┘
                               │ inject into context
                    ┌──────────▼───────────┐
                    │       LLM            │
                    │  (compact context)   │
                    └──────────────────────┘
```

### Embedding + Retrieval Pattern

```python
from sentence_transformers import SentenceTransformer
import numpy as np
import chromadb

model = SentenceTransformer("all-MiniLM-L6-v2")
client = chromadb.Client()
collection = client.create_collection("agent_memory")

def store_tool_result(tool_name: str, input: dict, output: str, turn: int):
    text = f"Tool: {tool_name}\nInput: {input}\nOutput: {output[:2000]}"
    embedding = model.encode(text).tolist()
    collection.add(
        embeddings=[embedding],
        documents=[text],
        metadatas=[{"turn": turn, "tool": tool_name}],
        ids=[f"turn_{turn}_{tool_name}"]
    )

def retrieve_relevant_context(query: str, k: int = 5) -> str:
    query_embedding = model.encode(query).tolist()
    results = collection.query(query_embeddings=[query_embedding], n_results=k)
    return "\n\n".join(results["documents"][0])
```

### SWE-agent RAG

SWE-agent uses a vector DB to retrieve relevant tool outputs and plan state. Before each step, the harness retrieves the top-K most relevant past actions/observations based on the current task description. This keeps the effective context small while preserving access to important history.

### Self-RAG Pattern

Self-RAG (arXiv:2310.11511) adapts retrieval to be on-demand: the model generates special "reflection tokens" indicating whether retrieval is needed. Instead of always retrieving context, the model decides when external information would help.

Relevant to coding agents: rather than stuffing all file contents into context, let the model call `read_file` only when it needs to inspect something.

---

## 6. Subagent Delegation (Context Isolation)

The most powerful context management technique: **spawn a subagent with a clean context** to handle a bounded piece of work, then return only the summary.

From Claude Code's architecture:

```
Main conversation (200K budget):
  ┌─────────────────────────────────────────────┐
  │ System prompt + tools + compressed history  │  ~50K tokens
  │ Current task context                         │  ~10K tokens
  │ Subagent summaries (returned results)        │  ~5K tokens
  └─────────────────────────────────────────────┘

Subagent 1 (clean 200K budget):
  ┌─────────────────────────────────────────────┐
  │ Task: "Explore the authentication module"    │
  │ [reads files, runs searches, etc.]           │
  │ Returns: 2K summary of findings              │
  └─────────────────────────────────────────────┘
```

The exploration results don't bloat the main conversation — only conclusions return. This is the fundamental insight of Claude Code's three-layer architecture.

### LangGraph Subgraph Pattern

```python
# Define a subgraph for a bounded task
sub_builder = StateGraph(SubState)
sub_builder.add_node("explore", explore_codebase)
sub_builder.add_node("analyze", analyze_findings)
sub_graph = sub_builder.compile()

# Main graph calls subgraph as a node
def delegate_exploration(state: MainState) -> MainState:
    sub_result = sub_graph.invoke({
        "task": state["current_subtask"],
        "repository": state["repo_path"]
    })
    # Only the summary returns to main state
    state["exploration_summary"] = sub_result["summary"]
    return state
```

---

## 7. Token Budgeting

Proactive token management — allocate a budget before starting, track spending, adjust behavior when approaching the limit.

### Budget Allocation Pattern

```python
class TokenBudget:
    def __init__(self, total: int = 180_000):
        self.total = total
        self.system_reserve = 10_000     # System prompt + tools
        self.history_budget = 80_000    # Conversation history
        self.working_budget = 60_000    # Files, tool outputs
        self.output_reserve = 8_000     # Model output
        self.safety_margin = 22_000     # Buffer
    
    @property
    def remaining_history(self) -> int:
        return self.history_budget - self.history_used
    
    def should_summarize(self) -> bool:
        return self.remaining_history < 20_000
    
    def should_delegate(self) -> bool:
        return self.remaining_history < 5_000
```

### Codeium's Dynamic Token Budgeting

Codeium prioritizes tokens based on file proximity and edit history:
- Files currently open: high priority
- Recently edited files: medium priority  
- Files referenced in open files: medium priority
- Everything else: low priority / excluded

This creates a dynamic context that reflects the current coding task without requiring explicit memory management.

---

## 8. Chunking Strategies

When processing large files or repositories, chunk them for tractable handling.

### Semantic Chunking (Code-Aware)

```python
import ast

def chunk_python_file(source: str) -> list[dict]:
    """Split Python file into semantic chunks at function/class boundaries"""
    tree = ast.parse(source)
    chunks = []
    
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            start = node.lineno
            end = node.end_lineno
            chunk_source = "\n".join(source.split("\n")[start-1:end])
            chunks.append({
                "type": "function" if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) else "class",
                "name": node.name,
                "lines": (start, end),
                "source": chunk_source,
                "tokens": estimate_tokens(chunk_source)
            })
    
    return chunks
```

### Repository-Level Chunking

For large codebases:
1. **Directory-level summary**: `ls -R`, file count, major subsystems
2. **File-level metadata**: name, size, last modified, key exports (via `ctags` or AST)
3. **Function-level detail**: on-demand, retrieved when the agent specifically needs to read a function

---

## 9. Context Engineering Principles (Anthropic)

From Anthropic's "Effective Context Engineering" post:

### 1. Minimal High-Signal Tokens
> "Find the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome."

Every token in context has a cost — it consumes the model's limited attention budget. Add context intentionally, not by default.

### 2. System Prompt Altitude
The system prompt should be at the right altitude:
- **Too specific**: Brittle if-else logic that breaks on edge cases
- **Too vague**: Model has no concrete guidance
- **Just right**: Clear behavioral heuristics that generalize well

Use XML/Markdown headers to organize: `<background_information>`, `<instructions>`, `## Tool guidance`, `## Output description`.

### 3. Minimal Viable Tool Set
Bloated tool sets waste context (each tool definition = tokens) and create ambiguity. Ask: what's the minimal set of tools that enables this task?

### 4. Just-in-Time Context
Tools allow agents to pull in new context as they work. Don't preload — let the agent fetch what it needs when it needs it:

```python
# Bad: preload everything
context = load_all_project_files()  # 50K tokens

# Good: let agent pull on demand
tools = [
    {"name": "read_file", "description": "Read a file by path"},
    {"name": "search_code", "description": "Search codebase with a query"},
]
```

---

## 10. Context Strategies by Agent Type

| Agent Type | Primary Strategy | Secondary |
|-----------|-----------------|-----------|
| Short coding task (<1h) | Sliding window | Minimal pruning |
| Long refactor (>1 day) | Subagent delegation | Progressive summarization |
| Code review | RAG (retrieve relevant context) | Structured summaries |
| Multi-file feature | Token budgeting + chunking | Subagents per module |
| Test debugging loop | Full history (test failures are compact) | Truncate passing tests |
| Research + synthesis | RAG | External memory (files) |

---

## Sources

- Anthropic Engineering: Effective Context Engineering — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic: Memory tool — https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- arXiv: AI Agentic Programming Survey (2508.11126) — https://arxiv.org/html/2508.11126v1 (context window table)
- arXiv: Self-RAG (2310.11511) — https://arxiv.org/abs/2310.11511
- Introl: Claude Code CLI Reference — https://introl.com/blog/claude-code-cli-comprehensive-guide-2025
- CrewAI Agents docs — https://docs.crewai.com/concepts/agents
