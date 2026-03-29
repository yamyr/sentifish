# Agentic Loops: ReAct, Plan+Execute, Reflexion, and Beyond

> Deep research note covering the major loop patterns used in coding agents — how each works, when to use it, implementation in LangChain/LangGraph/SWE-agent/Claude Code, self-reflection and self-correction, and loop termination conditions.

---

## 1. What Is an Agentic Loop?

An **agentic loop** is the repeated execution cycle that drives an agent from a goal to a result. Without a loop, an LLM makes one prediction and stops. With a loop, it can act, observe consequences, reason, act again — iteratively closing in on the goal.

The simplest possible loop:

```python
def agent_loop(goal: str, tools: list, max_iterations: int = 50) -> str:
    messages = [{"role": "user", "content": goal}]
    
    for _ in range(max_iterations):
        response = llm.complete(messages, tools=tools)
        messages.append({"role": "assistant", "content": response})
        
        if response.stop_reason == "end_turn":
            return response.text
        
        # Execute tools
        tool_results = execute_tools(response.tool_calls)
        messages.append({"role": "user", "content": tool_results})
    
    return "Max iterations reached"
```

From the MIT Missing Semester lecture:
> "For tool-calling agents, the harness interprets certain LLM outputs as requests to invoke a tool, and the harness supplies the results of the tool call back to the model as part of the prompt string (so LLM inference runs again every time there is a tool call/response). The core concepts in tool-calling agents can be implemented in 200 lines of code."

The loop pattern chosen profoundly affects how the agent reasons, recovers from errors, and knows when to stop.

---

## 2. ReAct: Reasoning + Acting

**Paper**: "Synergizing Reasoning and Acting in Language Models" (Yao et al., ICLR 2023, arXiv:2210.03629)

### Core Idea

Interleave **reasoning traces** (Thought) with **actions** (Act) and **observations** (Obs). The model alternates between thinking out loud and taking actions.

```
Thought: I need to find the authentication function. Let me search for it.
Action: bash("grep -r 'def authenticate' src/")
Observation: src/auth/handler.py:142: def authenticate(user, password):

Thought: Found it. Now let me read the full function to understand it.
Action: text_editor(view, path="src/auth/handler.py", start_line=142, end_line=165)
Observation: [function code]

Thought: The function uses SHA-1 which is deprecated. I should replace with bcrypt.
Action: text_editor(str_replace, path="src/auth/handler.py", ...)
Observation: Edit applied successfully.

Thought: Let me run the tests to verify nothing broke.
Action: bash("pytest tests/test_auth.py -v")
Observation: 12 passed, 0 failed.

Thought: All tests pass. The fix is complete.
```

### Why ReAct Works

From the paper abstract:
> "Reasoning traces help the model induce, track, and update action plans as well as handle exceptions, while actions allow it to interface with external sources to gather additional information."

Without the Thought step, actions are blind. Without the Act step, reasoning is sterile. The interleaving creates a virtuous cycle where each thought is grounded in observable reality.

**Key results**: On HotpotQA and Fever, ReAct overcomes hallucination issues by interacting with Wikipedia. On ALFWorld and WebShop (interactive decision-making), ReAct outperforms imitation and RL methods by 34% and 10% respectively.

### Implementation in Claude Code

Claude Code natively implements ReAct. Every tool call is preceded by model reasoning (though the user can choose whether to show the thinking). The Thought steps show as model text before each tool invocation.

### LangChain ReAct Agent

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub

# Pull the ReAct prompt template
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    max_iterations=25,
    handle_parsing_errors=True,
)

result = agent_executor.invoke({"input": "Fix the authentication bug in src/auth/handler.py"})
```

The `hwchase17/react` prompt enforces the Thought/Action/Observation format.

---

## 3. Plan + Execute

**Concept**: Separate planning (what to do) from execution (doing it). A planner LLM creates a high-level task list; an executor LLM (often a different model) works through each task.

```
[PLANNER] ──▶ [TASK LIST] ──▶ [EXECUTOR] ──▶ [RESULT]
                   ↑                               │
                   └──── re-plan if needed ────────┘
```

### Two-Phase Approach

```python
# Phase 1: Plan
planner_response = opus_llm.complete(f"""
You are a senior software engineer. Create a step-by-step plan to:
{task_description}

Output a numbered list of discrete, executable steps.
Each step should be independently verifiable.
""")

plan = parse_steps(planner_response)

# Phase 2: Execute
for step in plan:
    executor_response = haiku_llm.complete(
        f"Execute this step: {step}\n\nContext: {current_state}",
        tools=tools
    )
    current_state.update(executor_response.result)
    
    # Check if re-planning needed
    if needs_replan(executor_response, step):
        remaining_plan = replan(planner_llm, current_state, remaining_steps)
```

### Benefits vs. ReAct

| Dimension | ReAct | Plan+Execute |
|-----------|-------|-------------|
| Upfront clarity | Low (emergent) | High (explicit plan) |
| Adaptability | High (on-the-fly) | Medium (re-planning) |
| Cost | Lower (Thought is cheap) | Higher (two LLM calls) |
| Parallelism | Hard | Easy (independent steps) |
| Debuggability | Trace the thoughts | Inspect the plan |
| Best for | Exploratory tasks | Well-defined projects |

### LangGraph Plan+Execute

```python
from langgraph.graph import StateGraph, END

class PlanExecuteState(TypedDict):
    input: str
    plan: list[str]
    past_steps: list[tuple[str, str]]  # (step, result)
    response: str

async def plan_step(state: PlanExecuteState):
    plan = await planner.ainvoke({"messages": [("user", state["input"])]})
    return {"plan": plan.steps}

async def execute_step(state: PlanExecuteState):
    task = state["plan"][0]
    agent_response = await agent_executor.ainvoke({"input": task})
    return {
        "past_steps": state["past_steps"] + [(task, agent_response["output"])],
        "plan": state["plan"][1:],  # Remove completed step
    }

async def should_end(state: PlanExecuteState):
    if not state["plan"]:
        return "respond"
    return "agent"  # Continue executing

builder = StateGraph(PlanExecuteState)
builder.add_node("planner", plan_step)
builder.add_node("agent", execute_step)
builder.add_node("respond", generate_response)
builder.add_conditional_edges("agent", should_end)
```

---

## 4. Reflexion: Verbal Reinforcement Learning

**Paper**: "Reflexion: Language Agents with Verbal Reinforcement Learning" (Shinn et al., NeurIPS 2023, arXiv:2303.11366)

### Core Idea

Instead of updating model weights from feedback (traditional RL), Reflexion agents **reflect verbally** on failures and store those reflections in memory for future attempts.

```
Attempt 1:
  Action: Run tests
  Observation: 3 failures
  Reflection: "I forgot to handle the null case in the username field.
               In future attempts, always check for null before hashing."

Attempt 2 (with reflection in context):
  [Reflection from Attempt 1 injected as memory]
  Action: Check username for null before hashing
  Observation: 0 failures
```

### Why This Works

From the abstract:
> "Reflexion agents verbally reflect on task feedback signals, then maintain their own reflective text in an episodic memory buffer to induce better decision-making in subsequent trials. Reflexion achieves a 91% pass@1 accuracy on the HumanEval coding benchmark, surpassing the previous state-of-the-art GPT-4 that achieves 80%."

The key insight: **linguistic self-feedback is a cheap proxy for gradient updates**. The model can't update its own weights, but it can write down what went wrong and use that next time.

### Implementation

```python
class ReflexionAgent:
    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts
        self.reflections = []
    
    def build_context(self, task: str) -> str:
        reflection_text = ""
        if self.reflections:
            reflection_text = "\n\nPrevious attempts and learnings:\n"
            for i, r in enumerate(self.reflections, 1):
                reflection_text += f"\nAttempt {i} reflection:\n{r}\n"
        
        return f"{task}{reflection_text}"
    
    async def attempt(self, task: str) -> tuple[str, bool]:
        context = self.build_context(task)
        result = await agent_executor.ainvoke({"input": context})
        success = evaluate_result(result)
        return result, success
    
    async def reflect(self, task: str, result: str, failure_reason: str) -> str:
        reflection_prompt = f"""
        Task: {task}
        
        What you tried: {result}
        
        Why it failed: {failure_reason}
        
        In a few sentences, reflect on what went wrong and how to approach 
        this differently in the next attempt. Be specific and actionable.
        """
        return await llm.ainvoke(reflection_prompt)
    
    async def run(self, task: str) -> str:
        for attempt_num in range(self.max_attempts):
            result, success = await self.attempt(task)
            
            if success:
                return result
            
            # Failure: reflect before next attempt
            failure_reason = analyze_failure(result)
            reflection = await self.reflect(task, result, failure_reason)
            self.reflections.append(reflection)
        
        return f"Failed after {self.max_attempts} attempts. Last attempt: {result}"
```

### Reflexion in LIVE-SWE-AGENT

The LIVE-SWE-AGENT (arXiv:2511.13646) extends this pattern to **tool synthesis**: instead of just reflecting on what went wrong, the agent can:
1. Create new custom tools (Python scripts) on the fly
2. Reflect on whether a new tool would accelerate progress
3. Add the custom tool to its action space for future use

> "A lightweight step-reflection prompt repeatedly asks the agent whether creating or revising a tool would accelerate progress, thereby turning tooling into a first-class decision alongside ordinary actions."

---

## 5. MCTS / Tree of Thoughts

**Tree of Thoughts** (ToT) treats each step as a tree branching. Rather than committing to one action, the agent explores multiple branches and chooses the best path.

```
                Goal
               /    \
           Action A  Action B
          /    \         \
       A1      A2         B1
      (✓)    (dead end)  (✓)
```

For coding agents, this means:
- Generate multiple candidate implementations
- Evaluate each (run tests, check quality)
- Keep the best one

This is expensive but produces higher-quality results on hard problems.

```python
async def tree_of_thoughts(problem: str, branches: int = 3) -> str:
    # Generate candidate approaches
    candidates = await asyncio.gather(*[
        llm.ainvoke(f"Suggest approach #{i+1} for: {problem}")
        for i in range(branches)
    ])
    
    # Evaluate each
    scores = await asyncio.gather(*[
        evaluate_approach(problem, candidate)
        for candidate in candidates
    ])
    
    # Execute the best
    best_approach = candidates[scores.index(max(scores))]
    return await execute_approach(best_approach)
```

---

## 6. Self-Reflection and Self-Correction Patterns

### Pattern 1: Test-Driven Self-Correction

The most common coding-specific self-correction loop:

```
Write code → Run tests → Failed? → Read failure → Fix code → Run tests → ...
```

The tests act as an objective ground truth. The agent doesn't need to guess whether it's right — the tests tell it. This is why "give the agent the ability to run tests" is the single most impactful capability addition for coding agents.

From MIT Missing Semester:
> "Coding models are particularly effective when you can get them in a feedback loop, so try to set things up so that the model can run the failing check directly, which will let it iterate autonomously."

### Pattern 2: Critic Agent

A separate agent reviews the output of the first agent:

```python
# Producer agent
code = await coder_agent.run("Implement the login function")

# Critic agent
critique = await critic_agent.run(f"""
Review this code for:
1. Security vulnerabilities
2. Edge cases not handled
3. Performance issues
4. Missing error handling

Code:
{code}

Output specific issues found.
""")

# If issues found, revise
if critique.has_issues:
    improved_code = await coder_agent.run(
        f"Revise this code based on this critique:\n{critique}\n\nOriginal:\n{code}"
    )
```

AutoGen uses this pattern as its "reflection" design pattern — one agent generates, another critiques, the first revises.

### Pattern 3: Constitutional Self-Critique

The agent evaluates its own output against a set of principles before returning it:

```python
CODING_PRINCIPLES = """
1. All functions must have type annotations
2. No bare except clauses
3. All public functions must have docstrings
4. No hardcoded credentials
5. Async functions must use proper await patterns
"""

response = await llm.ainvoke(f"""
You wrote this code:
{code}

Evaluate it against these principles:
{CODING_PRINCIPLES}

List any violations found, then produce a corrected version.
""")
```

---

## 7. Loop Termination Conditions

Every loop needs a termination condition. The wrong condition causes:
- **Premature termination**: Agent stops before the task is done
- **Infinite loops**: Agent keeps going when it should stop
- **Goal drift**: Agent terminates with the wrong output

### Objective Termination Conditions (Best)

```python
def should_terminate(state: AgentState) -> bool:
    # Tests pass
    if state["test_results"] and all_tests_pass(state["test_results"]):
        return True
    
    # CI is green
    if state["ci_status"] == "green":
        return True
    
    # Explicit completion signal from model
    if state["last_response"].get("task_complete") == True:
        return True
    
    # Max iterations guard
    if state["iteration"] >= state["max_iterations"]:
        return True  # Give up
    
    return False
```

### Safety Guards

```python
MAX_ITERATIONS = 50          # Never exceed this
MAX_BASH_COMMANDS = 200      # Prevent accidental loops
MAX_FILE_EDITS = 100         # Prevent runaway file modification
TIMEOUT_SECONDS = 3600       # 1 hour hard cap

# Tool-level safeguards
if state["bash_call_count"] > MAX_BASH_COMMANDS:
    raise AgentSafetyError("Too many bash commands")

# Cost safeguard
if state["total_tokens"] > 5_000_000:
    raise AgentCostError("Token budget exceeded")
```

### Anthropic's Tool-Use Loop Termination

From the Anthropic tool-use docs:
> "The loop exits on any other stop reason: `end_turn`, `max_tokens`, `stop_sequence`, or `refusal`. `end_turn` = Claude produced a final answer; `max_tokens` = ran out of output budget; `stop_sequence` = hit a custom stop signal; `refusal` = model declined to continue."

For server-side tools: if `stop_reason == "pause_turn"`, the work isn't finished — re-send the conversation to let the model continue.

### CrewAI Termination

CrewAI agents have:
- `max_iter` (default 20): Stop after this many reasoning iterations
- `max_execution_time`: Wall-clock timeout in seconds
- `max_retry_limit` (default 2): Retries on error before giving best answer

### Claude Code Termination

Claude Code uses:
- Natural completion (model says it's done)
- User interruption
- Max context limit (spawns subagent or asks user how to proceed)
- Error threshold (repeated failures → ask user for guidance)

---

## 8. Comparison of Loop Patterns

| Pattern | Best For | Weakness | Typical Cost |
|---------|---------|----------|--------------|
| ReAct | Exploratory tasks, debugging | Can get stuck in local optima | Medium |
| Plan+Execute | Large structured projects | Rigidity if plan is wrong | Higher (2x LLM calls) |
| Reflexion | Tasks with objective metrics | Slow (multiple full attempts) | High (N full runs) |
| Tree of Thoughts | Hard optimization problems | Very expensive | Very high (N×M calls) |
| Test-driven | Code generation with tests | Requires runnable test env | Low-Medium |
| Critic+Revise | Quality-sensitive outputs | Extra LLM call per output | Medium |

---

## 9. The Role of "Thinking" in Loops

Extended thinking (Claude's "thinking" feature) changes the loop dynamic:

```python
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=8000,
    thinking={
        "type": "enabled",
        "budget_tokens": 5000  # Tokens reserved for internal reasoning
    },
    tools=tools,
    messages=messages
)
```

With extended thinking, the ReAct "Thought" step becomes richer — the model can explore multiple branches internally before committing to an action. This reduces the number of external iterations needed (fewer tool calls) but increases the cost per iteration.

For difficult tasks (complex bugs, architecture decisions), the investment in thinking tokens often produces better decisions that avoid dead-end paths.

---

## Sources

- arXiv: ReAct (2210.03629) — https://arxiv.org/abs/2210.03629
- arXiv: Reflexion (2303.11366) — https://arxiv.org/abs/2303.11366
- arXiv: LIVE-SWE-AGENT (2511.13646) — https://arxiv.org/pdf/2511.13646
- Anthropic: How tool use works (agentic loop) — https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
- MIT Missing Semester: Agentic Coding — https://missing.csail.mit.edu/2026/agentic-coding/
- AutoGen Design Patterns — https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/intro.html
- CrewAI Agents docs — https://docs.crewai.com/concepts/agents
- arXiv: AI Agentic Programming Survey (2508.11126) — https://arxiv.org/html/2508.11126v1
