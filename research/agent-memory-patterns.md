# Memory and State Management in Coding Agents

> Research compiled: March 2026  
> Topics: Episodic, procedural, semantic memory, persistence patterns, MEMORY.md files, vector stores, state management

---

## Overview

Memory is one of the defining challenges in building effective long-running agents. Unlike humans who maintain continuous memory across time, AI agents are fundamentally stateless — each invocation starts fresh with no inherent recollection of past events. Yet effective coding agents need to:

- Remember preferences and constraints established in earlier sessions
- Recall decisions made about architecture and design
- Know what files were modified and why
- Learn from past mistakes to avoid repeating them
- Maintain consistent style and conventions across a large project

Building memory systems for coding agents is an active area of research and engineering. This document covers the taxonomy of memory types, concrete implementation patterns, and how leading systems approach the problem.

---

## The Three Types of Long-Term Memory

Cognitive science distinguishes three types of long-term memory, and this framework maps directly onto AI agent memory systems:

### 1. Episodic Memory

**Definition:** Memory of specific past events — "what happened when."

In human cognition, episodic memory stores autobiographical experiences: "Last Tuesday I debugged the authentication module and found a race condition."

In AI agents, episodic memory stores:
- Past conversation turns and decisions
- Specific bugs encountered and solutions found
- Error messages seen and resolutions applied
- What approaches were tried and failed
- Timeline of changes made to the codebase

**Implementation approaches:**
- Raw conversation logs stored to disk
- Timestamped event databases (SQLite, PostgreSQL)
- Vector stores with temporal metadata for retrieval
- Conversation summaries organized by date

**Key challenge:** Episodic stores grow unbounded. Without curation, they become noisy and retrieval quality degrades.

### 2. Semantic Memory

**Definition:** General knowledge and facts — "what is true."

In human cognition, semantic memory stores facts independent of when they were learned: "Python's GIL prevents true parallel threading."

In AI agents, semantic memory stores:
- Codebase facts: "The auth module uses JWT tokens, not sessions"
- Project constraints: "Never use lodash — use native ES6 methods"
- API specifications and schemas
- Architecture decisions and their rationale
- Coding standards and style preferences

**Implementation approaches:**
- MEMORY.md / CLAUDE.md files loaded into system prompt
- Vector stores for semantic retrieval of facts
- Knowledge graphs for structured relationships
- Configuration files (project-specific agent settings)

**Key advantage:** Semantic memory is compact and stable. A well-curated semantic store might be only 2-10k tokens.

### 3. Procedural Memory

**Definition:** Knowledge of how to do things — "how to act."

In human cognition, procedural memory stores learned skills: riding a bike, typing.

In AI agents, procedural memory stores:
- Standard workflows (how to deploy, how to run tests)
- Code patterns and templates the project uses
- Debugging methodologies that work for this codebase
- Tool usage patterns
- Learned heuristics from past successes and failures

**Implementation approaches:**
- SKILLS.md or workflow documents loaded into context
- Few-shot examples in system prompt
- Runbooks and SOPs for common tasks
- Code templates and snippets

---

## Short-Term vs Long-Term Memory

### Short-Term (Working Memory)

Short-term memory in agents corresponds to the **context window** — everything currently in the active prompt:

- Currently reading files
- Recent tool outputs
- Active conversation turns
- Current task description

**Characteristics:**
- Immediately accessible (no retrieval needed)
- Limited capacity (context window size)
- Lost when session ends
- "Free" in the sense of being always-available

### Long-Term (Persistent Memory)

Long-term memory persists across sessions via external storage:

- Files on disk (MEMORY.md, logs, notes)
- Databases (SQLite, PostgreSQL)
- Vector stores (Chroma, Qdrant, pgvector)
- Key-value stores (Redis)

**Characteristics:**
- Requires explicit read/write operations
- Unlimited capacity (bounded by storage)
- Survives session restarts
- Requires retrieval to access

---

## File-Based Memory Patterns (MEMORY.md Pattern)

The simplest and most widely used memory pattern for coding agents is **markdown files loaded into context**. This pattern has emerged organically in the Claude Code and similar agent communities.

### CLAUDE.md / AGENTS.md Pattern

Claude Code natively supports a hierarchical file loading system:

```
~/.claude/CLAUDE.md              # User-global settings
~/projects/myapp/CLAUDE.md       # Project-specific settings
~/projects/myapp/src/CLAUDE.md   # Directory-specific settings
```

All these files are automatically loaded into the system prompt at the start of each session.

**Typical CLAUDE.md content:**
```markdown
# Project: MyApp Backend

## Stack
- Python 3.11
- FastAPI + SQLAlchemy
- PostgreSQL (production), SQLite (tests)

## Conventions
- Use Pydantic v2 models for all schemas
- Never use print() — use logger.info() 
- Tests go in tests/unit/ or tests/integration/

## Preferences
- Prefer explicit over implicit
- Always add type hints
- Write docstrings for all public functions

## Decisions Made
- Auth uses JWT, not sessions (decided 2024-01-15)
- Redis for rate limiting, not in-process
- Celery for background tasks, not threads
```

### MEMORY.md Pattern (Procedural/Episodic Blend)

A more dynamic pattern used by OpenClaw and other harnesses:

```markdown
# Memory Log

## 2025-03-27

- Fixed N+1 query issue in UserRepository.get_by_email()
- Deployed new auth flow to staging — working
- TODO: Update auth docs when main is merged

## 2025-03-26

- Tried using orjson for JSON parsing — incompatible with Pydantic v2 validators
- Reverted to standard json module
- The CORS issue was caused by missing OPTIONS handler in nginx config
```

**Key properties:**
- Agent writes to this file after significant events
- File grows over time (requires periodic curation)
- Loaded into context each session for continuity
- Human-readable and editable

### Claude Code's Undocumented Memory Directory

Discovered by the community in early 2026:
```
~/.claude/projects/<project-path>/memory/MEMORY.md
```

If a MEMORY.md file exists in this path, it's automatically loaded into the system prompt for that project. This enables per-project persistent memory without modifying the project's own files.

---

## Vector Store-Based Memory

For large memory stores where file-based loading would consume too much context, vector stores enable semantic retrieval:

### Architecture

```
Agent experiences events
       ↓
Memory Manager (writes to vector store)
       ↓
Vector Store (Chroma/Qdrant/pgvector)
       ↓ (at query time)
Semantic search for relevant memories
       ↓
Inject top-K memories into context
```

### Example Implementation

```python
from chromadb import Client
from anthropic import Anthropic

class AgentMemory:
    def __init__(self):
        self.db = Client()
        self.memories = self.db.get_or_create_collection("agent_memories")
    
    def store(self, content: str, metadata: dict):
        """Store a memory with automatic embedding"""
        self.memories.add(
            documents=[content],
            metadatas=[metadata],
            ids=[f"memory_{hash(content)}"]
        )
    
    def retrieve(self, query: str, n: int = 5) -> list[str]:
        """Retrieve relevant memories for a query"""
        results = self.memories.query(
            query_texts=[query],
            n_results=n
        )
        return results['documents'][0]
    
    def build_context_prefix(self, task: str) -> str:
        """Build a context-efficient memory prefix"""
        relevant = self.retrieve(task)
        if not relevant:
            return ""
        return "## Relevant past experiences:\n" + "\n".join(
            f"- {m}" for m in relevant
        )
```

### Memory Types in Vector Store

Different memory types benefit from different embedding/retrieval strategies:

| Memory Type | Embedding Model | Chunk Strategy | Retrieval Method |
|-------------|----------------|----------------|-----------------|
| Code changes | Code-specific (CodeBERT) | Per file/function | Cosine similarity |
| Decisions | Text (ada-002) | Per decision | Semantic search |
| Errors/fixes | Text + code hybrid | Per error-fix pair | Keyword + semantic |
| Preferences | Text | Per preference | Always-include |

---

## Checkpointing and State Persistence

For long-running agents working on complex tasks, **checkpointing** persists intermediate state:

### What to Checkpoint

```python
@dataclass
class AgentCheckpoint:
    task_id: str
    timestamp: datetime
    
    # Task state
    task_description: str
    subtasks_completed: list[str]
    subtasks_remaining: list[str]
    
    # Codebase state
    files_modified: list[str]
    git_commit_hash: str  # Point-in-time snapshot
    
    # Working memory
    current_hypothesis: str
    errors_encountered: list[str]
    approaches_tried: list[str]
    
    # Tools state
    test_results: dict  # {test_name: pass/fail}
    last_bash_output: str
```

### Git as Memory

A powerful pattern for coding agents: **use git as the episodic memory store**:

```bash
# After each significant change
git add -A
git commit -m "Agent checkpoint: implemented JWT validation
- Modified: src/auth/handlers.py, src/auth/models.py
- Tests passing: test_auth.py (12/12)
- Reasoning: Switched from sessions to JWT for stateless auth"
```

**Benefits:**
- Free — git is already there
- Recoverable — can roll back to any point
- Diff-able — can see exactly what changed when
- Branch-able — try approaches in branches
- Human-readable with good commit messages

**Accessing git history as memory:**
```bash
git log --oneline -20  # See recent agent actions
git diff HEAD~5        # See changes from last 5 agent turns
git show HEAD:src/auth/handlers.py  # See file at any point
```

---

## Memory Architectures in Production Systems

### Claude Code's Memory Hierarchy

```
Level 1 (Always Present):
  - ~claude/CLAUDE.md (global user settings)
  - <project>/CLAUDE.md (project settings)
  - <dir>/CLAUDE.md (directory settings)
  - ~/.claude/projects/<path>/memory/MEMORY.md

Level 2 (Loaded on demand via Skills):
  - ~/.claude/skills/*.md
  - Activated by /skill-name or automatically

Level 3 (Retrieved via tools):
  - File reads (explicit)
  - Web searches
  - grep/find for code navigation
```

### Mem0: Memory-as-a-Service

**Mem0** is a managed memory service for AI agents with:
- User-level, session-level, and agent-level memory
- Automatic deduplication and contradiction resolution
- REST API for easy integration
- SDKs for Python, JavaScript

```python
from mem0 import MemoryClient

client = MemoryClient(api_key="...")

# Store memories automatically
client.add("The project uses FastAPI, never Flask", user_id="project_auth")
client.add("Always write async route handlers", user_id="project_auth")

# Retrieve relevant memories
memories = client.search("how to write routes", user_id="project_auth")
```

### LangChain Memory Modules

LangChain provides multiple memory backends:

```python
from langchain.memory import (
    ConversationBufferMemory,      # Simple buffer
    ConversationSummaryMemory,     # Auto-summarize
    ConversationVectorStoreMemory, # Semantic retrieval
    CombinedMemory,                # Combine multiple
)

# Combined: recent buffer + semantic retrieval
memory = CombinedMemory(memories=[
    ConversationBufferMemory(k=5),  # Last 5 turns always
    ConversationVectorStoreMemory(  # Semantic retrieval from full history
        vectorstore=chroma_store,
        k=3
    )
])
```

### Redis-Based Memory

Redis provides both fast key-value storage and vector search (RediSearch):

```python
import redis
from redis.commands.search.field import VectorField, TextField

# Store conversation history
r = redis.Redis()
r.lpush("agent:conversation", json.dumps({"role": "assistant", "content": "..."}))

# Store as vector for semantic search
r.hset(f"memory:{id}", mapping={
    "content": memory_text,
    "embedding": serialize_vector(embedding),
    "timestamp": time.time(),
    "type": "episodic"
})
```

---

## Memory Curation and Maintenance

Raw memory accumulates noise. Effective memory systems include **curation** mechanisms:

### Automatic Curation Patterns

1. **Recency weighting**: Decay importance of old memories
2. **Contradiction resolution**: When new fact contradicts old, update
3. **Deduplication**: Remove near-identical memories
4. **Consolidation**: Merge related episodic memories into semantic summaries

### Manual Curation in MEMORY.md Systems

Best practice: periodically review and edit memory files:
```markdown
# After 2 weeks, remove:
- Temporary debugging notes
- Outdated dependency information
- Solved problems no longer relevant

# Retain and promote:
- Architecture decisions with rationale
- Non-obvious gotchas and workarounds  
- Learned preferences about the codebase
```

### The Forgetting Curve

Human memory theory: less-reinforced memories fade. AI agents can implement a similar curve:

```python
def should_retain(memory, current_time):
    age_days = (current_time - memory.timestamp).days
    access_count = memory.access_count
    
    # Ebbinghaus-inspired retention formula
    retention = math.exp(-age_days / (access_count * 10 + 1))
    
    return retention > 0.1  # Forget memories below 10% retention
```

---

## Practical Memory Patterns by Agent Type

### Short-Session Coding Agent (< 30 min)

**What's needed:**
- Task description in context
- Relevant CLAUDE.md settings
- Key files loaded on demand

**What's NOT needed:**
- Episodic memory (session is too short for accumulation)
- Vector stores (overhead not justified)

### Long-Session Coding Agent (hours)

**What's needed:**
- Active checkpointing (every 30-60 minutes)
- Compact progress summaries in MEMORY.md
- Git commits as episodic log
- Vector retrieval for large codebase navigation

### Multi-Day Coding Agent

**What's needed:**
- Full episodic store with semantic search
- Curated semantic memory (key decisions, conventions)
- Procedural runbooks for common tasks
- Daily summary files (memory/YYYY-MM-DD.md)
- MEMORY.md with distilled long-term learnings

---

## Comparison: Memory Approaches

| Approach | Setup Cost | Token Cost | Recall Quality | Maintainability |
|----------|------------|------------|----------------|-----------------|
| CLAUDE.md static file | Low | Fixed | Perfect (always loaded) | Manual |
| MEMORY.md dynamic file | Low | Variable | Good | Semi-manual |
| Vector store (Chroma) | Medium | Retrieval overhead | Semantic match | Automatic |
| Database (PostgreSQL) | High | Low (filtered) | Exact + semantic | Automatic |
| Git log as memory | Near-zero | Low | Limited (needs parsing) | Automatic |
| Mem0 managed | Low | API calls | Good | Automatic |

---

## Emerging Patterns (2025-2026)

### Neural Memory Banks

Research is exploring integrating learned memory directly into model weights via fine-tuning on agent experiences. Less practical currently but promising for specialized agents.

### Hierarchical Episodic-Semantic Memory

Automatic promotion of episodic memories to semantic facts:
1. Record specific event (episodic): "Using asyncio.gather with error handling caused issues on 2025-03-01"
2. Observe pattern (3+ times): "asyncio.gather fails silently in this codebase"
3. Promote to semantic fact: "Use asyncio.wait instead of asyncio.gather for error handling"

### Multi-Agent Shared Memory

When agent swarms work on the same codebase, shared memory stores coordination:
- Which agent is working on which module
- Discoveries about the codebase shared across all agents
- Conflict detection (two agents modifying same file)

---

## Sources

- TigerData on AI agent memory: https://www.tigerdata.com/learn/building-ai-agents-with-persistent-memory-a-unified-database-approach
- Redis agent memory: https://redis.io/blog/build-smarter-ai-agents-manage-short-term-and-long-term-memory-with-redis/
- Oracle developer blog on agent memory: https://blogs.oracle.com/developers/agent-memory-why-your-ai-has-amnesia-and-how-to-fix-it
- MachineLearningMastery long-term memory: https://machinelearningmastery.com/beyond-short-term-memory-the-3-types-of-long-term-memory-ai-agents-need/
- Reddit coding agent memory system: https://www.reddit.com/r/ClaudeCode/comments/1r1w397/what_i_learned_building_a_memory_system_for_my_coding_agent/
- Claude Code memory docs: https://code.claude.com/docs/en/memory
- Claude Code undocumented memory: https://www.reddit.com/r/ClaudeAI/comments/1qw9hr4/claude_code_has_an_undocumented_persistent_memory/
- Claude Code memory feature request: https://github.com/anthropics/claude-code/issues/14227
