# Code Generation Models 2024–2025

> **Last Updated:** March 2026 | **Research Depth:** Comprehensive | **Sources:** Anthropic, OpenAI, Alibaba Qwen, DeepSeek, SWE-bench, ArXiv

---

## Overview

Code generation has become the most visible and commercially significant capability of modern LLMs. From GitHub Copilot with 1.8M+ paid users to Claude Code, Cursor, and Windsurf reshaping software development, the "code model" space evolved dramatically in 2024–2025.

Key trends:
- **Frontier models** (Claude, GPT-4o, Gemini) dominate agentic/autonomous coding tasks
- **Specialized open-source models** (Qwen2.5-Coder, DeepSeek Coder V2) match frontier models on classic benchmarks at far lower inference cost
- **SWE-bench** replaced HumanEval as the most meaningful real-world coding benchmark
- **Agentic harnesses** (Cursor, Windsurf, Copilot, Claude Code) are what developers actually use — the underlying model matters but the harness UX often matters more

---

## Benchmark Landscape

### Key Benchmarks Explained

| Benchmark | What It Measures | Notes |
|-----------|-----------------|-------|
| **HumanEval** | Python function generation from docstring | Classic, now considered too easy |
| **MBPP** | Mostly Basic Python Programming problems | Similar to HumanEval |
| **EvalPlus** | HumanEval+ with harder test cases | More rigorous than HumanEval |
| **LiveCodeBench** | Recent competitive programming (post-cutoff) | Tests generalization, not memorization |
| **SWE-bench Verified** | Real GitHub issues from OSS repos | Gold standard for agentic coding |
| **SWE-bench Pro** | Harder version with recent issues | Newer, frontier models score 20-57% |
| **BigCodeBench** | Function-level tasks with complex instructions | 1,140 diverse programming tasks |
| **CrossCodeEval** | Cross-file code completion | Tests repo-level understanding |
| **Aider Polyglot** | Real-world code editing benchmark | Multi-language edit tasks |

### The Saturation Problem
HumanEval was effectively "solved" — GPT-4 family models score 80-90%+, making it poor at discriminating between frontier models. The field has shifted to harder benchmarks:
- **SWE-bench** (GitHub issue resolution) — requires understanding real codebases
- **LiveCodeBench** — uses recent problems to prevent memorization
- **SWE-bench Pro** — released 2025, harder problems, frontier models score 20-57%

---

## Model Deep Dives

### Claude 3.5 / 3.7 Sonnet (Anthropic)

**What it is:** Anthropic's flagship model with exceptional coding capabilities, particularly for agentic code editing.

**Official URL:** https://www.anthropic.com/claude

**Key Stats:**
- SWE-bench Verified: **49%** (Claude 3.5 Sonnet, 2024)
- SWE-bench Verified: **70%+** (Claude 3.7 Sonnet with extended thinking, 2025)
- HumanEval: **92%**
- Agentic coding evaluation (internal): **64%** problem resolution
- Context window: **200K tokens** (ideal for large codebases)

**Architecture notes:**
- Extended thinking mode enables deeper reasoning before code generation
- Excels at multi-file changes and maintaining consistency across a codebase
- Very strong at test-driven development: write tests, then implement
- Computer use capability (controlling browsers/GUIs) extends coding to UI automation

**Code Example — Agentic Coding via API:**
```python
import anthropic

client = anthropic.Anthropic()

def code_with_claude(task: str, existing_code: str = "") -> str:
    """Use Claude for complex coding tasks"""
    
    system_prompt = """You are an expert software engineer.
    When asked to implement code:
    1. Analyze requirements carefully
    2. Write clean, well-documented code
    3. Include error handling
    4. Add type hints (Python) or TypeScript types
    5. Include brief inline comments for complex logic
    """
    
    messages = []
    if existing_code:
        messages.append({
            "role": "user",
            "content": f"Here is the existing code:\n```\n{existing_code}\n```\n\nTask: {task}"
        })
    else:
        messages.append({"role": "user", "content": task})
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=8096,
        system=system_prompt,
        messages=messages
    )
    
    return response.content[0].text

# Extended thinking for complex algorithms
def solve_complex_problem(problem: str) -> str:
    response = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=16000,
        thinking={"type": "enabled", "budget_tokens": 10000},
        messages=[{"role": "user", "content": problem}]
    )
    
    # Return just the code output, not the thinking
    for block in response.content:
        if block.type == "text":
            return block.text
```

**Strengths:**
- ✅ Best-in-class for agentic/autonomous coding (SWE-bench leader)
- ✅ Excellent at understanding large, complex codebases
- ✅ Extended thinking handles tricky algorithmic problems
- ✅ Follows instructions very precisely
- ✅ Strong multi-language support

**Weaknesses:**
- ❌ Higher cost than open-source alternatives
- ❌ Slower than GPT-4o-mini for simple completions
- ❌ API rate limits can bottleneck high-volume generation

---

### GPT-4o / GPT-4.1 (OpenAI)

**Official URL:** https://platform.openai.com/docs/models

**Key Stats:**
- HumanEval: **~90%** (GPT-4o)
- LiveCodeBench: **29.2%** (GPT-4o, below Qwen2.5-Coder-32B)
- SWE-bench Verified: **~46%** (GPT-4o)
- GPT-4.1: SWE-bench score improved ~50%+ over GPT-4o
- Context window: **128K tokens** (GPT-4o), **1M tokens** (GPT-4.1)

**GPT-4o Architecture Highlights:**
- Native multimodal (text, image, audio) — can read screenshots of code
- Faster and cheaper than GPT-4 Turbo
- Strong at code explanation and documentation
- o3/o4-mini reasoning models achieve SWE-bench ~74% (top-tier)

**Code Example:**
```python
from openai import OpenAI

client = OpenAI()

def generate_code_with_tests(requirements: str) -> dict:
    """Generate implementation + tests in one call"""
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a senior engineer. Always write tests alongside implementations."
            },
            {
                "role": "user",
                "content": f"Implement the following with full test coverage:\n{requirements}"
            }
        ],
        temperature=0.1,  # Low temperature for code
        max_tokens=4096,
        response_format={"type": "text"}  # Or json_object for structured output
    )
    
    return {
        "code": response.choices[0].message.content,
        "tokens_used": response.usage.total_tokens,
        "cost_estimate": response.usage.total_tokens / 1_000_000 * 5.0  # Rough estimate
    }

# For complex reasoning tasks, use o3/o4-mini
def solve_algorithmic_problem(problem: str) -> str:
    response = client.chat.completions.create(
        model="o4-mini",
        messages=[
            {"role": "user", "content": f"Solve this programming problem: {problem}"}
        ],
        reasoning_effort="high"  # "low", "medium", "high"
    )
    return response.choices[0].message.content
```

**Strengths:**
- ✅ Excellent ecosystem (OpenAI API, function calling, structured outputs)
- ✅ o3/o4-mini reasoning models top competitive programming benchmarks
- ✅ Multimodal: can process UI screenshots, diagrams
- ✅ 1M context in GPT-4.1 handles massive codebases
- ✅ Strong plugin/extension ecosystem

**Weaknesses:**
- ❌ GPT-4o specifically weaker than Claude on SWE-bench agentic tasks
- ❌ Can be verbose / over-explain
- ❌ Price premium vs open-source alternatives

---

### DeepSeek Coder V2 / DeepSeek V3

**Official URL:** https://deepseekcoder.github.io  
**GitHub:** https://github.com/deepseek-ai/DeepSeek-Coder-V2

**The DeepSeek Story:**
DeepSeek's model family became a major talking point in 2024-2025 for matching/exceeding frontier model performance at dramatically lower inference cost. DeepSeek V3 launched Dec 2024 trained for only ~$6M vs hundreds of millions for comparable frontier models.

**Key Stats — DeepSeek V3:**
- HumanEval: **82.6%** (outperforms GPT-4o, Claude 3.5)
- LiveCodeBench: **~40%** (strong performer)
- SWE-bench: Competitive with frontier models
- Parameters: 685B total, 37B active (MoE architecture)
- Training cost: ~$5.6M (vs $100M+ for GPT-4 class models)
- **Free API** available at certain usage tiers

**Key Stats — DeepSeek Coder V2:**
- HumanEval: **90.2%**
- Outperformed GPT-4 Turbo, Claude 3 Opus, Gemini 1.5 Pro at launch
- Available as 16B and 236B variants

**Architecture (MoE — Mixture of Experts):**
```
DeepSeek V3 Architecture:
- Total parameters: 685B
- Active parameters per token: 37B (only 37B activated per forward pass)
- MoE layers: Each token routes to a subset of "expert" FFN layers
- Multi-head Latent Attention (MLA): Reduces KV-cache memory
- Result: Near-frontier quality at 1/10th the inference cost

Benefits:
├── Cheaper inference (37B compute despite 685B params)
├── Can run on fewer GPUs than similarly-capable dense models
└── Open weights: can be self-hosted
```

**Code Example (via OpenAI-compatible API):**
```python
from openai import OpenAI

# DeepSeek uses OpenAI-compatible API
client = OpenAI(
    api_key="your-deepseek-api-key",
    base_url="https://api.deepseek.com"
)

def generate_with_deepseek(task: str, language: str = "python") -> str:
    response = client.chat.completions.create(
        model="deepseek-coder",  # or "deepseek-chat" for V3
        messages=[
            {
                "role": "system",
                "content": f"You are an expert {language} developer. Write clean, efficient code."
            },
            {"role": "user", "content": task}
        ],
        temperature=0.0,
        max_tokens=4096
    )
    return response.choices[0].message.content

# Self-hosted via Ollama (local inference)
local_client = OpenAI(
    api_key="ollama",
    base_url="http://localhost:11434/v1"
)

local_response = local_client.chat.completions.create(
    model="deepseek-coder-v2:16b",
    messages=[{"role": "user", "content": "Write a binary search tree in Python"}]
)
```

**Strengths:**
- ✅ Best performance per dollar among open-weight models
- ✅ Truly open weights (can self-host)
- ✅ Strong MoE architecture enables efficient inference
- ✅ Free/cheap API tiers
- ✅ 128K context window

**Weaknesses:**
- ❌ Chinese company — data privacy / geopolitical concerns for some enterprises
- ❌ Self-hosting requires significant GPU resources for full 685B model
- ❌ Slightly behind Claude/GPT on SWE-bench agentic tasks
- ❌ API reliability has had occasional issues

---

### Qwen2.5-Coder (Alibaba)

**Official URL:** https://qwenlm.github.io/blog/qwen2.5-coder-family/  
**HuggingFace:** https://huggingface.co/Qwen

**The Qwen2.5-Coder Story:**
Qwen2.5-Coder-32B, released November 2024, became the leading open-source coding model at its size class — beating GPT-4o on several benchmarks.

**Key Stats — Qwen2.5-Coder-32B-Instruct:**
- LiveCodeBench: **37.2%** (vs GPT-4o 29.2%, Claude 3.5 Sonnet 32.1%)
- HumanEval: **92.7%**
- EvalPlus (HumanEval+): **90.2%**
- BigCodeBench: State-of-the-art at release
- Training data: **5.5 trillion tokens** of code data
- Context window: **128K tokens**
- Languages supported: **92 programming languages**
- Model sizes: 0.5B, 1.5B, 3B, 7B, 14B, 32B (dense) + 72B (MoE)

**Architecture Highlights:**
```
Qwen2.5-Coder Training Pipeline:
1. Base pretraining on 5.5T code tokens
2. Multi-stage data filtering (quality scoring)
3. Instruction fine-tuning
4. Alignment via DPO/RLHF

Data composition:
├── Source code (GitHub, GitLab, etc.) — primary
├── Code-related text (Stack Overflow, docs)
├── Synthetic code + problems
└── Math reasoning data (aids algorithmic coding)

Key capabilities:
├── Code generation & completion
├── Code repair / bug fixing
├── Code explanation
├── Infilling (FIM - Fill In the Middle)
└── Repository-level understanding
```

**Code Example (self-hosted via Transformers):**
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_name = "Qwen/Qwen2.5-Coder-32B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

def generate_code(prompt: str, max_new_tokens: int = 2048) -> str:
    messages = [
        {"role": "system", "content": "You are Qwen, an expert coding assistant."},
        {"role": "user", "content": prompt}
    ]
    
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        generated_ids = model.generate(
            **model_inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.1,
            do_sample=True,
        )
    
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]):]
    return tokenizer.decode(output_ids, skip_special_tokens=True)

# FIM (Fill In the Middle) for code completion
def complete_code(prefix: str, suffix: str) -> str:
    prompt = f"<fim_prefix>{prefix}<fim_suffix>{suffix}<fim_middle>"
    # ... generate
```

**Via API (OpenRouter or together.ai):**
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="your-openrouter-key"
)

response = client.chat.completions.create(
    model="qwen/qwen-2.5-coder-32b-instruct",
    messages=[{"role": "user", "content": "Implement merge sort in Rust"}],
    temperature=0.0
)
print(response.choices[0].message.content)
```

**Strengths:**
- ✅ Best open-source model for code completion (at 32B class)
- ✅ Outperforms GPT-4o on LiveCodeBench
- ✅ 92 language support with strong multilingual coding
- ✅ Multiple sizes (0.5B–72B) for different deployment scenarios
- ✅ Fully open weights, HuggingFace available
- ✅ Excellent FIM (infill) performance for IDE integration

**Weaknesses:**
- ❌ 32B requires significant GPU (2× A100 or 4× A6000 for full precision)
- ❌ Behind Claude/GPT on SWE-bench agentic tasks
- ❌ Chinese company (Alibaba) — similar enterprise concerns as DeepSeek

---

### Codestral (Mistral AI)

**Official URL:** https://mistral.ai/news/codestral  
**API:** https://codestral.mistral.ai

**Key Stats:**
- 22B parameter dedicated code model
- Supports 80+ programming languages
- 32K context window
- Specialized training data focus on code
- Available via API and self-hosted

**Strengths:**
- ✅ European model — GDPR-friendly
- ✅ Very fast inference (22B is efficient)
- ✅ Strong for enterprise/on-prem deployment
- ✅ Good fill-in-the-middle performance

---

### Gemini 2.5 Pro (Google)

**Official URL:** https://deepmind.google/technologies/gemini/

**Key Stats (2025):**
- LiveCodeBench Elo: **2,439** (Grandmaster-tier)
- SWE-bench: Strong performer in agentic setting
- Context window: **1M tokens** (2M in some configurations)
- Native multimodal: code + images + video

**Notable:**
- Best model for algorithm/competitive programming (Codeforces grandmaster-level)
- 1M context enables full-codebase analysis
- Strong for code that requires understanding of images (UI implementation from screenshots)

---

## Benchmark Comparison Table

| Model | HumanEval | LiveCodeBench | SWE-bench Verified | Context | Open Source |
|-------|-----------|---------------|-------------------|---------|-------------|
| **Claude Opus 4.5** | ~92% | High | **80.9%** | 200K | ❌ |
| **Claude 3.7 Sonnet** | ~92% | ~40% | ~70% | 200K | ❌ |
| **GPT-5 (high reasoning)** | ~95% | ~45% | **88%** | 1M | ❌ |
| **o3-pro** | ~95% | ~44% | **84.9%** | 128K | ❌ |
| **Gemini 2.5 Pro** | ~90% | 37%+ | ~75% | 1M | ❌ |
| **Claude 3.5 Sonnet** | 92% | 32.1% | 49% | 200K | ❌ |
| **GPT-4o** | ~90% | 29.2% | ~46% | 128K | ❌ |
| **DeepSeek V3** | 82.6% | ~40% | ~50% | 128K | ✅ |
| **Qwen2.5-Coder-32B** | 92.7% | **37.2%** | ~40% | 128K | ✅ |
| **DeepSeek Coder V2** | 90.2% | 35.4% | ~38% | 128K | ✅ |
| **Codestral 22B** | ~81% | ~28% | ~30% | 32K | ✅* |

*Codestral has commercial license restrictions

---

## Coding Harnesses & Which Models Power Them

### The Harness vs. Model Distinction

A critical insight for practitioners: **the harness (IDE/tool) often matters as much as the underlying model.** The same model (e.g., Claude 3.5 Sonnet) can produce radically different results in Cursor vs. a raw API call, because harnesses add:
- Repo-level context management
- File change diffing and application
- Tool use loops (lint, test, debug)
- Multi-step planning
- Undo/redo awareness

### Cursor

**URL:** https://cursor.com  
**Models available:** Claude 3.5/3.7 Sonnet, Claude Opus, GPT-4o, GPT-4.1, o3, o4-mini, Gemini 2.5 Pro

- Default model: **Claude 3.7 Sonnet** (most popular choice)
- Agent mode: Multi-step autonomous editing, runs lint/tests
- Tab completion: Uses smaller/faster models for inline suggestions
- `@codebase` context: Embeds and retrieves relevant code from entire repo
- **Cursor Premium** required for full model access ($20/mo)

### GitHub Copilot

**URL:** https://github.com/features/copilot  
**Models available:** GPT-4o, GPT-4.1, o3, o3-mini, o4-mini, Claude 3.5/3.7 Sonnet, Gemini 2.0 Flash/2.5 Pro

- Available inside VS Code, JetBrains, Vim, CLI
- **Copilot Chat:** Multi-model selection for Q&A, refactoring
- **Copilot Workspace:** Agentic task completion (issue → PR)
- **Copilot Edits:** Multi-file editing similar to Cursor
- Integration with GitHub Actions for CI/CD assistance

### Claude Code (Anthropic)

**URL:** https://claude.ai/code  
**Model:** Claude 3.5/3.7 Sonnet (+ Haiku for cheaper sub-tasks)

- Terminal-based agentic coding
- Designed for long-horizon autonomous tasks
- `--permission-mode bypassPermissions` for fully autonomous mode
- Full filesystem and shell access
- Built on LangGraph-style agent loop
- Best for: complex multi-file refactors, bug hunting, PR reviews

### Windsurf (Codeium)

**URL:** https://windsurf.ai  
**Models:** Windsurf SWE-1, Claude, GPT-4o

- **Cascade** feature: autonomous, multi-step agent
- Proprietary SWE-1 model optimized for code editing
- Strong "flow" UX — agent explains reasoning as it works
- Good for mid-tier devs who want guidance + automation

### Replit Agent

**URL:** https://replit.com  
**Model:** Claude (with Replit fine-tuning)

- Cloud-native: code + deploy in one step
- Agent 4 autonomously builds, runs, and deploys apps
- Excellent for prototyping and full-stack one-click deployment
- Less suited for complex existing codebases

---

## Cost Comparison (API, per 1M tokens)

| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| Claude 3.5 Sonnet | $3.00 | $15.00 | Most popular for agentic tasks |
| Claude 3.5 Haiku | $0.80 | $4.00 | Fast, cheap sub-agent tasks |
| GPT-4o | $2.50 | $10.00 | Good balance |
| GPT-4o-mini | $0.15 | $0.60 | Cheap for simple completions |
| o3-mini | $1.10 | $4.40 | Strong reasoning, moderate cost |
| DeepSeek V3 | $0.27 | $1.10 | Exceptional value |
| Qwen2.5-Coder-32B | ~$0.20 | ~$0.60 | Via OpenRouter/Together |
| Gemini 2.5 Pro | $1.25 | $10.00 | 1M context included |

---

## Choosing the Right Model

### Decision Framework

```
What is your primary use case?

1. AUTONOMOUS AGENT TASKS (multi-step, codebase changes)
   └── SWE-bench performance matters most
   └── Best: Claude Opus 4.5 > GPT-5 > Gemini 2.5 Pro > Claude 3.7 Sonnet

2. INLINE COMPLETIONS (fast, frequent, cost-sensitive)
   └── Latency and cost matter most
   └── Best: GPT-4o-mini, Claude Haiku, Qwen2.5-Coder-7B (self-hosted)

3. COMPETITIVE PROGRAMMING / ALGORITHMS
   └── Reasoning quality matters most
   └── Best: o3, o4-mini, Gemini 2.5 Pro (Grandmaster-level)

4. OPEN SOURCE / SELF-HOSTED (privacy, cost)
   └── Need to run locally or on-prem
   └── Best: Qwen2.5-Coder-32B, DeepSeek Coder V2, Codestral 22B

5. MULTILINGUAL (code in 50+ languages)
   └── Language breadth matters
   └── Best: Qwen2.5-Coder-32B (92 langs), Claude 3.5 Sonnet, GPT-4o

6. LARGE CODEBASE CONTEXT (>100K tokens of code)
   └── Long context window essential
   └── Best: Gemini 2.5 Pro (1M), Claude 3.5 Sonnet (200K), GPT-4.1 (1M)
```

---

## Code Examples Across Models

### Implementing a Complex Algorithm (Comparative)

**Prompt:** "Implement a concurrent rate limiter in Python that supports multiple users with different rate limits, using Redis as the backend"

**With Claude (structured, documented):**
```python
# Example of Claude's output style
import asyncio
import time
import redis.asyncio as aioredis
from dataclasses import dataclass
from typing import Optional

@dataclass
class RateLimitConfig:
    """Configuration for a user's rate limit"""
    requests_per_window: int
    window_seconds: int

class RedisRateLimiter:
    """
    Sliding window rate limiter using Redis.
    Thread-safe and suitable for distributed systems.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = aioredis.from_url(redis_url)
    
    async def is_allowed(
        self,
        user_id: str,
        config: RateLimitConfig
    ) -> tuple[bool, int]:
        """
        Check if request is within rate limit.
        
        Returns:
            (allowed, remaining_requests)
        """
        now = time.time()
        window_start = now - config.window_seconds
        key = f"ratelimit:{user_id}"
        
        async with self.redis.pipeline() as pipe:
            # Remove old entries outside window
            await pipe.zremrangebyscore(key, 0, window_start)
            # Count current requests
            await pipe.zcard(key)
            # Add current request
            await pipe.zadd(key, {str(now): now})
            # Set TTL
            await pipe.expire(key, config.window_seconds)
            results = await pipe.execute()
        
        current_count = results[1]
        
        if current_count >= config.requests_per_window:
            return False, 0
        
        remaining = config.requests_per_window - current_count - 1
        return True, remaining
```

**With GPT-4o (similar quality, slightly more verbose explanations):**
The output structure is similar but GPT-4o tends to add more inline comments and sometimes suggest additional methods the user didn't ask for.

**With DeepSeek V3 (concise, efficient):**
DeepSeek V3 tends to produce clean, correct code with slightly less prose but often similar or better algorithmic choices.

**With Qwen2.5-Coder-32B (open-source quality):**
Very close to frontier model quality for this type of task — the gap appears most on SWE-bench style tasks requiring understanding of existing codebases.

---

## Emerging Trends (2025–2026)

### 1. Reasoning Models for Code
OpenAI's o3/o4-mini and Anthropic's extended thinking represent a shift: **slow, careful reasoning** before generating code beats "fast code generation" for complex tasks. The trade-off is latency and cost.

### 2. Models Trained on Agent Trajectories
Next-gen code models are being trained not just on static code, but on recorded agent trajectories — sequences of (thought, tool call, observation) that demonstrate how to successfully complete SWE-bench-style tasks.

### 3. Context Window Arms Race
Gemini 2.5 Pro (1M tokens), GPT-4.1 (1M), Claude (200K) — models that can load an entire codebase into context without retrieval are changing the architecture of code assistants.

### 4. Specialized Fine-Tunes
Beyond base models, specialized fine-tunes are emerging:
- **Devstral** (Mistral, fine-tuned for agentic coding)
- **SWE-1** (Windsurf's proprietary model)
- Domain-specific models for languages like Rust, Solidity, SQL

---

## Official Resources

- **Claude for code:** https://www.anthropic.com/claude | Model card: https://www.anthropic.com/claude/model-spec
- **OpenAI code models:** https://platform.openai.com/docs/models
- **DeepSeek Coder:** https://deepseekcoder.github.io | GitHub: https://github.com/deepseek-ai/DeepSeek-Coder-V2
- **Qwen2.5-Coder:** https://qwenlm.github.io/blog/qwen2.5-coder-family/ | HF: https://huggingface.co/Qwen
- **Codestral (Mistral):** https://mistral.ai/news/codestral
- **Gemini code:** https://deepmind.google/technologies/gemini/
- **SWE-bench:** https://www.swebench.com | Leaderboard: https://www.swebench.com/viewer.html
- **LiveCodeBench:** https://livecodebench.github.io
- **EvalPlus:** https://evalplus.github.io
- **BigCodeBench:** https://bigcode-bench.github.io
- **Cursor:** https://cursor.com
- **GitHub Copilot:** https://github.com/features/copilot
- **Claude Code:** https://claude.ai/code

---

## Summary: Model Selection Quick Reference

| Use Case | Top Pick | Budget Pick | Open Source |
|----------|----------|-------------|-------------|
| Autonomous agent coding | Claude Opus 4.5 | Claude 3.5 Sonnet | DeepSeek V3 |
| IDE completion (fast) | Claude Haiku | GPT-4o-mini | Qwen2.5-Coder-7B |
| Algorithm/math | o3 / o4-mini | GPT-4o | DeepSeek R1 |
| Large codebase | Gemini 2.5 Pro | GPT-4.1 | Qwen2.5-Coder-32B |
| Self-hosted | — | — | Qwen2.5-Coder-32B |
| Cost-sensitive API | DeepSeek V3 | GPT-4o-mini | Qwen2.5-Coder-32B |

---

*Research compiled March 2026. The code model leaderboard changes rapidly — check SWE-bench.com and LiveCodeBench for the latest rankings.*
