# Agent Evaluation Frameworks: Comprehensive Research Guide

> **Last Updated:** March 2025  
> **Key Benchmarks:** SWE-bench, GAIA, WebArena, AgentBench, τ-bench, FRAMES  
> **Official URLs:** see References section

---

## Table of Contents

1. [Overview](#overview)
2. [Why Evaluating Agents Is Hard](#why-evaluating-agents-is-hard)
3. [Evaluation Dimensions](#evaluation-dimensions)
4. [Key Agent Metrics](#key-agent-metrics)
5. [SWE-bench](#swe-bench)
6. [GAIA Benchmark](#gaia-benchmark)
7. [WebArena](#webarena)
8. [AgentBench](#agentbench)
9. [τ-bench (Tau-Bench)](#τ-bench-tau-bench)
10. [FRAMES Benchmark](#frames-benchmark)
11. [OSWorld](#osworld)
12. [Mind2Web](#mind2web)
13. [ToolBench](#toolbench)
14. [Benchmark Comparison Matrix](#benchmark-comparison-matrix)
15. [Evaluation Frameworks & Tooling](#evaluation-frameworks--tooling)
16. [Building Your Own Agent Evals](#building-your-own-agent-evals)
17. [Current Leaderboard Scores (2024-2025)](#current-leaderboard-scores-2024-2025)
18. [Challenges in Agent Evaluation](#challenges-in-agent-evaluation)
19. [References](#references)

---

## Overview

Evaluating AI agents is fundamentally different from evaluating standard LLMs. While LLM evals typically measure a single forward pass (question → answer), agent evals must assess **multi-step sequential decision-making** where each action affects subsequent ones.

The field has converged on several gold-standard benchmarks that test different facets of agent capability:

| Benchmark | Focus | Year |
|-----------|-------|------|
| **SWE-bench** | Software engineering (code) | 2023/2024 |
| **GAIA** | General AI assistant tasks | 2023 |
| **WebArena** | Web navigation | 2023 |
| **AgentBench** | Multi-environment | 2023 |
| **τ-bench** | Tool use in customer service | 2024 |
| **FRAMES** | Factual retrieval + reasoning | 2024 |
| **OSWorld** | Full computer use | 2024 |

---

## Why Evaluating Agents Is Hard

### Core Challenges

**1. Non-determinism**  
Agents are stochastic — the same agent run on the same task produces different trajectories. Single-run evaluations are unreliable.

**2. Long-horizon dependencies**  
An error in step 3 of a 20-step task can cascade. Partial credit is hard to define.

**3. Environment state management**  
Web and OS environments change over time (websites update, APIs change). Reproducibility requires sandboxing.

**4. Metric design**  
- Binary task success? (pass/fail)
- Partial credit? (how to score step 5 of 10?)
- Efficiency? (fewer steps is better)
- Safety? (did the agent avoid harmful actions?)

**5. Human evaluation**  
Many tasks require human judgment to verify correctness — expensive and subjective.

**6. Contamination**  
LLMs may have "seen" benchmark tasks in training data. Harder to prevent than with standard NLP benchmarks.

**7. Test-time compute sensitivity**  
More compute (longer chains of thought, more retries) = better scores. How to normalize?

---

## Evaluation Dimensions

Modern agent evaluation examines multiple dimensions:

### Task-Level Dimensions

| Dimension | Description | Metric |
|-----------|-------------|--------|
| **Task Success Rate** | Did the agent complete the task? | Binary or partial |
| **Planning Quality** | Were subtask assignments correct? | Planning score |
| **Tool Use Accuracy** | Did the agent use tools correctly? | Tool call accuracy |
| **Efficiency** | How many steps/tokens were used? | Steps per task |
| **Reliability** | Consistent across multiple runs? | Pass@k, variance |

### Agent-Specific Dimensions

| Dimension | Description |
|-----------|-------------|
| **Grounding** | Does the agent correctly interpret instructions? |
| **Reasoning** | Does it correctly reason through sub-problems? |
| **Memory** | Does it retain relevant context over long tasks? |
| **Recovery** | Can it recover from failed tool calls? |
| **Safety** | Does it avoid harmful/destructive actions? |

### Multi-Agent Dimensions

From Amazon's real-world agentic systems experience:
- **Planning score:** Successful subtask assignment to subagents
- **Communication score:** Inter-agent communication messages per subtask
- **Collaboration success rate:** Percentage of successful sub-task completions
- **Handoff accuracy:** Correct transfer of context between agents

---

## Key Agent Metrics

### Pass@k

The probability that at least one of k independent runs succeeds:

```python
def pass_at_k(n: int, c: int, k: int) -> float:
    """
    n = total attempts
    c = number of correct completions
    k = sample size
    Returns: probability that at least 1 of k samples is correct
    """
    if n - c < k:
        return 1.0
    return 1.0 - math.comb(n - c, k) / math.comb(n, k)
```

Used heavily in SWE-bench and coding benchmarks.

### Task Success Rate (TSR)

```python
TSR = (number of tasks fully completed) / (total tasks)
```

Binary — no partial credit.

### Partial Success Rate

```python
# τ-bench style: reward model checks individual steps
PSR = sum(step_rewards) / total_steps
```

### Tool Accuracy

```python
# Measures correctness of tool invocations
tool_acc = (correct_tool_calls) / (total_tool_calls)

# Broken down:
tool_selection_acc = (correct_tool_chosen) / (total_calls)
tool_args_acc = (correct_args_provided) / (total_calls)
```

### Steps-to-Completion

Measures efficiency — fewer steps = better:

```python
avg_steps = mean([steps_taken_per_task])
# Normalized: steps_taken / steps_optimal (if known)
```

### Reliability Score (τ-bench)

Measures consistency across multiple runs on same tasks:

```python
# Reliability = P(passing ALL n runs of the same task)
reliability = pass_at_1_rate ^ n_required_consistent_runs
```

---

## SWE-bench

### Overview

**Paper:** "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?"  
**URL:** https://www.swebench.com  
**GitHub:** https://github.com/SWE-bench/SWE-bench  
**Published:** 2023 (ICLR 2024)

SWE-bench evaluates whether agents can **resolve real GitHub issues** from popular Python repositories. It tests end-to-end software engineering capability.

### Dataset

- **2,294 tasks** (original), **500 verified** (SWE-bench Verified)
- Source: Real issues from GitHub repos: Django, Flask, Scikit-learn, Matplotlib, etc.
- Each task: Issue description + repository snapshot → patch

### Evaluation Process

```
Input:
  - GitHub issue text
  - Repository codebase
  
Agent task:
  - Understand the bug/feature request
  - Navigate the codebase
  - Implement a fix
  - Produce a git patch
  
Evaluation:
  - Apply the patch
  - Run the test suite
  - Pass = all specified tests pass
```

### SWE-bench Variants

| Variant | Tasks | Notes |
|---------|-------|-------|
| SWE-bench (original) | 2,294 | Community-leaderboard |
| SWE-bench Verified | 500 | Human-verified by OpenAI |
| SWE-bench Lite | 300 | Faster evaluation |
| SWE-bench Multilingual | 1,632 | 17 programming languages |
| SWE-bench Multimodal | 617 | Includes visual elements (web UI) |

### Leaderboard Scores (% resolved)

| Agent / Model | SWE-bench Verified | Date |
|--------------|-------------------|------|
| SWE-agent (GPT-4o) | ~38% | 2024 |
| Claude 3.5 Sonnet + SWE-agent | ~49% | 2024 |
| Devin (Cognition AI) | ~13% | 2024 (original) |
| o3 (OpenAI) | ~72% | 2025 |
| Claude 4.6 Opus | ~80%+ | 2026 (est.) |
| Mini-SWE-agent v2 | ~60%+ | 2025 |

### How SWE-agent Works

SWE-agent is a scaffold agent specifically designed for SWE-bench:

```python
# SWE-agent architecture (simplified)
class SWEAgent:
    def __init__(self, llm, repo_path):
        self.llm = llm
        self.repo = repo_path
        # Special tools: bash, file editor, linting
        
    def solve_issue(self, issue_text):
        # 1. Explore repository structure
        # 2. Locate relevant files
        # 3. Understand the issue
        # 4. Write a fix
        # 5. Test the fix
        # 6. Generate patch
```

Key design: **ACT (Agent-Computer Interface)** — custom tools for code navigation, editing, and testing.

---

## GAIA Benchmark

### Overview

**Paper:** "GAIA: A Benchmark for General AI Assistants"  
**URL:** https://huggingface.co/spaces/gaia-benchmark/leaderboard  
**Published:** 2023

GAIA tests AI agents on **real-world tasks that are "conceptually simple for humans but challenging for AI."** It requires combining:
- Reasoning
- Web browsing
- File processing (PDFs, spreadsheets, images)
- Calculation
- Multi-modal understanding

### Difficulty Levels

| Level | Description | Human Accuracy | AI Accuracy (2024) |
|-------|-------------|---------------|-------------------|
| Level 1 | Single-tool, few steps | ~95% | ~65% |
| Level 2 | Multi-tool, several steps | ~88% | ~40% |
| Level 3 | Complex, many steps | ~76% | ~15% |

### Sample GAIA Tasks

```
Level 1:
"What is the sum of all the numbers in the 'Sales' column of the attached spreadsheet?"
→ Requires: file reading, arithmetic

Level 2:
"Find the GDP of France in 2022, then divide it by the population to get per-capita GDP."
→ Requires: web search, calculation, verification

Level 3:
"In the Wikipedia article about the 2020 Olympics, find the person who won the most gold medals
 in swimming. Then find their hometown. What is the population of their hometown according to 
 the most recent census?"
→ Requires: multi-hop web navigation, entity tracking, numerical extraction
```

### Leaderboard (as of 2024)

| System | Overall | L1 | L2 | L3 |
|--------|---------|----|----|-----|
| Human | 92% | 95% | 88% | 76% |
| GPT-4o + tools | ~67% | ~75% | ~60% | ~35% |
| Claude 3.5 Sonnet + tools | ~65% | ~73% | ~58% | ~33% |
| Gemini 1.5 Pro + tools | ~60% | ~70% | ~53% | ~28% |

---

## WebArena

### Overview

**Paper:** "WebArena: A Realistic Web Environment for Building Autonomous Agents"  
**URL:** https://webarena.dev  
**GitHub:** https://github.com/web-arena-x/webarena  
**Published:** 2023

WebArena provides **self-hostable web applications** for testing web navigation agents.

### Environment Setup

Five self-hosted web applications:
1. **OneStopShop** (based on OpenCommerce) — E-commerce
2. **Postmill** (Reddit clone) — Social forum
3. **GitLab** — Code repository management
4. **OpenStreetMap** — Geographic navigation
5. **Wikipedia** — Knowledge base

### Task Types

- 812 tasks total
- Long-horizon, multi-step workflows
- Functional correctness evaluation (checks actual page state)

### Sample Tasks

```
Shopping:
"Add a blue T-shirt (size M) to my cart and proceed to checkout"

GitLab:
"Create a new issue in the 'backend' project titled 'Fix authentication bug' 
 with label 'bug' and assign it to user 'alice'"

Forum:
"Find the post about Python best practices from 3 days ago and upvote it"
```

### Leaderboard Results (2024)

| System | Task Success Rate |
|--------|-----------------|
| Human | 78.2% |
| GPT-4 + WebArena agent | ~36% |
| Claude 3.5 Sonnet | ~33% |
| GPT-4V | ~28% |
| Text-only agents (2023) | ~14% |

---

## AgentBench

### Overview

**Paper:** "AgentBench: Evaluating LLMs as Agents"  
**GitHub:** https://github.com/THUDM/AgentBench  
**Published:** 2023

AgentBench tests agents across **8 distinct environments** — the most diverse benchmark for general agent capability.

### 8 Evaluation Environments

| Environment | Task Type | Example |
|-------------|-----------|---------|
| **OS** | Shell/terminal tasks | "Compress files matching *.log" |
| **DB** | Database operations | "Find top 5 customers by revenue" |
| **KG** | Knowledge graph | "Find relationships between entities" |
| **WebShop** | E-commerce shopping | "Buy cheapest red dress under $50" |
| **WebArena** | Web navigation | Same as above |
| **Mind2Web** | Web tasks | Open-domain web tasks |
| **House3D** | Embodied AI | Navigate virtual house |
| **Minecraft** | Game environment | Craft items, explore |

### Key Findings

From the original paper testing 29 LLMs:
- Significant performance gap between commercial models (GPT-4, Claude) and open-source
- Open-source models scored 2-5x lower on agent tasks vs commercial
- OS and DB tasks hardest for open-source models
- Best 2023 open-source: 30% of GPT-4's performance

---

## τ-bench (Tau-Bench)

### Overview

**Creator:** Sierra AI  
**GitHub:** https://github.com/sierra-research/tau-bench  
**Blog:** https://sierra.ai/blog/tau-bench-shaping-development-evaluation-agents  
**Focus:** Customer service agents with tool use and real user interaction

### What Makes τ-bench Unique

Unlike most benchmarks (static), τ-bench simulates **live user interactions**:
1. A "user agent" (LLM) plays the role of a customer
2. The evaluated agent must help the user
3. Tasks involve using backend tools (databases, APIs)
4. Multi-turn conversation required

### Domains

- **Airline:** Booking changes, refunds, upgrades
- **Retail:** Order management, returns, product questions
- **Banking:** Account inquiries, transactions

### τ-bench Key Metric: Reliability

Most benchmarks report single-run success. τ-bench emphasizes **consistency across multiple runs**:

```python
# τ-bench measures: "How reliably does the agent succeed consistently?"
# Not just: "Did it succeed once?"

pass_rate = successful_tasks / total_tasks  # Traditional

# τ-bench reliability:
reliability = P(agent passes ALL k independent runs of the same task)
# Much harder to achieve than single-pass success
```

### Results (2024)

| Model | τ-retail | τ-airline |
|-------|---------|----------|
| GPT-4o | ~52% | ~47% |
| Claude 3.5 Sonnet | ~55% | ~50% |
| Gemini 1.5 Pro | ~46% | ~42% |
| Human baseline | ~92% | ~89% |

Gap between AI and human reliability is large — typical agents "pass" maybe 50% of the time consistently, vs 90%+ for humans.

---

## FRAMES Benchmark

### Overview

**Paper:** "FRAMES: Factual Retrieval And Multi-hop Evaluation for RAG Systems"  
**GitHub:** https://github.com/google/frames-benchmark  
**Creator:** Google DeepMind  
**Focus:** RAG agent multi-hop retrieval and reasoning

### What FRAMES Tests

Unlike simple QA benchmarks, FRAMES requires:
1. **Multi-hop retrieval:** Answer requires combining info from 2-5 sources
2. **Factual grounding:** Answer must be verifiable from retrieved docs
3. **Temporal reasoning:** Many questions require recent info
4. **Cross-document synthesis:** Information must be reconciled from multiple docs

### Dataset

- ~824 questions requiring multi-hop retrieval
- Questions span: factual, numeric, temporal, comparative
- Human-verified answers

### Sample Questions

```
Single-hop (baseline):
"Who wrote 'Pride and Prejudice'?"

Multi-hop (FRAMES-style):
"What is the nationality of the director of the most recent film 
 featuring the actor who played James Bond before Daniel Craig?"
 
Requires:
1. Identify Bond before Craig = Pierce Brosnan
2. Find most recent film with Brosnan
3. Identify director of that film
4. Find director's nationality
```

### Performance (2024)

| System | FRAMES Accuracy |
|--------|----------------|
| Human | ~92% |
| GPT-4 + RAG | ~62% |
| Claude 3 Opus + RAG | ~58% |
| Gemini 1.5 Pro + RAG | ~60% |
| Direct (no retrieval) | ~30% |

---

## OSWorld

### Overview

**Paper:** "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments"  
**URL:** https://os-world.github.io  
**Accepted:** NeurIPS 2024

Tests agents on **369 real-world computer tasks** across Ubuntu, Windows, macOS.

### Task Categories

| Category | Count | Examples |
|----------|-------|---------|
| Web browsing | ~90 | Find info on Chrome |
| File management | ~50 | Organize files, compress |
| Office apps | ~80 | Edit spreadsheets, create docs |
| Code editing | ~70 | Fix code in VS Code |
| System config | ~40 | Change settings |
| Multi-app | ~39 | Cross-app workflows |

### Score Progression (2024-2025)

| Model | OSWorld Score | Notes |
|-------|-------------|-------|
| Human | 72.4% | Upper bound |
| Claude 3.5 Sonnet (Oct 2024) | 14.9% | Launch of computer use |
| GPT-4V (2024) | 11.8% | — |
| UI-TARS (ByteDance) | ~22% | Specialized fine-tune |
| Claude 3.7 Sonnet (2025) | ~55% | Major improvement |
| Claude Opus 4.6 (2026) | 72.7% | Matches human baseline |

---

## Mind2Web

### Overview

**Paper:** "Mind2Web: Towards a Generalist Agent for the Web"  
**Published:** 2023

**2,350 tasks** across 137 real websites, 31 domains (travel, shopping, education, etc.)

### Key Difference from WebArena

WebArena: self-hosted apps, functional eval
Mind2Web: real websites, annotation-based eval (harder to verify automatically)

---

## ToolBench

### Overview

**Paper:** "ToolLLM: Facilitating Large Language Models to Master 16000+ Real-World APIs"

Tests agents on using **real REST APIs**:
- 16,000+ APIs from RapidAPI
- Tool documentation understanding
- Multi-API chaining tasks

---

## Benchmark Comparison Matrix

| Benchmark | Domain | # Tasks | Eval Type | Sandboxed | Open Source |
|-----------|--------|---------|-----------|-----------|------------|
| SWE-bench | Code/SE | 2,294 | Automated | Yes | Yes |
| GAIA | General | 466 | Human+Auto | Partial | Yes |
| WebArena | Web | 812 | Functional | Yes | Yes |
| AgentBench | Multi | ~4,000 | Mixed | Yes | Yes |
| τ-bench | Customer svc | 1,000+ | LLM-as-judge | Simulated | Yes |
| FRAMES | RAG/QA | 824 | Exact match | Yes | Yes |
| OSWorld | Computer use | 369 | Functional | Yes | Yes |
| Mind2Web | Web | 2,350 | Annotation | No (real web) | Yes |
| ToolBench | API use | 16,000+ | Automated | Partial | Yes |

---

## Evaluation Frameworks & Tooling

### LangSmith (LangChain)

```python
from langsmith import Client
from langsmith.evaluation import evaluate

client = Client()

# Define evaluator
def task_success_evaluator(run, example):
    """Custom evaluator for task success."""
    predicted = run.outputs.get("result")
    expected = example.outputs.get("answer")
    return {"score": 1 if predicted == expected else 0, "key": "task_success"}

# Run evaluation
results = evaluate(
    target=my_agent.run,
    data="my-eval-dataset",
    evaluators=[task_success_evaluator],
    experiment_prefix="agent-v1",
)
```

### RAGAS (RAG Evaluation)

```python
from ragas import evaluate
from ragas.metrics import (
    answer_relevancy,
    faithfulness,
    context_recall,
    context_precision,
)

result = evaluate(
    dataset=eval_dataset,
    metrics=[
        context_precision,
        context_recall,
        faithfulness,
        answer_relevancy,
    ],
)
print(result)
```

### Braintrust

Modern agent evaluation platform:

```typescript
import { Eval } from "braintrust";

Eval("agent-eval", {
    data: () => loadTestCases(),
    task: async (input) => {
        return await myAgent.run(input.query);
    },
    scores: [
        TaskCompletionScorer,
        ToolAccuracyScorer,
        ResponseQualityScorer,
    ],
});
```

### Arize Phoenix

Open-source LLM observability for tracing agent runs:

```python
import phoenix as px
from phoenix.trace import LangChainInstrumentor

px.launch_app()
LangChainInstrumentor().instrument()

# All agent runs are automatically traced
```

### LlamaIndex Evaluation

```python
from llama_index.core.evaluation import (
    FaithfulnessEvaluator,
    RelevancyEvaluator,
    CorrectnessEvaluator,
)

evaluator = CorrectnessEvaluator()
result = await evaluator.aevaluate(
    query="What is the company's return policy?",
    response=agent_response,
    reference="Returns accepted within 30 days...",
)
print(f"Score: {result.score}, Feedback: {result.feedback}")
```

---

## Building Your Own Agent Evals

### Golden Dataset Construction

```python
# Structure for agent evaluation dataset
agent_eval_cases = [
    {
        "id": "task_001",
        "input": "Find the cheapest round-trip flight from NYC to London in March",
        "expected_tool_calls": ["search_flights", "compare_prices"],
        "expected_output_contains": ["price", "airline", "duration"],
        "max_steps": 10,
        "success_criteria": {
            "type": "contains_numeric_price",
            "price_range": [400, 2000]
        }
    },
    # ... more cases
]
```

### Evaluation Harness

```python
import asyncio
import json
from dataclasses import dataclass
from typing import List, Optional

@dataclass 
class EvalResult:
    task_id: str
    success: bool
    steps_taken: int
    tool_calls: List[str]
    final_output: str
    error: Optional[str] = None
    latency_ms: int = 0

async def evaluate_agent(
    agent,
    test_cases: List[dict],
    runs_per_case: int = 3,  # Multiple runs for reliability
) -> dict:
    results = []
    
    for case in test_cases:
        case_results = []
        
        for run_i in range(runs_per_case):
            start = time.time()
            try:
                result = await agent.run(case["input"])
                success = check_success(result, case["success_criteria"])
                case_results.append(EvalResult(
                    task_id=case["id"],
                    success=success,
                    steps_taken=result.steps,
                    tool_calls=[t.name for t in result.tool_calls],
                    final_output=str(result),
                    latency_ms=int((time.time() - start) * 1000),
                ))
            except Exception as e:
                case_results.append(EvalResult(
                    task_id=case["id"],
                    success=False,
                    steps_taken=0,
                    tool_calls=[],
                    final_output="",
                    error=str(e),
                ))
        
        results.append(case_results)
    
    # Compute metrics
    return compute_metrics(results, runs_per_case)

def compute_metrics(results, runs_per_case):
    total_cases = len(results)
    all_runs = [run for case in results for run in case]
    
    return {
        "task_success_rate": sum(r.success for r in all_runs) / len(all_runs),
        "reliability": sum(
            all(r.success for r in case) for case in results
        ) / total_cases,
        "avg_steps": sum(r.steps_taken for r in all_runs if r.success) / 
                     max(sum(r.success for r in all_runs), 1),
        "avg_latency_ms": sum(r.latency_ms for r in all_runs) / len(all_runs),
        "error_rate": sum(bool(r.error) for r in all_runs) / len(all_runs),
    }
```

### Evaluation Checklist

```markdown
## Agent Evaluation Checklist

### Correctness
- [ ] Task success rate (binary)
- [ ] Partial completion rate (% of subtasks done)
- [ ] Output quality (LLM-as-judge)
- [ ] Factual accuracy (for knowledge tasks)

### Reliability
- [ ] Pass@1 (single run)
- [ ] Pass@k (k=3, k=5 independent runs)
- [ ] Consistency score (same input → same output?)

### Efficiency
- [ ] Average steps to completion
- [ ] Total token usage per task
- [ ] Wall-clock latency
- [ ] Cost per task

### Tool Use
- [ ] Tool selection accuracy
- [ ] Tool argument correctness
- [ ] Unnecessary tool call rate
- [ ] Recovery from failed tool calls

### Safety
- [ ] Refusal rate on harmful tasks
- [ ] Sensitive action confirmation rate
- [ ] Prompt injection resistance

### Multi-Agent (if applicable)
- [ ] Handoff accuracy
- [ ] Coordination efficiency
- [ ] Subtask delegation correctness
```

---

## Current Leaderboard Scores (2024-2025)

### SWE-bench Verified

| System | Score | Date |
|--------|-------|------|
| o3 (OpenAI) | ~72% | Jan 2025 |
| Claude 3.7 Sonnet | ~57% | 2025 |
| Claude 3.5 Sonnet + SWE-agent | ~49% | 2024 |
| GPT-4o + SWE-agent | ~38% | 2024 |
| Devin (Cognition) | ~13% | 2024 (original claim disputed) |

### GAIA (Overall)

| System | Overall | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|---------|
| Human | ~92% | ~95% | ~88% | ~76% |
| o1 + tools | ~75% | ~83% | ~70% | ~55% |
| GPT-4o + tools | ~67% | ~75% | ~60% | ~35% |
| Claude 3.5 Sonnet | ~65% | ~73% | ~58% | ~33% |

---

## Challenges in Agent Evaluation

### 1. Benchmark Saturation

As models improve rapidly, benchmarks get "solved." SWE-bench Verified went from 13% to 80%+ in under 2 years.

**Response:** Continuously harder benchmarks, private test sets, live evaluation.

### 2. Contamination

LLMs may have ingested benchmark data during training.

**Mitigation:** Time-based splits (only post-cutoff tasks), private test sets, held-out evaluation.

### 3. Evaluation Cost

Running 300 multi-step agent tasks × 3 runs = 900 expensive agent invocations.

**Mitigation:** Tiered evaluation (fast/cheap for development, full for reporting), distillation.

### 4. LLM-as-Judge Bias

Using LLMs to evaluate agent outputs introduces model-specific biases.

**Mitigation:** Use multiple judges, human spot checks, calibration studies.

### 5. Environment Drift

Web pages change, APIs change, breaking previously working agents.

**Mitigation:** Self-hosted environments (WebArena), versioned snapshots (SWE-bench).

### 6. Metric Misalignment

Task success rate doesn't capture **how** the agent achieved success. An agent that takes 50 steps where 10 would suffice "succeeds" but is inefficient.

---

## References

- **SWE-bench Website:** https://www.swebench.com
- **SWE-bench GitHub:** https://github.com/SWE-bench/SWE-bench
- **SWE-bench Verified (OpenAI):** https://openai.com/index/introducing-swe-bench-verified/
- **GAIA Leaderboard:** https://huggingface.co/spaces/gaia-benchmark/leaderboard
- **WebArena:** https://webarena.dev/
- **WebArena GitHub:** https://github.com/web-arena-x/webarena
- **AgentBench GitHub:** https://github.com/THUDM/AgentBench
- **τ-bench (Sierra AI):** https://sierra.ai/blog/tau-bench-shaping-development-evaluation-agents
- **τ-bench GitHub:** https://github.com/sierra-research/tau-bench
- **FRAMES Benchmark:** https://github.com/google/frames-benchmark
- **OSWorld:** https://os-world.github.io/
- **OSWorld GitHub (NeurIPS 2024):** https://github.com/xlang-ai/OSWorld
- **AgentBench Paper:** https://arxiv.org/abs/2308.03688
- **Best AI Agent Evals Guide (o-mega.ai):** https://o-mega.ai/articles/the-best-ai-agent-evals-and-benchmarks-full-2025-guide
- **EvidentlyAI Agent Benchmarks:** https://www.evidentlyai.com/blog/ai-agent-benchmarks
- **Amazon Agent Eval (AWS):** https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/
- **8 Benchmarks Shaping AI Agents (Tessl):** https://tessl.io/blog/8-benchmarks-shaping-the-next-generation-of-ai-agents/
- **Multi-Dimensional Enterprise Agent Eval (ArXiv):** https://arxiv.org/html/2511.14136v1
