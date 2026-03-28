# Context Window Management in Long-Running Coding Agents

> Research compiled: March 2026  
> Topics: Compaction strategies, summarization, RAG for codebase, chunking, how Claude Code and Aider handle large repos

---

## Overview

Context window management is one of the most critical and underappreciated engineering challenges in long-running coding agents. As an agent works through a complex codebase — reading files, executing commands, fixing bugs, and iterating — the context window fills up rapidly. Without active management, agents either:

1. Hit the context limit and crash/truncate
2. Spend enormous token budgets on stale context
3. Lose important information needed to complete the task

The fundamental tension is: **everything in context is immediately accessible but expensive; everything outside must be retrieved but is free**. Different systems solve this tradeoff differently.

---

## The Context Window Problem in Coding Agents

### Why Context Fills Up Quickly

A typical coding agent session on a medium-sized repository might include:

```
System prompt:            ~2,000 tokens
CLAUDE.md / project docs: ~3,000 tokens  
Initial codebase scan:    ~15,000 tokens (reading 50 files × 300 tokens avg)
Tool call results:        ~20,000 tokens (bash output, test results, grep results)
Conversation history:     ~10,000 tokens
Current reasoning:        ~2,000 tokens
Total:                    ~52,000 tokens
```

For a 200k token window (Claude 3.5 Sonnet), this leaves ~148k tokens. But as the session extends — more files read, more iterations, more test output — this fills quickly.

**Issues that arise:**
- Early context (initial codebase scan) is rarely needed again but occupies space
- Tool call outputs accumulate (every bash command adds output)
- Multiple rounds of iteration create long back-and-forth chains
- Large file reads bloat context even when only a few lines are relevant

### The Compaction Tax

When compaction fires:
1. The model summarizes early context (consuming tokens to do so)
2. The summary is shorter but loses detail
3. Future references to compacted information are less precise
4. Compaction itself can take 10-50k tokens of "work"

From a GitHub issue on Claude Code:
> "During extended agentic coding sessions, context window compaction kicks in frequently and consumes what feels like roughly half of the available tokens. This creates a frustrating loop where: Context fills up with codebase files, tool calls, and conversation history."

---

## Claude Code's Compaction Approach

### Automatic Compaction

Claude Code implements automatic compaction via Anthropic's API:

**How it works:**
1. System monitors remaining context budget
2. When utilization crosses a threshold (~70-80%), compaction triggers
3. Earlier conversation turns are summarized by a secondary model call
4. Summary replaces the original detailed turns
5. Conversation continues with more context budget available

**What gets summarized:**
- Early file reads (replaced with "previously read X, key finding: Y")
- Tool call chains (replaced with outcome summaries)
- Exploratory commands (bash ls, grep searches)

**What's preserved:**
- Critical code snippets still actively needed
- Error messages from recent test runs
- Current task state and progress

### Manual Compaction (`/compact`)

Users can trigger compaction manually:
```
/compact
```

This summarizes the conversation so far with instructions to preserve:
- Current task description
- Files modified
- Tests passing/failing
- Key decisions made

### Server-Side Compaction (Claude API)

Anthropic introduced server-side compaction in the Claude API:

```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    model="claude-opus-4-5",
    max_tokens=8192,
    messages=messages,
    betas=["interleaved-thinking-2025-05-14"],
    # Server-side compaction happens automatically
)
```

From Anthropic docs:
> "Compaction extends the effective context length for long-running conversations and tasks by automatically summarizing older context when approaching the context window limit. It handles context management automatically with minimal integration work."

---

## Aider's Approach: The Repo Map

Aider (the open-source coding assistant) takes a fundamentally different approach: rather than managing what goes into context during a session, it uses a **persistent structural map** of the codebase to efficiently navigate.

### The Repo Map Architecture

**Phase 1: AST Parsing with Tree-Sitter**

Aider uses tree-sitter to parse every file in the repository and extract:
- Class definitions
- Function signatures and return types
- Import/export relationships
- Call relationships between functions

Tree-sitter supports 50+ languages and provides accurate AST parsing without requiring language servers.

**Phase 2: PageRank-Based Relevance Ranking**

The repo map uses a PageRank-style algorithm to rank code elements by importance:
- Elements that are imported/referenced frequently rank higher
- Entry points (main functions, API handlers) rank high
- Dead code ranks low
- Elements referenced in the current task rank highest

```python
# Simplified repo map generation
def build_repo_map(repo_path, task_description):
    # Parse all files
    all_symbols = parse_with_treesitter(repo_path)
    
    # Build reference graph
    graph = build_reference_graph(all_symbols)
    
    # Apply PageRank
    ranks = networkx.pagerank(graph)
    
    # Filter to fit context budget
    top_symbols = select_top_by_rank(ranks, budget=4000)
    
    return format_as_compact_map(top_symbols)
```

**Phase 3: Compact Map Output**

The output is a compact representation:
```
# Repo Map (top 50 symbols by relevance)

src/auth/models.py:
  class User(BaseModel):
    id: int
    email: str
    created_at: datetime
    def verify_password(self, password: str) -> bool

src/auth/handlers.py:
  def login_handler(request: Request) -> Response  # calls User.verify_password
  def signup_handler(request: Request) -> Response  # creates User

src/api/routes.py:
  router = APIRouter()
  # registers: /auth/login, /auth/signup
```

This compact map (4,000-8,000 tokens) gives the model a structural understanding of the entire codebase without reading every file in full.

### Dynamic Map Updates

As Aider makes changes:
1. Modified files are immediately re-parsed
2. New symbols are added to the map
3. Deleted symbols are removed
4. Map stays current with code state

### Context Budget Management

Aider dynamically allocates context budget:
- Repo map: 4,000-8,000 tokens (constant)
- Active files (explicitly added): unbounded
- Recent conversation: last N turns
- Tool output: truncated if too long

Users can explicitly add files to context:
```
/add src/auth/models.py
/add src/api/routes.py
```

---

## RAG for Codebase Navigation

Retrieval-Augmented Generation (RAG) for codebases extends beyond simple keyword search to semantic, structure-aware retrieval.

### Code-Specific Embedding Challenges

Text embeddings aren't optimal for code:
- Variable names are arbitrary (x, temp, val)
- Structure matters more than vocabulary
- AST structure encodes semantics
- Docstrings and comments are different signal than implementation

**Solutions:**
- Code-specific embedding models (CodeBERT, UniXCoder, StarCoder embeddings)
- Chunk by function/class boundaries, not by token count
- Include function signature + docstring in each chunk's metadata

### Chunking Strategies

**Naive chunking (poor):**
```
Split every 512 tokens
→ Breaks functions mid-way
→ Loses context about what class/module a function belongs to
→ Poor retrieval quality
```

**Syntax-aware chunking (better):**
```
Split at function/class boundaries
→ Each chunk = one complete unit of code
→ Preserve imports and class context
→ Much better semantic coherence
```

**Hierarchical chunking (best for large repos):**
```
Level 1: Repository overview (file list + module descriptions)
Level 2: File summaries (extracted from docstrings + structure)
Level 3: Class/function chunks (individual code units)
→ Query at Level 1 to find relevant files
→ Retrieve Level 3 chunks from those files
→ Include Level 2 summaries for missing context
```

### Embedding Databases for Code

| Database | Best For | Key Feature |
|----------|----------|-------------|
| Chroma | Local development | Embedded, zero-config |
| Qdrant | Production scale | High performance, filtering |
| Weaviate | Enterprise | Multi-modal, GraphQL API |
| pgvector | Postgres shops | No new infrastructure |
| LanceDB | Edge deployment | Embedded, columnar storage |

### Hybrid Search (BM25 + Vector)

Combining keyword search with semantic search improves code retrieval:
- BM25 (keyword): Good for exact function names, variable names, error messages
- Vector search: Good for semantic similarity ("find functions that validate user input")
- Hybrid: Use both, re-rank results

---

## Subagent-Based Context Management

A powerful pattern for managing context is to use **subagents** for context-heavy exploration:

```
Main Agent (lean context)
  ├── Task: Fix bug in auth module
  ├── Spawns: Exploration Subagent
  │     ├── Context: Full codebase scan
  │     ├── Returns: Summary of auth flow
  │     └── Terminates (releases context)
  ├── Receives summary (compact, 500 tokens)
  ├── Applies fix
  └── Spawns: Test Subagent
        ├── Runs test suite
        ├── Returns: Pass/fail summary
        └── Terminates
```

From Claude Code's best practices:
> "Since context is your fundamental constraint, subagents are one of the most powerful tools available. When Claude researches a codebase it reads lots of files, all of which consume your context. Subagents run in separate context windows and report back summaries."

This pattern keeps the main agent's context lean while allowing unlimited exploration via subagents.

---

## Sliding Window Approaches

For long agent sessions, a sliding window maintains only recent context:

```python
class SlidingWindowConversation:
    def __init__(self, max_tokens=100000, preserve_system=True):
        self.messages = []
        self.max_tokens = max_tokens
        self.system = None
    
    def add_message(self, message):
        self.messages.append(message)
        while self._count_tokens() > self.max_tokens:
            # Summarize and remove oldest messages
            summary = self._summarize_oldest_messages(n=5)
            self.messages = self.messages[5:]
            self.messages.insert(0, {
                "role": "system",
                "content": f"[Context summary: {summary}]"
            })
```

**Variants:**
1. **Hard truncation**: Drop oldest messages (simple but lossy)
2. **Summarization**: Summarize then drop (better retention, costs tokens)
3. **Importance-weighted**: Keep important messages regardless of age
4. **Selective compression**: Compress tool outputs but keep model reasoning

---

## File Reading Strategies

### Full File Reads (Expensive)

Reading entire files into context:
```python
content = open('src/models.py').read()  # Might be 500-2000 tokens
```

**When appropriate:**
- File is small and entirely relevant
- Agent needs to understand complete context
- Making structural changes to the file

### Line-Range Reads (Efficient)

Read only relevant sections:
```python
# Read lines 100-200 of a large file
content = read_file_lines('src/models.py', start=100, end=200)
```

Claude Code implements this with its `View` tool which accepts line ranges.

### Symbol-Level Reads

Extract only specific functions/classes:
```python
# Using tree-sitter to extract just the User class
user_class = extract_symbol('src/models.py', 'class User')
```

### Semantic Search Within Files

For very large files (>1000 lines), use grep/search before reading:
```bash
grep -n "def validate_" src/auth/models.py
# Returns: line numbers of relevant functions
# Then read only those sections
```

---

## Prompt Caching for Context Efficiency

Anthropic, OpenAI, and others support **prompt caching** — when the same prefix is reused across calls, cached tokens are cheaper:

```python
# Anthropic prompt caching example
messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": codebase_content,  # Large, stable content
                "cache_control": {"type": "ephemeral"}  # Cache this!
            },
            {
                "type": "text", 
                "text": task_description  # Variable, don't cache
            }
        ]
    }
]
```

**Savings:** Cached tokens cost ~10% of full tokens.
**Strategy:** Put stable content (codebase, instructions) at the start of context, variable content (task, conversation) at the end.

---

## Model-Specific Context Limits

| Model | Context Window | Practical Working Context |
|-------|---------------|--------------------------|
| Claude 3.5 Sonnet | 200k tokens | ~150k (reserve for output) |
| Claude Opus 4.5 | 200k tokens | ~150k |
| GPT-4o | 128k tokens | ~100k |
| GPT-4 Turbo | 128k tokens | ~100k |
| Gemini 1.5 Pro | 1M tokens | ~800k |
| Gemini 1.5 Flash | 1M tokens | ~800k |

**Note on Gemini's 1M context:** While theoretically capable, performance degrades significantly at 500k+ tokens for complex reasoning tasks. "Lost in the middle" phenomenon: models attend poorly to content in the middle of very long contexts.

---

## Best Practices for Long-Running Agent Context

1. **Start lean**: Don't pre-load the entire codebase. Explore on demand.
2. **Use repo maps**: A compact structural overview is more valuable than full file reads.
3. **Prune tool output**: Truncate verbose bash output (e.g., first/last 50 lines of test output).
4. **Subagent exploration**: Use separate agents for codebase research, return compact summaries.
5. **Cache stable prefixes**: Use prompt caching for project docs, coding standards, etc.
6. **Incremental reading**: Read files in sections rather than all at once.
7. **Semantic retrieval**: Use embeddings to find relevant files rather than reading all.
8. **Checkpoint summaries**: At key milestones, summarize progress explicitly before continuing.
9. **Avoid re-reading**: Track what's been read; only re-read if file was modified.
10. **Budget-aware tool calls**: Track approximate token usage; be conservative as budget depletes.

---

## Sources

- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Claude Code compaction blog: https://stevekinney.com/courses/ai-development/claude-code-compaction
- Compaction issue tracking: https://github.com/anthropics/claude-code/issues/28984
- Anthropic Compaction API: https://platform.claude.com/docs/en/build-with-claude/compaction
- Anthropic Context Windows: https://platform.claude.com/docs/en/build-with-claude/context-windows
- Aider repo map: https://aider.chat/docs/repomap.html
- Aider tree-sitter blog: https://aider.chat/2023/10/22/repomap.html
- Aider Reddit discussion: https://www.reddit.com/r/ChatGPTCoding/comments/1iwediw/aiders_repomap_for_large_codebases_lsp/
