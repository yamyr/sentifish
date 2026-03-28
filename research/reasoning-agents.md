# Reasoning and Planning in AI Agents: CoT, ToT, o1/o3, Extended Thinking

> **Research Date:** March 2026  
> **Focus:** Chain-of-thought, tree-of-thought, reasoning models (o1/o3/o4), extended thinking in Claude, and how advanced reasoning changes agent behavior

---

## Overview

The most significant advancement in AI agents from 2023 to 2025 was not architectural — it was **reasoning quality**. As LLMs shifted from pure language generation to deliberate, structured reasoning, the class of tasks agents could reliably handle expanded dramatically.

The progression:
1. **2022**: Basic instruction-following, no explicit reasoning
2. **2023**: Chain-of-Thought prompting enables step-by-step reasoning
3. **2023–2024**: Tree-of-Thought, ReAct, Plan-and-Solve emerge as prompting techniques
4. **2024**: OpenAI o1 — first model trained to "think before answering"
5. **2025**: Claude 3.7 extended thinking, o3/o4 with computer use, reasoning as default in frontier models
6. **2026**: Reasoning integrated into all agentic frameworks; "thinking" is infrastructure

---

## Part 1: Chain-of-Thought (CoT)

### Overview

Chain-of-Thought prompting (Wei et al., 2022) demonstrated that asking LLMs to show their reasoning steps dramatically improved performance on complex tasks. The key insight: language models perform better when they can "think aloud."

### Types of CoT

#### 1. Zero-Shot CoT
```
Standard prompt: "What is 25% of 360?"
→ Model: "90"  (often incorrect or no reasoning)

Zero-shot CoT: "What is 25% of 360? Let's think step by step."
→ Model: "First, 25% = 0.25. Then 0.25 × 360 = 90. The answer is 90."
```

#### 2. Few-Shot CoT
```python
FEW_SHOT_EXAMPLES = """
Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. 
Each can has 3 tennis balls. How many tennis balls does he have now?
A: Roger started with 5 balls. He bought 2 × 3 = 6 more balls. 
   5 + 6 = 11. The answer is 11.

Q: If there are 3 cars in the parking lot and 2 more cars arrive, 
   how many cars are in the parking lot?
A: There were 3 cars originally. 2 more arrived. 3 + 2 = 5. 
   The answer is 5.
"""

def few_shot_cot_prompt(question: str) -> str:
    return f"{FEW_SHOT_EXAMPLES}\nQ: {question}\nA:"
```

#### 3. Structured XML CoT (Claude)
```python
# Claude-specific: XML tags for structured reasoning
STRUCTURED_COT_PROMPT = """
Before answering, reason through the problem carefully using <thinking> tags.
Structure your reasoning clearly, then provide your final answer in <answer> tags.

Problem: {problem}
"""

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": STRUCTURED_COT_PROMPT.format(problem=user_problem)
    }]
)

# Parse thinking vs answer
import re
thinking = re.findall(r'<thinking>(.*?)</thinking>', response.content[0].text, re.DOTALL)
answer = re.findall(r'<answer>(.*?)</answer>', response.content[0].text, re.DOTALL)
```

### When to Use Manual CoT

With modern reasoning models (o1, o3, Claude 3.7+), explicitly adding "think step by step" often doesn't help — these models reason internally. Manual CoT is still valuable for:

- Models **without** built-in reasoning (GPT-4o-mini, Haiku)
- When you need **visible** reasoning for debugging/audit
- **Domain-specific** reasoning patterns (legal, medical, financial)
- Few-shot examples to guide **how** to reason (not just that it should)

> **Key insight from 2025 research**: *The Decreasing Value of Chain of Thought in Prompting* (2025) showed that for reasoning-native models, adding CoT prompts can actually **reduce** performance by interfering with the model's internal reasoning process.

### CoT Performance Benchmark

| Task Type | No CoT | Manual CoT | Native Reasoning (o3) |
|-----------|--------|------------|----------------------|
| Math (GSM8K) | 49% | 78% | 97.8% |
| Logic puzzles | 31% | 65% | 91% |
| Code debugging | 44% | 68% | 89% |
| Multi-step planning | 38% | 62% | 86% |

*Using GPT-3.5-turbo baseline for No CoT/Manual CoT; o3 for Native Reasoning*

---

## Part 2: Tree-of-Thought (ToT)

### Overview

Tree-of-Thought (Yao et al., 2023) extends CoT from a linear chain to a **branching search tree**. Instead of committing to one reasoning path, the model explores multiple solution paths simultaneously and uses evaluation to select the most promising ones.

### Architecture

```
Chain-of-Thought (linear):
Problem → Step 1 → Step 2 → Step 3 → Answer

Tree-of-Thought (branching):
Problem
    ├── Path A: Step A1 → Step A2 → [Evaluate: 7/10]
    │                              └── Step A3 → Answer A
    ├── Path B: Step B1 → Step B2 → [Evaluate: 4/10] ✗ (prune)
    └── Path C: Step C1 → Step C2 → [Evaluate: 9/10]
                                   └── Step C3 → Answer C ✓ (best)
```

### ToT Implementation

```python
from openai import OpenAI
from typing import Optional
import json

client = OpenAI()

def generate_thoughts(problem: str, current_state: str, n: int = 3) -> list[str]:
    """Generate n possible next thoughts/steps."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Problem: {problem}
Current state: {current_state}

Generate {n} different possible next steps to solve this problem.
Each step should take a different approach.
Format as JSON list of strings."""
        }],
        response_format={"type": "json_object"}
    )
    thoughts = json.loads(response.choices[0].message.content)
    return thoughts.get("steps", [])

def evaluate_thought(problem: str, thought_path: str) -> float:
    """Evaluate how promising a reasoning path is (0-10)."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Cheap model for evaluation
        messages=[{
            "role": "user",
            "content": f"""Problem: {problem}
Reasoning path so far: {thought_path}

Rate this reasoning path from 0-10:
- 10: Definitely leads to correct solution
- 5: Unclear, could go either way  
- 0: Definitely wrong path

Respond with just a number 0-10."""
        }],
        max_tokens=5
    )
    try:
        return float(response.choices[0].message.content.strip())
    except:
        return 5.0

def tree_of_thought(
    problem: str,
    max_depth: int = 4,
    branching_factor: int = 3,
    beam_width: int = 2
) -> str:
    """
    Solve a problem using Tree-of-Thought search.
    Uses beam search to keep only the best paths at each level.
    """
    # Initialize with empty state
    current_beams = [("", 10.0)]  # (thought_path, score)
    
    for depth in range(max_depth):
        next_beams = []
        
        for thought_path, _ in current_beams:
            # Generate branches from current state
            new_thoughts = generate_thoughts(problem, thought_path, branching_factor)
            
            for thought in new_thoughts:
                new_path = f"{thought_path}\nStep {depth+1}: {thought}" if thought_path else f"Step 1: {thought}"
                score = evaluate_thought(problem, new_path)
                next_beams.append((new_path, score))
        
        # Keep only beam_width best paths
        next_beams.sort(key=lambda x: x[1], reverse=True)
        current_beams = next_beams[:beam_width]
        
        # Early termination if we have a high-confidence path
        if current_beams[0][1] >= 9.0:
            break
    
    # Use best path to generate final answer
    best_path = current_beams[0][0]
    
    final_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Problem: {problem}

Best reasoning path found:
{best_path}

Based on this reasoning, provide the final answer."""
        }]
    )
    return final_response.choices[0].message.content

# Usage
result = tree_of_thought(
    "Plan a 3-day trip to Tokyo for a family with 2 young children, budget $3,000",
    max_depth=3,
    branching_factor=3
)
print(result)
```

### When ToT Beats CoT

ToT provides significant improvement over CoT for:
- **Creative tasks** requiring exploration (writing, design)
- **Game playing** and puzzle solving (24 game: 74% vs 4% for CoT)
- **Multi-step planning** with backtracking
- **Code generation** with alternative implementations

**However**: With modern reasoning models (o3, Claude), the internal reasoning often approximates ToT behavior automatically. Manual ToT is most valuable when:
1. You need to force exploration of alternatives
2. You want to audit and compare multiple reasoning paths
3. The model's native reasoning quality is insufficient for the task

---

## Part 3: ReAct — Reasoning + Acting

### Overview

ReAct (Yao et al., 2022) combines reasoning traces with action execution, enabling agents to reason about tool use, observe results, and reason again. This is the foundation of most modern agent frameworks.

### ReAct Loop

```
THOUGHT: I need to find the current population of Singapore.
ACTION: search("Singapore population 2025")
OBSERVATION: Singapore population is approximately 5.92 million (2025)
THOUGHT: Now I have the population. I need to calculate density using area.
ACTION: search("Singapore land area km2")
OBSERVATION: Singapore total area is 733.1 km²
THOUGHT: Population density = 5,920,000 / 733.1 = 8,075 people/km²
ACTION: calculate(5920000 / 733.1)
OBSERVATION: 8074.5
FINAL ANSWER: Singapore's population density is approximately 8,075 people per km².
```

### ReAct Implementation

```python
REACT_SYSTEM_PROMPT = """You are a helpful agent that solves problems using tools.
For each step:
1. Output THOUGHT: your reasoning about what to do next
2. Output ACTION: the tool call (search, calculate, lookup)
3. After seeing OBSERVATION: reason about the result and continue
4. When done, output FINAL ANSWER:

Available tools:
- search(query): Search the web
- calculate(expression): Evaluate math expressions
- lookup(topic): Look up factual information
"""

def parse_react_response(response: str) -> tuple[str, Optional[str]]:
    """Parse ReAct response into (thought, action) or (None, final_answer)."""
    if "FINAL ANSWER:" in response:
        answer = response.split("FINAL ANSWER:")[1].strip()
        return None, answer
    
    thought = ""
    action = None
    
    if "THOUGHT:" in response:
        parts = response.split("ACTION:")
        thought = parts[0].replace("THOUGHT:", "").strip()
        if len(parts) > 1:
            action = parts[1].strip()
    
    return thought, action

def execute_react_action(action: str) -> str:
    """Execute a ReAct action string."""
    if action.startswith("search("):
        query = action[7:-1].strip('"\'')
        return web_search(query)
    elif action.startswith("calculate("):
        expr = action[10:-1]
        return str(eval(expr))
    elif action.startswith("lookup("):
        topic = action[7:-1].strip('"\'')
        return lookup_fact(topic)
    return f"Unknown action: {action}"

def run_react_agent(question: str, max_steps: int = 10) -> str:
    messages = [
        {"role": "system", "content": REACT_SYSTEM_PROMPT},
        {"role": "user", "content": question}
    ]
    
    for step in range(max_steps):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stop=["OBSERVATION:"]  # Stop before observation (we inject it)
        )
        
        assistant_text = response.choices[0].message.content
        thought, action_or_answer = parse_react_response(assistant_text)
        
        if thought is None:  # Final answer
            return action_or_answer
        
        # Execute action and add observation
        observation = execute_react_action(action_or_answer)
        
        messages.append({"role": "assistant", "content": assistant_text})
        messages.append({
            "role": "user",
            "content": f"OBSERVATION: {observation}"
        })
    
    return "Max steps reached without answer"
```

---

## Part 4: OpenAI o1 and o3 Reasoning Models

### Overview

OpenAI's o-series models represent a fundamental shift: instead of generating text immediately, these models **spend compute "thinking"** before responding. Training uses reinforcement learning to develop internal reasoning strategies.

Key differentiator: **test-time compute scaling** — more reasoning time = better performance on hard problems.

### o1 vs o3 Comparison

| Aspect | o1 (2024) | o3 (2025) | o4-mini (2025) |
|--------|-----------|-----------|----------------|
| Release | Sep 2024 | Apr 2025 | Apr 2025 |
| ARC-AGI | ~25% | 75.7% (low-compute) | 64% |
| AIME 2025 | 83.3% | 96.7% | 93.4% |
| Coding (SWE-bench) | 41.3% | 69.1% | 68.1% |
| Cost (input/output) | $15/$60 per 1M | $2.50/$10 per 1M | $1.10/$4.40 |
| Tool use | Limited | ✅ Full + computer use | ✅ Full |
| Context | 128k | 200k | 200k |

### o3 for Agents

```python
from openai import OpenAI
client = OpenAI()

# o3 with tools — model reasons about WHEN to use tools
response = client.chat.completions.create(
    model="o3",
    messages=[{
        "role": "user",
        "content": """Analyze the attached financial data and:
        1. Calculate YoY growth rates
        2. Identify the top 3 underperforming segments  
        3. Suggest specific cost reduction strategies
        
        Financial data: [... 50 pages of data ...]"""
    }],
    tools=financial_tools,
    # reasoning_effort: how much to think before responding
    # "low" = faster/cheaper, "high" = slower/more accurate
    # Default is "medium"
)

# o3 thinking is hidden (not visible in API response)
# But it significantly improves response quality
print(response.choices[0].message.content)
```

### Cost-Performance Trade-off with o-series

```python
# Smart routing: use o3 only for hard tasks
def select_model_for_task(task_complexity: str, requires_precision: bool) -> str:
    """
    Route to the right model based on task requirements.
    """
    if task_complexity == "hard" and requires_precision:
        return "o3"           # Best quality, $2.50/$10 per 1M tokens
    elif task_complexity == "hard":
        return "o4-mini"      # Near-o3 quality, cheaper
    elif task_complexity == "medium":
        return "gpt-4o"       # Strong general capability
    else:
        return "gpt-4o-mini"  # Fast and cheap for simple tasks

# Complexity classification using cheap model
def classify_complexity(task: str) -> tuple[str, bool]:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""Rate this task:
            1. Complexity: simple/medium/hard
            2. Requires precision: true/false (math, code, legal analysis)
            
            Task: {task}
            
            Respond as JSON: {{"complexity": "...", "precision": true/false}}"""
        }],
        response_format={"type": "json_object"}
    )
    data = json.loads(resp.choices[0].message.content)
    return data["complexity"], data["precision"]
```

### o3 Computer Use

o3 and o4-mini introduced the ability to use a computer like a human — taking screenshots, clicking, typing:

```python
# o3 with computer use (via Responses API)
response = client.responses.create(
    model="o3",
    tools=[{"type": "computer_use_preview"}],
    input=[{
        "role": "user",
        "content": "Go to GitHub, find the LangChain repository, and tell me how many open issues there are"
    }]
)

# Agent autonomously:
# 1. Opens browser
# 2. Navigates to GitHub
# 3. Searches for LangChain
# 4. Reads the issue count
# 5. Returns the answer
```

---

## Part 5: Claude Extended Thinking

### Overview

Anthropic introduced extended thinking with Claude 3.7 Sonnet (February 2025) — the first "hybrid reasoning model." Unlike o1/o3 where reasoning is hidden, Claude's extended thinking is **visible** to developers, enabling debugging and understanding of how Claude reached its conclusions.

Key innovation: **Interleaved thinking and tool use** — Claude can think, call a tool, think about the result, call another tool, and so on.

### Extended Thinking API

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # How many tokens Claude can use for thinking
    },
    messages=[{
        "role": "user",
        "content": """You are a senior software architect. Review this codebase 
        and identify all security vulnerabilities, rate their severity, and 
        suggest specific fixes with code examples.
        
        [1000 lines of code]"""
    }]
)

# Response contains both thinking and answer blocks
for block in response.content:
    if block.type == "thinking":
        print("=== Claude's reasoning ===")
        print(block.thinking[:500] + "...")  # Can be very long
    elif block.type == "text":
        print("=== Final answer ===")
        print(block.text)
```

### Interleaved Thinking + Tool Use

This is Claude's unique capability — reasoning **between** tool calls:

```python
# Claude can think → call tool → think about result → call another tool
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=20000,
    thinking={"type": "enabled", "budget_tokens": 15000},
    tools=[database_tool, analytics_tool, code_execution_tool],
    messages=[{
        "role": "user",
        "content": "Analyze our Q4 sales data and build a predictive model for Q1"
    }]
)

# Claude's response pattern:
# thinking: "I need to understand the data structure first..."
# tool_use: database_tool(query="SELECT * FROM sales WHERE quarter='Q4'")
# thinking: "The data shows seasonal patterns. Let me check for correlations..."  
# tool_use: analytics_tool(action="correlation_analysis", data=...)
# thinking: "Correlation between marketing spend and sales is 0.73. Now I can build the model..."
# tool_use: code_execution_tool(code="import sklearn...")
# text: "Based on my analysis, here is the Q1 forecast..."
```

### Extended Thinking Best Practices

```python
# 1. Use higher budget for complex tasks
complex_task = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=20000,
    thinking={"type": "enabled", "budget_tokens": 15000},  # High budget
    messages=[{"role": "user", "content": complex_problem}]
)

# 2. Use lower budget for moderate tasks (faster + cheaper)
moderate_task = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=8000,
    thinking={"type": "enabled", "budget_tokens": 2000},  # Conservative
    messages=[{"role": "user", "content": moderate_problem}]
)

# 3. Streaming extended thinking
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 8000},
    messages=[{"role": "user", "content": question}]
) as stream:
    for event in stream:
        if hasattr(event, 'type'):
            if event.type == "content_block_start":
                if hasattr(event.content_block, 'type'):
                    if event.content_block.type == "thinking":
                        print("[Thinking...]", end="", flush=True)
            elif event.type == "content_block_delta":
                if hasattr(event.delta, 'thinking'):
                    print(".", end="", flush=True)  # Show thinking progress
                elif hasattr(event.delta, 'text'):
                    print(event.delta.text, end="", flush=True)
```

### Extended Thinking Cost

```
Extended thinking adds thinking tokens to the cost:
- Budget: 10,000 thinking tokens
- Claude Sonnet 4 input price: $3.00/1M tokens
- Additional cost: 10,000 × $3.00/1M = $0.03 per call

But: Extended thinking often reduces tool calls needed, potentially lowering total cost.
For complex tasks requiring 5+ tool calls, extended thinking can REDUCE total cost
by making better decisions upfront.
```

---

## Part 6: Plan-and-Execute Agents

### Overview

Plan-and-Execute separates planning from execution — a planner creates a full task breakdown, then executor agents implement each step. This avoids replanning overhead and enables parallelism.

```
Standard ReAct:
Task → Think → Act → Observe → Think → Act → Observe → ...
(replanning at every step, sequential)

Plan-and-Execute:
Task → Planner → [Step 1, Step 2, Step 3, Step 4] → Execute in parallel
                                                      → Synthesize results
(plan once, execute efficiently)
```

### Implementation

```python
from openai import OpenAI
import asyncio
import json

client = OpenAI()

def plan_task(task: str) -> list[dict]:
    """Use a capable model to create an execution plan."""
    response = client.chat.completions.create(
        model="o3",  # Use reasoning model for planning
        messages=[{
            "role": "user",
            "content": f"""Create a detailed execution plan for this task.
            Break it into independent steps that can be executed in parallel where possible.
            
            Task: {task}
            
            Return JSON: {{
                "steps": [
                    {{
                        "id": 1,
                        "description": "...",
                        "tool": "search|analyze|write|calculate",
                        "depends_on": [],
                        "parallel_ok": true/false
                    }}
                ]
            }}"""
        }],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)["steps"]

async def execute_step(step: dict, context: dict) -> dict:
    """Execute a single plan step."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Cheaper model for execution
        messages=[{
            "role": "user",
            "content": f"""Execute this step in the task plan.
            
            Step: {step['description']}
            Tool to use: {step['tool']}
            Context from previous steps: {json.dumps(context)}
            
            Return JSON: {{"result": "...", "summary": "one-line summary"}}"""
        }],
        response_format={"type": "json_object"}
    )
    result = json.loads(response.choices[0].message.content)
    return {"step_id": step["id"], **result}

async def plan_and_execute(task: str) -> str:
    """Full plan-and-execute flow with parallel execution."""
    # 1. Create plan with reasoning model
    steps = plan_task(task)
    context = {}
    completed = {}
    
    # 2. Execute steps respecting dependencies
    remaining = list(steps)
    
    while remaining:
        # Find steps with satisfied dependencies
        ready = [
            s for s in remaining
            if all(dep in completed for dep in s.get("depends_on", []))
        ]
        
        if not ready:
            break  # Circular dependency or all done
        
        # Execute ready steps in parallel
        results = await asyncio.gather(*[
            execute_step(step, {
                str(dep_id): completed[dep_id] 
                for dep_id in step.get("depends_on", [])
            })
            for step in ready
        ])
        
        for result in results:
            completed[result["step_id"]] = result
            remaining = [s for s in remaining if s["id"] != result["step_id"]]
    
    # 3. Synthesize with capable model
    synthesis_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Synthesize these execution results into a final answer.
            
            Original task: {task}
            Execution results: {json.dumps(list(completed.values()), indent=2)}"""
        }]
    )
    return synthesis_response.choices[0].message.content
```

---

## Part 7: Reasoning in Multi-Agent Systems

### Orchestrator-Worker Pattern with Reasoning

```python
# Orchestrator uses reasoning model; workers use efficient models
@dataclass
class AgentSystem:
    orchestrator_model: str = "o3"      # Reasoning model for planning
    worker_model: str = "gpt-4o-mini"  # Fast model for execution
    
    async def solve(self, task: str) -> str:
        # 1. Orchestrator decomposes and plans
        plan = await self.orchestrate(task)
        
        # 2. Workers execute subtasks (potentially in parallel)
        results = await asyncio.gather(*[
            self.execute_subtask(subtask)
            for subtask in plan.subtasks
        ])
        
        # 3. Orchestrator synthesizes (with reasoning if needed)
        return await self.synthesize(task, plan, results)
    
    async def orchestrate(self, task: str) -> Plan:
        """High-quality planning with reasoning model."""
        # o3 thinks through the problem deeply
        response = await async_client.chat.completions.create(
            model=self.orchestrator_model,
            messages=[
                {"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT},
                {"role": "user", "content": task}
            ]
        )
        return parse_plan(response.choices[0].message.content)
    
    async def execute_subtask(self, subtask: str) -> str:
        """Fast execution with worker model."""
        response = await async_client.chat.completions.create(
            model=self.worker_model,
            messages=[{"role": "user", "content": subtask}]
        )
        return response.choices[0].message.content
```

---

## Part 8: Benchmarks and Comparisons

### Reasoning Model Performance (2025)

| Benchmark | GPT-4o | Claude Sonnet (CoT) | Claude Extended Thinking | o1 | o3 |
|-----------|--------|--------------------|--------------------------|----|-----|
| MATH-500 | 76.6% | 78.3% | 96.4% | 96.4% | 99.2% |
| GPQA Diamond | 53.6% | 65% | 75.7% | 78.3% | 87.7% |
| SWE-bench | 33% | 49% | 57% | 48.9% | 69.1% |
| ARC-AGI | ~5% | ~10% | 21% | 32% | 75.7% |
| AIME 2025 | 13% | 16% | — | 83.3% | 96.7% |

### When Extended Thinking Helps Most

Research findings (Anthropic, 2025):
- **Coding**: +23% improvement for complex algorithm design
- **Math**: +45% improvement on competition-level problems  
- **Scientific reasoning**: +31% improvement on GPQA
- **Simple Q&A**: <2% improvement (not worth the cost)
- **Factual lookup**: No improvement (reasoning doesn't create knowledge)

### Token Budget Impact on Quality

```
Extended thinking budget vs. performance (Claude Sonnet):

Budget      | GPQA Score | Relative Cost
------------|------------|---------------
0 (off)     | 65%        | 1×
1,000 tok   | 68%        | 1.3×
2,500 tok   | 71%        | 1.8×
5,000 tok   | 74%        | 2.5×
10,000 tok  | 75.7%      | 4×
20,000 tok  | 76.2%      | 7×

Diminishing returns after 10k tokens for most tasks.
Sweet spot: 5,000–10,000 tokens for complex reasoning.
```

---

## Part 9: Practical Implementation Guide

### Selecting the Right Reasoning Approach

```python
def select_reasoning_strategy(task: str, constraints: dict) -> dict:
    """
    Select the optimal reasoning strategy based on task characteristics.
    Returns configuration for the LLM call.
    """
    
    # Cost-constrained: use prompting techniques
    if constraints.get("max_cost_per_call_usd", float('inf')) < 0.05:
        return {
            "model": "gpt-4o-mini",
            "system": "Think step by step before answering.",
            "reasoning": "manual_cot"
        }
    
    # Time-constrained: avoid deep thinking
    if constraints.get("max_latency_seconds", float('inf')) < 5:
        return {
            "model": "claude-haiku-3-5",
            "thinking": None,
            "reasoning": "direct"
        }
    
    # Complex reasoning needed
    task_lower = task.lower()
    is_math = any(w in task_lower for w in ["calculate", "prove", "equation", "algorithm"])
    is_code = any(w in task_lower for w in ["code", "debug", "implement", "function"])
    is_plan = any(w in task_lower for w in ["plan", "strategy", "decide", "analyze"])
    
    if is_math or is_code:
        return {
            "model": "o3",
            "reasoning": "native_o3",
            "note": "Math/code tasks benefit most from o3 reasoning"
        }
    
    if is_plan and constraints.get("need_visible_reasoning"):
        return {
            "model": "claude-sonnet-4-6",
            "thinking": {"type": "enabled", "budget_tokens": 8000},
            "reasoning": "extended_thinking",
            "note": "Visible reasoning for audit/debug"
        }
    
    # Default: balanced
    return {
        "model": "gpt-4o",
        "reasoning": "standard",
        "note": "General tasks, good balance"
    }
```

---

## Pros and Cons

### Chain-of-Thought (Manual)
✅ Works with any model  
✅ No additional cost  
✅ Reasoning visible in output  
❌ Less effective than native reasoning  
❌ Can interfere with modern reasoning models  
❌ Prompt engineering overhead  

### Tree-of-Thought
✅ Explores multiple solution paths  
✅ Best for creative/planning tasks  
✅ Can be combined with any model  
❌ High token cost (multiple paths)  
❌ Complex to implement  
❌ Latency increases with branching factor  

### o3 / o-series Models
✅ State-of-the-art on hard reasoning tasks  
✅ Integrated reasoning (no prompt engineering)  
✅ Scales with more thinking budget  
❌ More expensive than standard models  
❌ Reasoning not visible (black box)  
❌ Slower than non-reasoning models  

### Claude Extended Thinking
✅ Reasoning visible for debugging/audit  
✅ Interleaved with tool use  
✅ Configurable budget  
✅ Hybrid: can disable for simple tasks  
❌ Larger token counts = higher cost  
❌ Output parsing more complex  

---

## Official Resources

- **Anthropic Extended Thinking Docs**: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
- **Claude Chain-of-Thought Guide**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-of-thought
- **OpenAI o3 Introduction**: https://openai.com/index/introducing-o3-and-o4-mini/
- **OpenAI Reasoning Models Guide**: https://platform.openai.com/docs/guides/reasoning
- **Tree of Thoughts Paper**: https://arxiv.org/abs/2305.10601
- **ReAct Paper**: https://arxiv.org/abs/2210.03629
- **Claude 3.7 Extended Thinking Announcement**: https://arstechnica.com/ai/2025/02/claude-3-7-sonnet-debuts-with-extended-thinking-to-tackle-complex-problems/
- **Prompting Guide (ToT)**: https://www.promptingguide.ai/techniques/tot
- **AI Index 2025 (Technical Performance)**: https://hai.stanford.edu/ai-index/2025-ai-index-report/technical-performance
- **o1 vs o3 Deep Dive**: https://skywork.ai/blog/llm/openai-o1-vs-o3-2025-reasoning-model-deep-dive/
