# AI Agent Cost Optimization: Token Efficiency, Caching, and Model Routing

> **Research Date:** March 2026  
> **Focus:** Strategies to reduce token costs, latency, and API spend in production AI agent systems

---

## Overview

Running a single LLM query is cheap. Running an AI agent that spawns sub-tasks, re-checks its reasoning, and makes dozens of model calls? Costs compound quickly. A 10-step agent workflow on GPT-4o at average 2,000 tokens/step costs ~$0.10–0.30 per run — multiply that by thousands of daily users and you're looking at $3,000–9,000/month for a single feature.

Cost optimization for AI agents is therefore not premature optimization — it's fundamental architecture. The good news: 2025 brought multiple mature strategies to dramatically reduce costs without sacrificing quality:

1. **Prompt caching** — 50–90% savings on repeated prefixes
2. **Model routing** — use smaller/cheaper models for simple sub-tasks
3. **Semantic caching** — eliminate identical/near-identical LLM calls entirely
4. **Context compression** — reduce token bloat in long conversation chains
5. **Batch processing** — aggregate requests for volume discounts
6. **Output structure optimization** — reduce verbose outputs from agents

---

## Part 1: Model Pricing Landscape (2025–2026)

Understanding model tier pricing is the first step in cost optimization.

### Frontier Models (Tier 1)
| Model | Input ($/1M tokens) | Output ($/1M tokens) | Best for |
|-------|--------------------|--------------------|----------|
| GPT-4o | $2.50 | $10.00 | Complex reasoning, final outputs |
| Claude Opus 4 | $15.00 | $75.00 | Extended reasoning, nuanced tasks |
| Claude Sonnet 4 | $3.00 | $15.00 | Balanced quality/cost |
| Gemini 2.5 Pro | $2.50 | $15.00 | Long context, multimodal |
| o3 | $2.50 | $10.00 | Math, code, multi-step reasoning |

### Mid-Range Models (Tier 2)
| Model | Input ($/1M tokens) | Output ($/1M tokens) | Best for |
|-------|--------------------|--------------------|----------|
| GPT-4o-mini | $0.15 | $0.60 | Structured extraction, classification |
| Claude Haiku 3.5 | $0.80 | $4.00 | Fast responses, simple tasks |
| Gemini Flash 2.5 | $0.075 | $0.30 | High-volume, low-complexity |
| GPT-4.1-nano | $0.05 | $0.40 | Ultra-cheap processing |

### Cost Multiplier Reference
- GPT-4o is **~17x** more expensive per input token than GPT-4o-mini
- Claude Opus is **~5x** more expensive than Claude Sonnet
- Using the right tier for each task can cut costs by **60–80%**

---

## Part 2: Prompt Caching

### What Is Prompt Caching?

Every LLM inference processes input tokens through the attention mechanism, computing key-value (KV) pairs. When many requests share the same prefix (system prompt, documents, examples), these computations repeat unnecessarily. Prompt caching stores the computed KV state so subsequent requests skip that computation.

### Provider Implementations

#### Anthropic Claude — Prefix Caching
- **Cache writes**: 25% premium over base input price
- **Cache reads**: 90% discount (10% of base price — $0.30/M vs $3.00/M)
- **Minimum**: 1,024 tokens per cache checkpoint
- **Up to 4** cache checkpoints per request
- **Cache lifetime**: 5 minutes (extended to 1 hour with regular hits)
- **Break-even**: Just 2 cache hits per cached prefix

```python
import anthropic

client = anthropic.Anthropic()

# Mark long static content for caching
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": """You are an expert assistant for our enterprise software platform.
            
            # Product Documentation (10,000 tokens of static content)
            ## User Management
            Users can be created via API or UI. Each user requires...
            [... extensive documentation ...]
            """,
            "cache_control": {"type": "ephemeral"}  # Mark for caching
        }
    ],
    messages=[{"role": "user", "content": "How do I reset a user's password?"}]
)

# Monitor cache performance
print(f"Cache creation tokens: {response.usage.cache_creation_input_tokens}")
print(f"Cache read tokens: {response.usage.cache_read_input_tokens}")
print(f"Regular input tokens: {response.usage.input_tokens}")
```

#### OpenAI — Automatic Caching
- **Cached tokens**: 50% of base input price (automatic, no code changes)
- **Minimum**: 1,024 tokens for eligibility
- **Cache hits**: Occur in 128-token increments
- **Cache lifetime**: 5–10 minutes of inactivity
- Works across all models (GPT-4o, GPT-4o-mini, o-series)

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Long system prompt (1024+ tokens)..."},
        {"role": "user", "content": "User question here"}
    ]
)

# Check cache utilization
cached = response.usage.prompt_tokens_details.cached_tokens
total = response.usage.prompt_tokens
print(f"Cache hit rate: {cached/total*100:.1f}%")
print(f"Savings: ${cached * 0.00000125:.6f}")  # 50% of $2.50/1M
```

#### Google Gemini — Explicit Context Caching
- Variable pricing based on context size + storage fees
- Explicit cache creation with configurable TTL
- Cross-request cache sharing

```python
from google.generativeai import caching
import datetime

# Create a cached content object
cache = caching.CachedContent.create(
    model='models/gemini-1.5-pro-001',
    display_name='product-docs-cache',
    system_instruction="You are an enterprise product expert...",
    contents=[large_product_documentation],
    ttl=datetime.timedelta(hours=2)
)

# Use cached content in all subsequent requests
model = genai.GenerativeModel.from_cached_content(cached_content=cache)
response = model.generate_content("What are the API rate limits?")
```

### Prompt Structure Best Practices for Cache Hits

```
OPTIMAL STRUCTURE FOR CACHING:
┌─────────────────────────────────────┐
│ System Prompt (static, cached)      │ ← cache_control: ephemeral
│ - Role definition                   │
│ - Company knowledge base            │
│ - Tool definitions                  │
│ - Few-shot examples                 │
├─────────────────────────────────────┤
│ Conversation history (semi-static)  │ ← can also cache
│ - Previous exchanges                │
├─────────────────────────────────────┤
│ Current user message (dynamic)      │ ← NOT cached
│ - New query                         │
└─────────────────────────────────────┘
```

**Key rules:**
1. Place static content **first** — caching is prefix-based
2. Keep dynamic content (user input, timestamps) at the **end**
3. Avoid embedding timestamps or request IDs in system prompts
4. Standardize system prompt wording to maximize cache hits

### Cache ROI Calculator

For a system processing 10,000 requests/day with a 5,000-token system prompt on Claude Sonnet:

```
Without caching:
  10,000 × 5,000 tokens × $3.00/1M = $150/day

With caching (80% hit rate):
  Cache writes: 10,000 × 20% × 5,000 × $3.75/1M = $37.50/day
  Cache reads:  10,000 × 80% × 5,000 × $0.30/1M = $12.00/day
  Total: $49.50/day
  
Savings: $100.50/day = $36,682/year
```

---

## Part 3: Semantic Caching

Semantic caching goes beyond prefix caching — it stores the **output** of LLM calls and returns cached responses for **semantically similar** inputs, skipping the LLM entirely.

### Architecture

```
User Query → Semantic Cache Check
                     │
              ┌──────┴──────┐
              │ Cache Hit?  │
         Yes ←┤             ├→ No
              └─────────────┘
         │                        │
    Return cached            LLM Inference
    response (ms)            (seconds)
                                  │
                            Store in cache
                            for future hits
```

### Implementation with GPTCache

```python
from gptcache import cache
from gptcache.adapter import openai
from gptcache.embedding import Onnx
from gptcache.manager import CacheBase, VectorBase, get_data_manager
from gptcache.similarity_evaluation.distance import SearchDistanceEvaluation

# Initialize embedding model for semantic similarity
onnx = Onnx()

# Set up vector store for cache
data_manager = get_data_manager(
    CacheBase("sqlite"),
    VectorBase("faiss", dimension=onnx.dimension)
)

# Initialize cache
cache.init(
    embedding_func=onnx.to_embeddings,
    data_manager=data_manager,
    similarity_evaluation=SearchDistanceEvaluation(),
)

# Drop-in replacement for OpenAI client
response = openai.ChatCompletion.create(
    model='gpt-4o',
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    # Cache hit if semantically similar question was asked before
)
```

### Semantic Cache with Redis + Embeddings

```python
import redis
import numpy as np
from openai import OpenAI

client = OpenAI()
r = redis.Redis()

def embed(text: str) -> list[float]:
    resp = client.embeddings.create(model="text-embedding-3-small", input=text)
    return resp.data[0].embedding

def semantic_cache_lookup(query: str, threshold: float = 0.95):
    query_vec = np.array(embed(query))
    
    # Search cached queries
    for key in r.scan_iter("cache:*"):
        cached_data = r.hgetall(key)
        cached_vec = np.frombuffer(cached_data[b"embedding"], dtype=np.float32)
        
        # Cosine similarity
        similarity = np.dot(query_vec, cached_vec) / (
            np.linalg.norm(query_vec) * np.linalg.norm(cached_vec)
        )
        
        if similarity > threshold:
            return cached_data[b"response"].decode()
    
    return None

def cached_llm_call(query: str) -> str:
    # Check cache first
    cached = semantic_cache_lookup(query)
    if cached:
        return f"[CACHED] {cached}"
    
    # Make LLM call
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": query}]
    )
    result = response.choices[0].message.content
    
    # Store in cache
    query_vec = np.array(embed(query), dtype=np.float32)
    r.hset(f"cache:{hash(query)}", mapping={
        "query": query,
        "response": result,
        "embedding": query_vec.tobytes()
    })
    r.expire(f"cache:{hash(query)}", 86400)  # 24h TTL
    
    return result
```

### When to Use Semantic Caching
- **FAQ-style agents**: Support bots with repeating question patterns
- **RAG pipelines**: Same documents queried repeatedly
- **Code assistants**: Common code patterns/questions
- **Analytics agents**: Similar data queries
- **NOT for**: Personalized responses, time-sensitive data, unique creative tasks

---

## Part 4: Multi-Model Routing

The single most impactful cost optimization is routing each task to the cheapest model that can handle it adequately.

### Task Classification Framework

```
Task → Complexity Assessment → Model Selection
  │
  ├── Reasoning Complexity:
  │     HIGH: Multi-step, judgment, synthesis → Tier 1 (GPT-4o, Claude Sonnet)
  │     MED:  Summarization, structured Q&A   → Tier 2 (GPT-4o-mini, Haiku)
  │     LOW:  Classification, extraction      → Tier 2/3 (Haiku, Flash)
  │
  ├── Output Quality Sensitivity:
  │     HIGH: Customer-facing, critical decisions → Tier 1
  │     MED:  Internal, reviewed outputs         → Tier 2
  │     LOW:  Routing signals, metadata          → Tier 3
  │
  └── Context Length:
        LONG + COMPLEX:  Tier 1 with caching
        LONG + SIMPLE:   Chunk and use Tier 2/3
        SHORT:           Always Tier 2/3 unless high quality needed
```

### Routing Decision Table

| Task Type | Reasoning | Quality Sensitivity | Recommended Model |
|-----------|-----------|--------------------|--------------------|
| Orchestrator planning | High | High | GPT-4o / Claude Sonnet |
| Intent classification | Low | Medium | GPT-4o-mini / Haiku |
| RAG answer generation | Medium | Medium-High | GPT-4o-mini |
| Final report drafting | High | High | GPT-4o / Claude Sonnet |
| Field extraction (JSON) | Low | Medium | Haiku / Gemini Flash |
| Code review | High | High | GPT-4o / o3 |
| Tone/style check | Low-Med | Medium | GPT-4o-mini |
| Data formatting | Low | Low | Haiku / Flash |
| Binary classification | Low | Low | Fine-tuned small model |

### Router Implementation

```python
from enum import Enum
from dataclasses import dataclass
from openai import OpenAI
import anthropic

class TaskComplexity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class RoutingConfig:
    model: str
    provider: str
    max_tokens: int = 1024
    
# Model routing table
ROUTING_TABLE = {
    (TaskComplexity.LOW, False): RoutingConfig("claude-haiku-3-5", "anthropic", 512),
    (TaskComplexity.LOW, True): RoutingConfig("gpt-4o-mini", "openai", 512),
    (TaskComplexity.MEDIUM, False): RoutingConfig("gpt-4o-mini", "openai", 2048),
    (TaskComplexity.MEDIUM, True): RoutingConfig("gpt-4o-mini", "openai", 2048),
    (TaskComplexity.HIGH, False): RoutingConfig("claude-sonnet-4-6", "anthropic", 4096),
    (TaskComplexity.HIGH, True): RoutingConfig("gpt-4o", "openai", 4096),  # True = needs strict JSON
}

def classify_task(task_description: str) -> TaskComplexity:
    """Use a cheap model to classify the complexity of the task."""
    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""Classify this AI task complexity as LOW, MEDIUM, or HIGH.
            LOW: extraction, classification, formatting, simple lookup
            MEDIUM: summarization, Q&A, code editing, standard writing
            HIGH: complex reasoning, synthesis, creative, multi-step planning
            
            Task: {task_description}
            
            Respond with only: LOW, MEDIUM, or HIGH"""
        }],
        max_tokens=10
    )
    level = resp.choices[0].message.content.strip().upper()
    return TaskComplexity(level.lower())

def route_and_execute(task: str, requires_json: bool = False) -> str:
    complexity = classify_task(task)
    config = ROUTING_TABLE[(complexity, requires_json)]
    
    print(f"Routing to {config.model} (complexity: {complexity.value})")
    
    if config.provider == "anthropic":
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model=config.model,
            max_tokens=config.max_tokens,
            messages=[{"role": "user", "content": task}]
        )
        return resp.content[0].text
    else:
        client = OpenAI()
        resp = client.chat.completions.create(
            model=config.model,
            messages=[{"role": "user", "content": task}],
            max_tokens=config.max_tokens
        )
        return resp.choices[0].message.content
```

---

## Part 5: Context Window Optimization

In multi-turn agent workflows, context grows with each step — and so does cost.

### Context Compression Techniques

#### 1. Conversation Summarization
```python
def compress_conversation(history: list[dict], keep_last_n: int = 3) -> list[dict]:
    """Compress old conversation turns into a summary."""
    if len(history) <= keep_last_n * 2:
        return history
    
    to_compress = history[:-keep_last_n * 2]
    recent = history[-keep_last_n * 2:]
    
    # Cheap model to summarize old turns
    client = OpenAI()
    summary_resp = client.chat.completions.create(
        model="gpt-4o-mini",  # Cheap model for this
        messages=[{
            "role": "user",
            "content": f"Summarize this conversation history in 2-3 sentences:\n{to_compress}"
        }]
    )
    
    summary = summary_resp.choices[0].message.content
    
    return [
        {"role": "system", "content": f"[Conversation summary: {summary}]"},
        *recent
    ]
```

#### 2. Dynamic System Prompt Selection
```python
def build_minimal_system_prompt(task_type: str, relevant_docs: list[str]) -> str:
    """Build a targeted system prompt — only include relevant context."""
    
    # Only inject relevant sections, not the entire knowledge base
    relevant_content = "\n".join(relevant_docs[:3])  # Max 3 docs
    
    base = "You are a helpful assistant."
    
    if task_type == "customer_support":
        base += "\n# Return Policy\n" + relevant_content
    elif task_type == "technical":
        base += "\n# Technical Documentation\n" + relevant_content
    
    return base  # 200 tokens vs 5000 tokens for full KB
```

#### 3. Token Budget Enforcement
```python
import tiktoken

def estimate_tokens(text: str, model: str = "gpt-4o") -> int:
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))

def enforce_token_budget(
    messages: list[dict],
    budget: int = 4000,
    model: str = "gpt-4o"
) -> list[dict]:
    """Trim messages to fit within budget."""
    total = sum(estimate_tokens(m["content"], model) for m in messages)
    
    while total > budget and len(messages) > 2:
        # Remove oldest non-system message
        for i, msg in enumerate(messages):
            if msg["role"] != "system":
                removed = messages.pop(i)
                total -= estimate_tokens(removed["content"], model)
                break
    
    return messages
```

---

## Part 6: Batch Processing

OpenAI and Anthropic both offer batch APIs for non-real-time workloads at 50% discount.

```python
# OpenAI Batch API — 50% cost reduction, 24h completion window
from openai import OpenAI
import json

client = OpenAI()

# Create batch file
requests = [
    {
        "custom_id": f"task-{i}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": f"Classify this review: {review}"}],
            "max_tokens": 50
        }
    }
    for i, review in enumerate(reviews_to_classify)
]

# Upload batch file
batch_file = client.files.create(
    file=("batch.jsonl", "\n".join(json.dumps(r) for r in requests).encode()),
    purpose="batch"
)

# Create batch job
batch = client.batches.create(
    input_file_id=batch_file.id,
    endpoint="/v1/chat/completions",
    completion_window="24h"
)

print(f"Batch ID: {batch.id}, Status: {batch.status}")
# Check later: client.batches.retrieve(batch.id)
```

---

## Part 7: Cost Benchmarks by Use Case

### Customer Support Agent (per 1,000 tickets)
| Strategy | Cost | Latency |
|----------|------|---------|
| All GPT-4o, no caching | $45.00 | 3–5s |
| Routed models, no caching | $12.00 | 2–4s |
| Routed + prompt caching | $4.50 | 1–2s |
| Routed + semantic caching | $2.00 | <0.5s |

### Code Review Agent (per 1,000 PRs)
| Strategy | Cost | Notes |
|----------|------|-------|
| Claude Opus only | $150.00 | Overkill for most steps |
| Claude Sonnet (planner) + Haiku (checks) | $35.00 | Balanced quality |
| Batched nightly runs | $17.50 | 50% batch discount |

### Document Q&A Agent (per 10,000 queries)
| Strategy | Cost |
|----------|------|
| No caching, Tier 1 models | $250 |
| Prompt caching (long docs) | $35 |
| Semantic cache + routing | $8 |

---

## Part 8: Self-Hosted Inference with vLLM

For teams with high-volume workloads, self-hosting open-source models eliminates per-token API costs.

```python
from vllm import LLM, SamplingParams

# Deploy with prefix caching enabled
llm = LLM(
    model="meta-llama/Llama-3.1-8B-Instruct",
    enable_prefix_caching=True,      # Automatic prefix caching
    gpu_memory_utilization=0.90,
    max_model_len=8192,
    tensor_parallel_size=1           # Increase for multi-GPU
)

sampling_params = SamplingParams(
    temperature=0.7,
    max_tokens=512
)

# Batch processing for efficiency
outputs = llm.generate(
    prompts=[
        "Classify this support ticket: 'My order hasn't arrived'",
        "Classify this support ticket: 'I was charged twice'",
        "Classify this support ticket: 'How do I cancel?'"
    ],
    sampling_params=sampling_params
)
```

**vLLM Economics:**
- A100 80GB GPU: ~$2–3/hour on cloud
- Can serve ~1M tokens/hour with Llama 3.1 8B
- Break-even vs. GPT-4o-mini at ~500K tokens/hour

---

## Part 9: Cost Monitoring and Alerting

```python
import time
from dataclasses import dataclass, field
from collections import defaultdict

@dataclass
class CostTracker:
    daily_budget_usd: float = 100.0
    costs: dict = field(default_factory=lambda: defaultdict(float))
    
    # Pricing per 1M tokens (input/output)
    MODEL_PRICES = {
        "gpt-4o": (2.50, 10.00),
        "gpt-4o-mini": (0.15, 0.60),
        "claude-sonnet-4-6": (3.00, 15.00),
        "claude-haiku-3-5": (0.80, 4.00),
    }
    
    def track(self, model: str, input_tokens: int, output_tokens: int) -> float:
        if model not in self.MODEL_PRICES:
            return 0.0
        
        in_price, out_price = self.MODEL_PRICES[model]
        cost = (input_tokens * in_price + output_tokens * out_price) / 1_000_000
        
        today = time.strftime("%Y-%m-%d")
        self.costs[today] += cost
        
        # Alert if approaching budget
        if self.costs[today] > self.daily_budget_usd * 0.8:
            print(f"⚠️  80% of daily budget used: ${self.costs[today]:.2f}")
        
        return cost
    
    def daily_summary(self) -> dict:
        today = time.strftime("%Y-%m-%d")
        return {
            "date": today,
            "total_cost": self.costs[today],
            "budget_remaining": self.daily_budget_usd - self.costs[today],
            "budget_utilization": self.costs[today] / self.daily_budget_usd
        }

tracker = CostTracker(daily_budget_usd=50.0)
```

---

## Pros and Cons Summary

### Multi-Model Routing
✅ 60–80% cost reduction  
✅ Can maintain quality for each task type  
✅ Flexible, easy to tune  
❌ Adds orchestration complexity  
❌ Requires ongoing task profiling  
❌ Multiple providers = multiple API keys, contracts  

### Prompt Caching
✅ 50–90% savings on repeated prompts  
✅ Reduces latency significantly  
✅ Automatic with OpenAI (no code changes)  
❌ Requires stable system prompts  
❌ Cache can expire, causing cache miss spikes  
❌ Doesn't help with unique/varied queries  

### Semantic Caching
✅ Eliminates LLM calls entirely on cache hits  
✅ Sub-millisecond response for cached queries  
✅ Scales to any model  
❌ Requires embedding infrastructure  
❌ Freshness issues for time-sensitive responses  
❌ Semantic similarity threshold tuning required  

---

## Official Resources

- **Anthropic Prompt Caching**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- **OpenAI Prompt Caching**: https://platform.openai.com/docs/guides/prompt-caching
- **Google Context Caching**: https://ai.google.dev/gemini-api/docs/caching
- **OpenAI Batch API**: https://platform.openai.com/docs/guides/batch
- **vLLM Prefix Caching**: https://docs.vllm.ai/en/latest/automatic_prefix_caching/apc.html
- **GPTCache**: https://github.com/zilliztech/GPTCache
- **Artificial Analysis (model benchmarks)**: https://artificialanalysis.ai
- **OpenRouter (model routing)**: https://openrouter.ai
- **LLM Pricing Tracker**: https://llm-price.com
