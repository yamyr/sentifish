# Coding Agent Benchmarks: SWE-bench and Beyond (2024–2025)

> Research compiled: March 2026  
> Topics: SWE-bench Verified vs Lite, HumanEval, benchmark methodology, top-scoring harnesses, leaderboard analysis

---

## Overview

Benchmarking coding agents has become a critical discipline in the AI/ML field. As coding agents have moved from research curiosities to production tools, the need for rigorous, reproducible evaluation has intensified. The benchmark ecosystem has grown to address multiple dimensions: raw code generation, bug fixing, multi-file reasoning, test generation, and full software engineering tasks.

The flagship benchmark — SWE-bench — evaluates agents on real GitHub issues from popular Python repositories. A score on SWE-bench has become the de facto "batting average" for coding agents, with top systems now exceeding 80% on the Verified split.

---

## SWE-bench: The Standard

### What Is SWE-bench?

SWE-bench (**S**oft**W**are **E**ngineering Benchmark) was introduced in a paper by Carlos Jimenez et al. and accepted at NeurIPS 2024. It evaluates LLMs on their ability to resolve real GitHub issues from popular open-source Python repositories.

**The Task:**
1. Agent receives: a repository snapshot + a GitHub issue description
2. Agent must: produce a patch (diff) that resolves the issue
3. Evaluation: apply the patch, run the existing test suite, check if tests pass

**What makes this hard:**
- Issues require understanding entire codebases, not just isolated functions
- Solutions must not break existing tests (regression safety)
- Correct understanding of issue intent, not just surface text
- Often requires modifying multiple files
- Repositories include Django, Flask, pytest, scikit-learn, matplotlib, etc.

### The Dataset

**Original SWE-bench (Full):**
- 2,294 instances from 12 Python repositories
- Spans issues from 2020–2023
- No human validation of task quality

**SWE-bench Lite:**
- 300 instances (subset of full)
- Filtered for clarity and self-containment
- Issues that require 1-5 file changes (not system-wide rewrites)
- Introduced to enable faster evaluation cycles

**SWE-bench Verified (Aug 2024, by OpenAI):**
- 500 instances
- Human-validated by OpenAI contractors and researchers
- Each instance reviewed for: accurate problem statement, unambiguous solution, passing reference tests
- **Considered the gold standard** as of 2025
- Removes "trick questions" where the issue description was misleading

**SWE-bench Multilingual (2025):**
- Extended to Java, TypeScript, JavaScript, Go, Rust, C++
- Tests whether agents generalize beyond Python
- Significantly lower scores across the board (Python-specific training data advantage)

**SWE-bench Multimodal (2025):**
- Issues that include screenshots, diagrams, visual context
- Evaluates vision-language capabilities in coding context

### How Evaluation Works

```
1. Setup:
   - Clone repository at the issue's commit hash
   - Set up Python environment (conda/pip from repo specs)

2. Agent execution:
   - Feed agent: repo, issue text, (optionally) test files
   - Agent runs within sandbox (typically Docker)
   - Agent produces a patch (git diff format)

3. Evaluation:
   - Apply agent's patch to repository
   - Run the test suite specified for this instance
   - "Pass" = all tests in the evaluation test set pass
   - "Fail" = any evaluation test fails, OR patch fails to apply

4. Scoring:
   - % Resolved = (passing instances) / (total instances) × 100
```

**Key metric:** `% Resolved` — the percentage of instances where the agent's patch passes all evaluation tests.

---

## Leaderboard: Current Top Performers (2025–2026)

### SWE-bench Verified Leaderboard

| Rank | System | Score | Notes |
|------|--------|-------|-------|
| 1 | Claude Opus 4.5 (Tools) | 80.9% | Anthropic, 2025 |
| 2 | Claude Opus 4.1 (Tools) | ~76% | Anthropic |
| 3 | mini-SWE-agent v2 | ~74% | Princeton/CMU, 100-line agent |
| 4 | GPT-5 | ~73% | OpenAI |
| 5 | Devin 2.0 | ~55% | Cognition AI |
| ~10 | Claude Sonnet 3.5 | ~49% | Anthropic (older model) |
| Baseline | GPT-4 (no scaffolding) | ~1.7% | Raw LLM, no agent loop |

*Note: Leaderboard shifts rapidly; these are approximate 2025-2026 figures.*

### SWE-bench Pro (Scale Labs, 2026)

Scale Labs introduced **SWE-bench Pro** as a harder successor to Verified:
- More complex issues requiring deeper reasoning
- Less overlap with training data
- Best models score only ~23% (vs 70%+ on Verified)
- GPT-5: 23.3%, Claude Opus 4.1: 23.1%

This gap illustrates a key concern: **data contamination** — top models may have memorized solutions from Verified rather than truly solving them.

### SWE-bench Lite (historical reference)

| Year | Best System | Score |
|------|-------------|-------|
| 2024 Q1 | SWE-agent (GPT-4) | 12.5% |
| 2024 Q2 | Claude 3 Opus | 20.5% |
| 2024 Q3 | SWE-agent (Claude 3.5) | 41.2% |
| 2024 Q4 | Various | ~45-50% |
| 2025 | Claude + scaffolding | ~60%+ |

---

## mini-SWE-agent: A Landmark Result

In 2025, Princeton/CMU researchers released **mini-SWE-agent**, described as a "100-line AI agent" that achieves >74% on SWE-bench Verified.

### Why It Matters

The original SWE-agent had:
- Complex tool definitions (open_file, scroll, search, etc.)
- Thousands of lines of scaffolding code
- Elaborate context management
- Custom ACI (Agent-Computer Interface)

mini-SWE-agent has:
- **No custom tools** beyond plain bash
- No special file navigation tools
- No tool-calling interface — just raw bash commands
- ~100 lines of Python scaffolding

**Insight:** Modern LLMs (Claude 3.5+, GPT-4o+) are capable enough that elaborate scaffolding is no longer necessary. A well-prompted model with bash access can match complex harnesses.

```python
# The entire mini-SWE-agent is essentially:
system_prompt = "You have bash access. Solve the following GitHub issue..."
while not done:
    response = llm.complete(history)
    if response.has_bash_command:
        output = bash.run(response.bash_command)
        history.append(output)
```

---

## HumanEval: Function-Level Coding

### What Is HumanEval?

HumanEval was introduced by OpenAI in the Codex paper (Chen et al., 2021). It evaluates code generation at the **function level**:

- 164 programming problems
- Each problem: function signature + docstring + test cases
- Agent must implement the function body
- Metric: pass@k (probability that at least k of K samples pass all tests)

### HumanEval+ (2023 update)

EvalPlus expanded HumanEval to 80× more test cases per problem, revealing that many systems that "passed" HumanEval were actually producing buggy code that happened to pass the limited original tests.

| System | HumanEval | HumanEval+ |
|--------|-----------|------------|
| GPT-4 | 86.6% | 81.7% |
| Claude 3.5 Sonnet | 92% | 88% |
| DeepSeek Coder | 87.6% | 83.7% |
| GPT-3.5 | 72.6% | 65.9% |

### Limitations of HumanEval

- Single-function scope (no multi-file understanding required)
- Python only (mostly)
- Static dataset (agents may have seen training data overlap)
- No code review, testing, or deployment context
- Saturated: top models score 90%+, ceiling reached

---

## MBPP: Mostly Basic Programming Problems

**MBPP (Austin et al., 2021):**
- 374 programming problems
- Crowd-sourced from programmers
- Tests basic algorithmic skills
- Also mostly saturated by 2024

**MBPP+** (EvalPlus expansion): Added more tests, harder edge cases.

---

## LiveCodeBench: Dynamic Evaluation

To address data contamination concerns, **LiveCodeBench** continuously adds new problems from competitive programming contests (LeetCode, Codeforces, AtCoder) after they're posted.

- New problems added weekly/monthly
- Timestamps allow analysis of performance degradation over time
- **Key finding:** Model performance drops significantly on problems posted after training cutoff, suggesting contamination in static benchmarks

---

## SWE-bench: Data Contamination Concerns

A 2025 arxiv paper "The SWE-Bench Illusion" argued:

> "Among these, SWE-Bench Verified has emerged as a prominent benchmark for assessing LLMs' ability to resolve real-world GitHub issues. Recent advances have shown LLMs achieving over 70% Pass@1 accuracy, suggesting substantial progress — but much of this may be memorization."

**Evidence of contamination:**
1. Models fine-tuned on SWE-bench data before cutoff show disproportionate improvements
2. SWE-bench Pro (harder, less contaminated) shows 23% scores where Verified shows 70%+
3. Repository-specific performance varies in ways consistent with training data coverage

**Counter-arguments:**
- Human contractors validated Verified instances for solvability
- Score improvements correlate with general reasoning improvements
- Newer issues (2023-2024) still show improvement, suggesting generalization

---

## CodeContests and Competitive Programming Benchmarks

**APPS (Hendrycks et al., 2021):**
- 10,000 Python programming problems
- Three difficulty levels: introductory, interview, competition
- Best models: 25-35% pass rate on competition level

**CodeContests (DeepMind, 2022):**
- Problems from Codeforces, AtCoder, HackerEarth
- Evaluated AlphaCode
- AlphaCode 2: ~85th percentile on Codeforces

**IOI/USACO Problems:**
- Gold standard for algorithmic problem solving
- Claude 3.5 Sonnet 2024: 32% on USACO Gold
- GPT-4o: 20% on USACO Gold

---

## BigCodeBench: Diverse Real-World Tasks

**BigCodeBench (2024):**
- 1,140 function-level coding tasks
- Uses real-world Python libraries (pandas, PIL, requests, etc.)
- Tests library knowledge, not just algorithmic skill
- More representative of actual developer work

| Model | BigCodeBench (Complete) | BigCodeBench (Instruct) |
|-------|------------------------|------------------------|
| GPT-4o | 61.1% | 54.9% |
| Claude 3.5 Sonnet | 65.2% | 58.7% |
| DeepSeek V3 | 66.0% | 58.3% |

---

## DevBench: Multi-Language, Multi-Task

**DevBench (2024):**
- Evaluates: software design, environment setup, test writing, code writing, code review
- Multiple programming languages
- End-to-end software development workflow

This is closer to real-world software engineering than HumanEval but harder to evaluate automatically.

---

## How to Read Benchmark Results

### Red Flags

1. **No scaffolding description**: Did the agent use retrieval? Multiple LLM calls? What tools?
2. **Single-run scores**: Pass@1 vs Pass@10 vs Pass@100 means very different things
3. **Version not specified**: Model versions matter enormously (gpt-4-0314 vs gpt-4-turbo)
4. **Cherry-picked benchmark**: High score on one benchmark, not reported on others
5. **No error analysis**: What *type* of tasks did the model fail on?

### Good Methodology Markers

- Full reproducibility scripts provided
- Scores reported with confidence intervals
- Comparison to multiple baselines
- Results on held-out test set not used for development
- Third-party independent verification

---

## The Benchmark Arms Race

The pattern in benchmarks:
1. New hard benchmark introduced
2. Research community focuses on it
3. Models rapidly improve (via fine-tuning + better prompting)
4. Benchmark saturates (~80-90% accuracy)
5. New harder benchmark introduced

This cycle has accelerated significantly:
- HumanEval: introduced 2021, saturated by 2023
- SWE-bench Lite: introduced 2023, 50%+ by 2024
- SWE-bench Verified: introduced 2024, 70%+ by late 2025
- SWE-bench Pro: introduced 2026, ~23% current best

---

## Benchmark Infrastructure

### Harness Setup

Most SWE-bench submissions use:
- Docker for isolated evaluation environments
- Each instance runs in its own container
- Automated test execution with standardized reporting
- Typically evaluated on AWS or GCP instances

### Cost Considerations

Evaluating 500 instances on SWE-bench Verified typically costs:
- $50-500 in API costs depending on model
- Several hours of compute time
- Significant engineering effort for first setup

Open-source evaluation code available at: https://github.com/princeton-nlp/SWE-bench

---

## Sources

- SWE-bench paper: https://arxiv.org/abs/2310.06770 (NeurIPS 2024)
- SWE-bench leaderboard: https://www.swebench.com/
- OpenAI SWE-bench Verified: https://openai.com/index/introducing-swe-bench-verified/
- The SWE-Bench Illusion: https://arxiv.org/html/2506.12286v3
- LLM Stats Verified: https://llm-stats.com/benchmarks/swe-bench-verified
- Scale Labs SWE-bench Pro: https://labs.scale.com/leaderboard/swe_bench_pro_public
- mini-SWE-agent: https://github.com/SWE-agent/mini-swe-agent
- AI agent benchmark comparison: https://github.com/murataslan1/ai-agent-benchmark
- Vals.ai SWE-bench: https://www.vals.ai/benchmarks/swebench
