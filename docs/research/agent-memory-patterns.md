# Memory and State Management in Coding Agents

> Research note covering episodic vs semantic memory, vector stores, MemGPT/Letta, working memory, external stores, and how OpenCode/Claude Code/Devin maintain state across sessions.

---

## 1. Why Memory Matters

Without memory, every session starts from zero. The agent can't:
- Learn from past mistakes
- Recall project-specific conventions it discovered last week
- Continue a multi-day task without re-reading all prior context
- Personalize behavior based on user preferences
- Build cumulative knowledge about a codebase

This is why coding agents that feel "smart" in session but "dumb" across sessions are frustrating to use. Memory is the bridge between ephemeral context windows and persistent intelligence.

The AI Agentic Programming Survey (arXiv 2508.11126) lists **lack of persistent memory across tasks** as one of the top key challenges in the field.

---

## 2. Taxonomy of Agent Memory

### 2.1 By Temporal Scope

| Type | Analogy | What It Stores | Lifespan |
|------|---------|---------------|---------|
| **Working memory** | Human short-term | Active context window contents | Current session only |
| **Episodic memory** | Autobiographical memory | Specific past events, interactions, experiences | Persistent, queryable |
| **Semantic memory** | General knowledge | Facts, concepts, learned patterns | Persistent, queryable |
| **Procedural memory** | Skill/habit | How-to knowledge, behavioral patterns | Persistent, baked into weights or prompts |

### 2.2 By Storage Mechanism

| Mechanism | Examples | Retrieval Method | Best For |
|-----------|----------|-----------------|---------|
| **In-context** | Conversation history | Direct (it's in the prompt) | Current session, recent turns |
| **File-based** | markdown files, JSON | Read on demand | Configuration, notes, handoff state |
| **Database** | SQLite, PostgreSQL | SQL query | Structured records, logs |
| **Vector store** | ChromaDB, Pinecone, pgvector | Semantic search (k-NN) | Unstructured memories, relevance retrieval |
| **Cache/KV** | Redis, DynamoDB | Key lookup | Fast retrieval of known IDs |
| **Model weights** | Fine-tuned model | Implicit (always available) | Stable, universal knowledge |

---

## 3. Working Memory: The Context Window

The most fundamental form of memory is the current context window. Everything the agent "knows" right now is in here:

```
┌─────────────────────────────────────────────────────┐
│                  CONTEXT WINDOW                      │
│                                                      │
│  System prompt (role, instructions, tools)           │
│  ─────────────────────────────────────────────────  │
│  Tool results from this session                      │
│  ─────────────────────────────────────────────────  │
│  Conversation history (most recent turns)            │
│  ─────────────────────────────────────────────────  │
│  Injected external memory (retrieved this turn)      │
└─────────────────────────────────────────────────────┘
```

Working memory management is covered in detail in `context-management.md`. The key constraint: when the session ends, working memory evaporates unless explicitly persisted.

---

## 4. File-Based Memory: The Simplest Persistent Store

The most pragmatic and widely-used persistent memory pattern in coding agents is simply **reading and writing files**.

### Anthropic Memory Tool

Claude's `memory_20250818` tool implements this pattern at the API level:

```json
{
  "type": "memory_20250818",
  "name": "memory"
}
```

When enabled, Claude automatically:
1. Checks `/memories` directory at the start of tasks
2. Reads relevant files to load context
3. Writes new learnings as files when useful
4. Updates files when existing info changes

Example interaction flow:
```text
User: "Help me respond to this customer service ticket."

Claude → memory tool: view /memories
Response: customer_service_guidelines.xml, refund_policies.xml

Claude → memory tool: view /memories/customer_service_guidelines.xml
Response: [contents]

Claude: "Based on your customer service guidelines, I can help..."
```

The memory tool is **client-side**: you control where the data lives. You can back it by:
- Local filesystem
- Cloud storage (S3, GCS)
- Database blobs
- Encrypted storage

From the docs:
> "This is the key primitive for just-in-time context retrieval: rather than loading all relevant information upfront, agents store what they learn in memory and pull it back on demand."

### Claude Code Memory Files

Claude Code uses a hierarchical memory file system:
- `CLAUDE.md` (project root): Project-specific instructions, conventions, architecture notes
- `~/.claude/CLAUDE.md` (global): User preferences, cross-project patterns
- `AGENTS.md`: Additional agent guidance (can stack with CLAUDE.md)

These files are automatically loaded into every session's context. The model can edit them during a session to persist learnings:

```bash
# Claude Code reads this at session start
# CLAUDE.md
## Project Conventions
- Use pytest for tests
- Async functions must use trio, not asyncio
- PR titles must start with Jira ticket number

## Architecture Notes
- Auth module is in src/auth/ — don't touch without reading RFC-001.md
- Database migrations are auto-applied on startup via alembic
```

### OpenClaw Pattern

OpenClaw's Claude-as-assistant uses daily memory files (`memory/YYYY-MM-DD.md`), a long-term `MEMORY.md`, and a `SOUL.md` — a pure file-based memory system that provides continuity across sessions without any vector database.

---

## 5. MemGPT / Letta: Tiered Memory Architecture

MemGPT (now Letta) was the first system to give LLMs an **OS-like memory management model**:

```
┌─────────────────────────────────────────────────┐
│              MAIN CONTEXT (fast)                 │
│   System prompt + recent conversation            │
│   ← fits in context window                      │
├─────────────────────────────────────────────────┤
│              RECALL STORAGE (medium)             │
│   Full conversation history                      │
│   ← searchable, but not always in context       │
├─────────────────────────────────────────────────┤
│              ARCHIVAL STORAGE (slow)             │
│   Long-term knowledge, reference docs, history   │
│   ← large, indexed, vector search               │
└─────────────────────────────────────────────────┘
```

The model explicitly manages these tiers using memory tools:
- `core_memory_append`: Add to the main context (persona/human blocks)
- `core_memory_replace`: Replace content in main context
- `archival_memory_insert`: Write to long-term archival storage
- `archival_memory_search`: Retrieve from archival storage
- `conversation_search`: Search the recall (conversation) history

This gives the LLM explicit control over its own memory — it decides what's worth keeping, what to archive, and when to retrieve.

### Letta API (2025 version)

```python
from letta_client import Letta

client = Letta(api_key=os.getenv("LETTA_API_KEY"))

# Create a stateful agent with persistent memory blocks
agent_state = client.agents.create(
    model="openai/gpt-5.2",
    memory_blocks=[
        {
            "label": "human",
            "value": "Name: Timber. Role: Lead Engineer. Prefers concise responses."
        },
        {
            "label": "persona", 
            "value": "I am a coding assistant with deep knowledge of this codebase."
        },
    ],
    tools=["web_search", "fetch_webpage"],
)

# Agent remembers state across calls
response1 = client.agents.messages.create(agent_state.id, input="I'm refactoring auth")
response2 = client.agents.messages.create(agent_state.id, input="What was I working on?")
# Agent correctly recalls the refactoring context
```

Letta is **model-agnostic** — works with Opus, GPT-5, and open models. The memory persistence layer is independent of the LLM provider.

---

## 6. Vector Stores for Semantic Memory

When memories are unstructured (notes, observations, decisions), vector stores enable **semantic retrieval** — finding relevant past events even without exact keyword matches.

### Vector Memory Architecture

```python
import chromadb
from sentence_transformers import SentenceTransformer

class AgentSemanticMemory:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
        self.client = chromadb.PersistentClient(path=f"./memory/{agent_id}")
        self.collection = self.client.get_or_create_collection("memories")
    
    def remember(self, content: str, metadata: dict = None):
        """Store a memory with semantic embedding"""
        embedding = self.encoder.encode(content).tolist()
        memory_id = f"mem_{int(time.time())}_{hash(content) % 10000}"
        self.collection.add(
            embeddings=[embedding],
            documents=[content],
            metadatas=[{
                "timestamp": time.time(),
                "agent_id": self.agent_id,
                **(metadata or {})
            }],
            ids=[memory_id]
        )
    
    def recall(self, query: str, top_k: int = 5, recency_boost: bool = True) -> list[str]:
        """Retrieve semantically similar memories"""
        query_embedding = self.encoder.encode(query).tolist()
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k * 2 if recency_boost else top_k,
        )
        memories = list(zip(results["documents"][0], results["metadatas"][0]))
        
        if recency_boost:
            now = time.time()
            # Re-rank: blend semantic similarity with recency
            scored = []
            for i, (doc, meta) in enumerate(memories):
                semantic_score = 1.0 / (i + 1)  # rank-based
                age_days = (now - meta["timestamp"]) / 86400
                recency_score = 1.0 / (1 + age_days)
                final_score = 0.7 * semantic_score + 0.3 * recency_score
                scored.append((final_score, doc))
            scored.sort(reverse=True)
            return [doc for _, doc in scored[:top_k]]
        
        return results["documents"][0][:top_k]
```

### SWE-agent Vector DB

SWE-agent uses a vector DB to retrieve:
- Tool outputs from prior turns
- Plan state snapshots
- Code snippets that were relevant earlier

The retrieval happens before each agent step: the harness embeds the current task description and retrieves top-K relevant past context, injecting it into the prompt.

---

## 7. CrewAI Memory System

CrewAI 2025 introduced a **unified Memory class** with intelligent scope inference:

```python
from crewai import Memory

memory = Memory(
    recency_weight=0.4,    # How much to favor recent memories
    semantic_weight=0.4,   # How much to favor semantic similarity
    importance_weight=0.2, # How much to favor importance score
    recency_half_life_days=14,  # Decay constant for recency
)

# Store with automatic scope inference
memory.remember("We decided to use PostgreSQL for the user database.")
# LLM infers scope: /project/decisions or /engineering/database

# Explicit scope
memory.remember("Sprint velocity is 42 points", scope="/team/metrics")

# Recall with composite scoring
matches = memory.recall("What database did we choose?")
for m in matches:
    print(f"[score={m.score:.2f}] {m.record.content}")

# Hierarchical scope tree
print(memory.tree())
# / (15 records)
#   /project (8 records)
#     /project/alpha (5 records)
#   /agent (7 records)
#     /agent/researcher (4 records)
```

Scope inference works like a filesystem — memories are organized into hierarchical paths that grow organically from content. Agents can have **scoped views** (private subtrees) while the crew shares a global tree.

---

## 8. Episodic Memory Implementation

Episodic memory stores specific events with temporal context — the "what happened when" store.

```python
import json
from datetime import datetime
from pathlib import Path

class EpisodicMemory:
    """Append-only log of agent experiences"""
    
    def __init__(self, session_dir: Path):
        self.session_dir = session_dir
        self.log_file = session_dir / "episodes.jsonl"
        session_dir.mkdir(parents=True, exist_ok=True)
    
    def record(self, event_type: str, content: dict):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "session_id": self.session_id,
            **content
        }
        with self.log_file.open("a") as f:
            f.write(json.dumps(entry) + "\n")
    
    def get_episodes(self, event_types: list[str] = None, since: datetime = None) -> list:
        episodes = []
        with self.log_file.open() as f:
            for line in f:
                ep = json.loads(line)
                if event_types and ep["event_type"] not in event_types:
                    continue
                if since and ep["timestamp"] < since.isoformat():
                    continue
                episodes.append(ep)
        return episodes

# Usage
memory = EpisodicMemory(Path("./agent_history"))
memory.record("file_edited", {"path": "src/auth.py", "change_summary": "Fixed token expiry bug"})
memory.record("test_run", {"passed": 14, "failed": 2, "failures": ["test_login_expired"]})
memory.record("decision", {"decision": "Use bcrypt instead of sha256", "rationale": "Security audit finding"})
```

---

## 9. Cross-Session State: How Agents Maintain Continuity

### Devin (Cognition AI)

Devin maintains a persistent VM state across sessions:
- File system state persists (the repo stays checked out)
- Browser session state (cookies, auth tokens)
- Terminal history (previous commands)
- A dedicated scratchpad for notes

Each new session can resume by inspecting current file system state and the scratchpad. Devin doesn't need to reconstruct what happened — it can see what changed via `git log`.

### Claude Code

Claude Code uses:
- `CLAUDE.md` files (project + global) as persistent configuration memory
- Git history as the episodic record (what was built, when, by whom)
- MCP connections that persist across sessions (databases, external services)
- No native cross-session conversation memory (each session starts fresh)

The design philosophy: **files and git are the persistent memory**. The model reads `CLAUDE.md`, reads the recent git log, and reconstructs context from what's there.

### OpenCode / Letta Code

Letta Code explicitly addresses the cross-session memory gap with its tiered memory system. The agent has a `memory_blocks` structure that persists between calls:
- `human` block: persistent user profile
- `persona` block: agent's self-model
- Custom blocks: project state, preferences, ongoing tasks

---

## 10. External Memory Stores

### SQLite for Structured State

```python
import sqlite3
from dataclasses import dataclass

@dataclass
class AgentStateRecord:
    session_id: str
    task: str
    status: str
    files_modified: list[str]
    key_decisions: list[str]
    last_updated: float

class SQLiteAgentMemory:
    def __init__(self, db_path: str = "agent_memory.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._init_schema()
    
    def _init_schema(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                task TEXT,
                status TEXT,
                files_modified TEXT,  -- JSON array
                key_decisions TEXT,   -- JSON array
                last_updated REAL
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS tool_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                turn INTEGER,
                tool_name TEXT,
                input TEXT,
                output TEXT,
                timestamp REAL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        self.conn.commit()
```

Devika (an open-source Devin alternative) uses SQLite + embeddings this way, storing structured plans, execution logs, and web research results persistently.

### Redis for Fast Cross-Agent State

When multiple agents share state and need low-latency access:

```python
import redis
import json

class AgentSharedState:
    def __init__(self):
        self.redis = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    def publish_result(self, agent_id: str, task_id: str, result: dict):
        key = f"agent:{agent_id}:task:{task_id}"
        self.redis.setex(key, 3600, json.dumps(result))  # 1h TTL
        self.redis.publish(f"task_complete:{task_id}", agent_id)
    
    def wait_for_results(self, task_ids: list[str], timeout: int = 300) -> dict:
        pubsub = self.redis.pubsub()
        pubsub.subscribe(*[f"task_complete:{tid}" for tid in task_ids])
        results = {}
        for message in pubsub.listen():
            if message["type"] == "message":
                task_id = message["channel"].split(":")[1]
                # Retrieve the actual result
                results[task_id] = self._get_result(task_id)
        return results
```

---

## 11. Memory in Practice: Patterns Table

| Scenario | Memory Type | Storage | Retrieval |
|---------|------------|---------|----------|
| User preferences | Semantic | CLAUDE.md / memory files | File read at session start |
| Recent code decisions | Episodic | git log / JSONL | Summarize last N commits |
| Project architecture | Semantic | CLAUDE.md sections | Load on demand |
| Test failure history | Episodic | SQLite / JSONL | Query by test name |
| Past bug patterns | Semantic | Vector store | Embed bug description, k-NN search |
| Active task state | Working | Context window | Direct (it's there) |
| Long-term user notes | Episodic + Semantic | Hybrid (files + vector) | Semantic search over files |

---

## Sources

- Anthropic: Memory tool — https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- Anthropic Engineering: Effective Context Engineering — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Letta (MemGPT) GitHub — https://github.com/letta-ai/letta
- CrewAI Memory docs — https://docs.crewai.com/concepts/memory
- Introl: Claude Code CLI Reference — https://introl.com/blog/claude-code-cli-comprehensive-guide-2025
- arXiv: AI Agentic Programming Survey (2508.11126) — https://arxiv.org/html/2508.11126v1
- MIT Missing Semester: Agentic Coding — https://missing.csail.mit.edu/2026/agentic-coding/
