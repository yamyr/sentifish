# Agentless: Demystifying LLM-based Software Engineering

> Research compiled March 2026. Sources: arXiv:2407.01489, GitHub OpenAutoCoder/Agentless, ACM PACMSE, HuggingFace papers.

---

## Overview

**Agentless** is a research project and open-source tool that challenges the dominant paradigm in LLM-based software engineering: the agent loop. Rather than giving an LLM autonomy to decide what tools to use and what actions to take, Agentless follows a **fixed, structured pipeline** consisting of three phases:

1. **Localization** — Identify the buggy location in the codebase
2. **Repair** — Generate candidate patches at that location
3. **Patch Validation** — Select the best patch using tests

This deceptively simple approach achieves **competitive performance** with far more complex agentic frameworks, at significantly lower cost.

**Paper**: "Agentless: Demystifying LLM-based Software Engineering Agents"  
**Authors**: Chunqiu Steven Xia, Yinlin Deng, Soren Dunn, Lingming Zhang (UIUC)  
**Published**: arXiv:2407.01489 (July 2024), ACM PACMSE (2024)  
**Repository**: https://github.com/OpenAutoCoder/Agentless

---

## The Central Argument

The paper's thesis is provocative: **do we actually need agents for software engineering?**

Complex agent frameworks like SWE-agent require the LLM to:
- Choose which tools to call
- Decide when to stop exploring
- Navigate large codebases autonomously
- Handle tool failures and retry
- Maintain coherent context across many tool calls

Each of these decision points is an opportunity for the agent to make mistakes. The more decisions the LLM must make, the more ways it can go wrong.

Agentless argues that for **well-defined bug-fixing tasks** (the SWE-bench paradigm), a simpler fixed pipeline can:
- Achieve comparable or better task completion rates
- Cost significantly less (fewer LLM calls, no agent overhead)
- Be more predictable and explainable
- Be easier to analyze and improve

---

## Architecture: The Three-Phase Pipeline

### Phase 1: Hierarchical Localization

Localization answers the question: **where in the codebase is the bug?**

The process is hierarchical, working top-down:

#### Step 1a: File Localization
- Input: Issue description + repository file tree (structure overview)
- LLM ranks which files are most likely to contain the bug
- Output: Top-N suspicious files (typically top 5-10)

#### Step 1b: Class/Function Localization
- Input: Issue description + content of suspicious files
- LLM identifies which classes, methods, or functions within those files are buggy
- Output: List of suspicious code elements

#### Step 1c: Edit Location Localization
- Input: Issue + suspicious functions
- LLM pinpoints exact lines or regions that need to be changed
- Output: Fine-grained edit locations (file path + line range)

**Why hierarchical?** Direct line-level localization from a full repository is too hard for LLMs (too much context). Narrowing down step-by-step allows each LLM call to operate on a manageable context window.

### Phase 2: Repair (Patch Generation)

With edit locations identified, Agentless generates **multiple candidate patches**:

1. Present the buggy code region to the LLM with the issue description
2. Ask for a fix in **unified diff format**
3. **Sample k patches** (e.g., k=10-20) from the LLM at varied temperatures
4. Result: a diverse set of candidate patches

**Key design choice**: Agentless generates patches in `diff` format rather than asking for full file rewrites. This:
- Keeps patches minimal and targeted
- Reduces hallucination of unrelated changes
- Makes validation and review easier

### Phase 3: Patch Validation & Ranking

Not all candidate patches are correct. Agentless uses a two-pronged validation:

#### Step 3a: Test Reproduction
- For each patch, apply it to the codebase
- Run pre-existing **regression tests** to filter patches that break working code
- Optionally: generate a **reproduction test** that should fail before the fix and pass after

#### Step 3b: Re-ranking
- Patches that pass all regression tests are kept
- The reproduction test provides additional signal for ranking
- A final patch is selected via majority vote (most common passing patch) or LLM re-ranking

**Majority voting** is key: if 6 out of 10 sampled patches are identical or equivalent, that's strong evidence it's the right fix.

---

## Implementation Details

### Technology Stack

```
Agentless (Python)
├── Localization module
│   ├── File ranker (LLM + repo structure)
│   ├── Function locator (LLM + file content)
│   └── Edit locator (LLM + function content)
├── Repair module
│   ├── Patch sampler (LLM, temperature=0.8, k=10)
│   └── Diff formatter
└── Validation module
    ├── Test runner (pytest)
    ├── Regression filter
    ├── Reproduction test generator
    └── Re-ranker (majority vote + LLM)
```

### Supported Models

- GPT-4o (original experiments)
- Claude 3.5 Sonnet (40.7% on SWE-bench Lite, 50.8% on Verified — v1.5)
- GPT-4-turbo
- Other OpenAI-compatible models

### Cost Efficiency

**Average cost per issue: ~$0.34** (original GPT-4o experiments)

This is dramatically lower than agent-based approaches that may make 50-100 LLM calls per issue. Agentless makes a fixed, predictable number of calls.

---

## Performance Results

### SWE-bench Lite (300 instances)

| Approach | Score | Notes |
|----------|-------|-------|
| Agentless 1.0 (GPT-4o) | 27.3% (82 fixes) | Best open-source at launch (July 2024) |
| Agentless 1.5 (Claude 3.5 Sonnet) | 40.7% | December 2024 |
| Agentless 1.5 (GPT-4o) | ~33% | October 2024 |
| SWE-agent + GPT-4 (at launch) | ~12% | Agent-based baseline |
| Devin (unassisted) | 13.86% | March 2024 |

### SWE-bench Verified (500 curated instances)

| Approach | Score |
|----------|-------|
| Agentless 1.5 (Claude 3.5 Sonnet) | 50.8% |
| SWE-agent competitive | ~50%+ |

**Key finding**: Agentless 1.5 with Claude 3.5 Sonnet achieved 50.8% on Verified — competitive with or exceeding many agent-based approaches at the time.

---

## Comparison with Agent-Based Approaches

### Why Agents Can Fail More

1. **Compounding errors**: Each wrong decision in the agent loop degrades subsequent decisions
2. **Tool abuse**: Agents sometimes call tools unnecessarily or in loops
3. **Context dilution**: Long tool call histories push relevant information out of context
4. **Premature termination**: Agents sometimes submit incorrect patches without enough exploration
5. **Overcomplicated fixes**: Agents may make large, sweeping changes when a small patch suffices

### Where Agentless Falls Short

1. **Cannot learn new information**: No web access, no documentation lookup
2. **Fixed pipeline**: Cannot adapt strategy based on issue complexity
3. **Localization bottleneck**: If localization fails, repair will also fail
4. **No multi-step reasoning over tools**: Cannot install dependencies, run builds, or set up test environments
5. **Repository scale**: Very large codebases may overwhelm the file-ranking step

### Performance-Cost Tradeoff

```
High Cost, Flexible
┌─────────────────┐
│  Agent-based    │ ← SWE-agent, Claude Code, Devin
│  approaches     │   Many LLM calls, adaptive
└─────────────────┘
        ↕
┌─────────────────┐
│  Agentless      │ ← Fixed pipeline, predictable cost
│  approach       │   ~$0.34/issue, competitive results
└─────────────────┘
Low Cost, Fixed Pipeline
```

---

## Localization Performance Analysis

The paper provides detailed localization metrics:

### File-Level Localization (Top-N accuracy)

- **Top-1**: ~60-70% of issues correctly localized to the right file
- **Top-3**: ~80%+ 
- **Top-5**: ~85-90%

### Function-Level Localization

- Conditional on correct file: ~75-80% accuracy
- End-to-end (file + function): ~55-65%

### Impact of Localization Errors

The paper shows that **localization is the binding constraint**: if the correct location is in the top-5 files but not top-1, repair succeeds much less often. This motivates the majority-vote / sampling approach at the repair stage.

---

## Agentless vs. SWE-bench Classification

The paper includes a manual classification of SWE-bench Lite issues into categories:
- **Simple bug fixes**: Agentless excels (clear localization + small patch)
- **Feature additions**: Harder; requires understanding broader context
- **Refactoring**: Very hard; Agentless sometimes makes partial fixes
- **Multi-file changes**: Performance drops significantly
- **Environment issues**: Agentless cannot handle (no shell execution)

---

## Venn Diagram Analysis (Unique Fixes)

An important finding from the paper: Agentless and agent-based systems fix **different sets of issues**. The Venn diagram of fixed issues shows only partial overlap.

This means:
- Agentless is not just a cheaper agent — it has **different strengths**
- An ensemble of Agentless + SWE-agent would fix more issues than either alone
- The approaches are **complementary**, not just competitive

---

## Agentless 1.5 (October 2024) Improvements

The v1.5 release added:
- **Better file selection**: Improved ranking with structured code analysis
- **Context-aware patching**: Better use of surrounding code context
- **Reproduction test generation**: Generates tests that expose the bug
- **Multi-model support**: Tested with Claude 3.5 Sonnet, GPT-4o, etc.
- **Artifact release**: Complete run artifacts for reproducibility

---

## Influence on the Field

Agentless had significant influence:

1. **Questioned agent necessity**: Prompted debate about when agents are actually needed
2. **Inspired hybrid approaches**: Some systems combine fixed pipelines with optional agent escalation
3. **Cost awareness**: Raised awareness of cost as a first-class metric
4. **Reproducibility**: Open artifacts let others build on and verify results
5. **SWE-bench Lite-S**: The team created a filtered "hard" subset (SWE-bench-lite-S) for tougher evaluation

---

## Running Agentless

```bash
# Setup
git clone https://github.com/OpenAutoCoder/Agentless.git
cd Agentless
conda create -n agentless python=3.11
conda activate agentless
pip install -r requirements.txt
export OPENAI_API_KEY=<your_key>

# Run on SWE-bench
python agentless/fl/localize.py \
  --output_folder results/ \
  --model gpt-4o \
  --top_n 5

python agentless/repair/repair.py \
  --output_folder results/ \
  --model gpt-4o \
  --num_samples 10

python agentless/validation/validate.py \
  --output_folder results/
```

---

## Sources

1. Xia et al. — "Agentless: Demystifying LLM-based Software Engineering Agents" (arXiv:2407.01489): https://arxiv.org/abs/2407.01489
2. OpenAutoCoder/Agentless GitHub: https://github.com/OpenAutoCoder/Agentless
3. HuggingFace paper page: https://huggingface.co/papers/2407.01489
4. ACM PACMSE publication: https://dl.acm.org/doi/abs/10.1145/3715754
5. SWE-bench leaderboard: https://www.swebench.com/
