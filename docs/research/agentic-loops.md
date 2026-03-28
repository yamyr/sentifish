# Agentic Loops in Coding Harnesses: ReAct, Plan+Execute, Reflexion

> Research compiled: March 2026  
> Topics: ReAct, Plan+Execute, Reflexion patterns, implementations, when to use each, how Claude Code and SWE-agent implement loops

---

## Overview

An "agentic loop" is the core control flow that transforms a static language model into a dynamic agent capable of accomplishing multi-step tasks. The loop determines how the agent reasons, what actions it takes, how it processes feedback, and when it decides a task is complete.

Different loop architectures make very different tradeoffs between:
- **Speed vs quality** (fast single-pass vs slow iterative refinement)
- **Flexibility vs predictability** (open-ended reasoning vs rigid plans)
- **Token efficiency vs robustness** (minimal context vs full self-reflection)

The three canonical patterns — **ReAct**, **Plan+Execute**, and **Reflexion** — are not mutually exclusive. Modern production agents, including Claude Code and SWE-agent, combine multiple patterns depending on task phase and complexity.

---

## Pattern 1: ReAct (Reasoning + Acting)

### Origins

ReAct was introduced by Yao et al. (2022) in the paper *"ReAct: Synergizing Reasoning and Acting in Language Models"*. It was one of the first formal frameworks to describe the LLM-as-agent pattern.

### Core Concept

ReAct interleaves **reasoning traces** (Thought) with **actions** in a single continuous loop:

```
Thought → Action → Observation → Thought → Action → Observation → ... → Final Answer
```

The key insight: generating explicit reasoning before each action dramatically improves performance compared to acting without reasoning. The reasoning trace:
- Tracks current state
- Plans the next step
- Handles unexpected observations
- Avoids repeating failed approaches

### The ReAct Loop

```python
def react_loop(task, tools, llm, max_steps=20):
    history = [{"role": "user", "content": task}]
    
    for step in range(max_steps):
        # Generate Thought + Action
        response = llm.complete(
            system="You are an agent. Think step by step. Use tools.",
            messages=history
        )
        
        thought = response.thought
        action = response.action
        
        if action.type == "final_answer":
            return action.content
        
        # Execute the action
        observation = tools.execute(action)
        
        # Add to history
        history.append({"role": "assistant", "content": f"Thought: {thought}\nAction: {action}"})
        history.append({"role": "tool", "content": f"Observation: {observation}"})
    
    return "Max steps reached"
```

### In Practice: Claude Code's ReAct Loop

Claude Code implements a close variant of ReAct:

```
1. User request arrives
2. Claude reasons about what to do (internal Thought)
3. Claude calls a tool (Action): Read, Edit, Bash, Grep, etc.
4. Tool result returns (Observation)
5. Claude reasons about the observation
6. Claude calls next tool
7. ... repeats ...
8. Claude synthesizes final response
```

Concrete example from PromptLayer's analysis:
> "A typical execution chain might look like this: Claude receives a request to fix a bug → uses Grep to search for relevant code → calls View to read specific files → applies Edit to modify the code → runs Bash to execute tests → formulates a final answer."

### ReAct Strengths
- **Flexible**: No upfront planning required; adapts to surprises
- **Observable**: Every step visible to user (transparency)
- **Simple**: Easy to implement and debug
- **Handles complexity**: Reasoning traces catch errors before they compound

### ReAct Weaknesses
- **Context accumulation**: Each step adds to context window
- **Suboptimal planning**: No global view; can get stuck in local optima
- **Repetition risk**: Without explicit state tracking, may revisit explored paths
- **No self-correction**: Errors in reasoning cascade forward

### When to Use ReAct
- Single-agent tasks with unclear scope
- Exploratory tasks (debugging, investigation)
- Tasks where the path to solution isn't known in advance
- Short to medium complexity tasks (< 30 tool calls)

---

## Pattern 2: Plan+Execute (Hierarchical Planning)

### Core Concept

Plan+Execute separates planning from execution into two distinct phases:

**Phase 1 — Planning:**
The agent generates a structured, multi-step plan before taking any actions. This plan might be:
- A numbered list of steps
- A tree of subtasks
- A dependency graph of operations

**Phase 2 — Execution:**
The agent executes each plan step sequentially (or in parallel), using tools as needed.

```
Plan:
  1. Identify the bug location
  2. Read the failing test to understand expected behavior  
  3. Read the buggy function
  4. Formulate a fix
  5. Apply the fix
  6. Run tests to verify

Execute:
  Step 1: grep -r "NullPointerException" logs/
  → Found in auth/handlers.py line 47
  
  Step 2: cat tests/test_auth.py -n 100-120
  → Test expects user.id to be int, not None
  
  ...and so on
```

### Plan+Execute Architecture

```python
def plan_and_execute(task, tools, llm):
    # Phase 1: Planning
    plan = llm.complete(f"""
    Create a detailed step-by-step plan to accomplish:
    {task}
    
    Format as numbered list. Be specific about what tools to use.
    """)
    
    steps = parse_steps(plan)
    results = []
    
    # Phase 2: Execution
    for i, step in enumerate(steps):
        context = {
            "original_task": task,
            "completed_steps": results,
            "current_step": step,
            "remaining_steps": steps[i+1:]
        }
        
        # Execute with ReAct sub-loop if needed
        result = execute_step(step, context, tools, llm)
        results.append(result)
        
        # Re-plan if step failed or revealed new information
        if result.requires_replan:
            steps = replan(task, steps, results, llm)
    
    return synthesize_results(results, llm)
```

### Dynamic Replanning

Modern Plan+Execute implementations support **replanning** — when execution reveals unexpected information, the plan is revised:

```
Original Plan:
  1. Find bug in auth module ✓ (found: race condition in login handler)
  2. Fix the bug ← currently here
  3. Write test for the fix
  4. Submit PR

Replan triggered (bug harder than expected):
  1. Find bug in auth module ✓ 
  2a. Understand asyncio lifecycle in auth module  ← new step
  2b. Implement mutex locking ← revised step 2
  3. Write test for the fix
  4. Submit PR
```

### Plan+Execute in SWE-agent

SWE-agent's original architecture (before mini-SWE-agent) was essentially Plan+Execute:

1. **Planning prompt**: Agent reads the issue and formulates a high-level approach
2. **File exploration**: Systematic navigation to relevant code
3. **Implementation**: Focused code modification
4. **Verification**: Run tests, check results

The ACI (Agent-Computer Interface) tools were designed to support this structured approach:
- `find_file`: Locate relevant files
- `open`: Read a specific file with pagination
- `edit`: Apply targeted edits
- `bash`: Run commands for verification

### Plan+Execute Strengths
- **Global optimization**: Can avoid dead ends with upfront reasoning
- **Parallelizable**: Independent steps can run concurrently
- **Predictable**: User can review/modify plan before execution
- **Efficient**: Less exploration, more direct execution

### Plan+Execute Weaknesses
- **Brittle plans**: Unexpected observations can invalidate the entire plan
- **Upfront cost**: Planning phase consumes tokens before any work done
- **Overconstrained**: Rigid plans may miss better solutions discovered during execution
- **Replan complexity**: Detecting when to replan is itself hard

### When to Use Plan+Execute
- Well-defined tasks with clear specifications
- Large tasks that benefit from parallelization
- When human oversight of the plan is needed before execution
- Tasks with strong dependencies between steps

---

## Pattern 3: Reflexion (Self-Reflective Learning)

### Origins

Reflexion was introduced by Shinn et al. (2023, NeurIPS) in *"Reflexion: Language Agents with Verbal Reinforcement Learning"*. It addresses a fundamental limitation of ReAct and Plan+Execute: neither learns from failure across attempts.

### Core Concept

Reflexion adds a **self-reflection layer** between trial episodes. After each failed attempt, the agent generates a verbal reflection on what went wrong and stores it in an **episodic memory buffer**. Subsequent attempts benefit from these stored reflections.

```
Episode 1:
  Task → React Loop → Failure
  ↓
  Reflect: "I searched for the bug in the wrong module. 
            The error says 'auth' but the actual bug is in 
            the session middleware that wraps auth."
  ↓
  Store reflection in memory buffer

Episode 2:
  Task + [reflection from ep1] → React Loop → Failure
  ↓
  Reflect: "I fixed the middleware but forgot to handle the 
            async edge case. Need to await the session lookup."
  ↓
  Store reflection in memory buffer

Episode 3:
  Task + [reflections from ep1, ep2] → React Loop → Success ✓
```

### The Reflexion Architecture

```python
def reflexion_loop(task, tools, llm, max_trials=5):
    reflections = []  # Long-term memory buffer
    
    for trial in range(max_trials):
        # Build context with accumulated reflections
        reflection_context = "\n".join([
            f"Previous attempt {i+1} reflection:\n{r}" 
            for i, r in enumerate(reflections)
        ])
        
        # Run an episode (ReAct loop)
        result = react_loop(
            task=task,
            tools=tools,
            llm=llm,
            context_prefix=reflection_context
        )
        
        if result.success:
            return result
        
        # Generate self-reflection on failure
        reflection = llm.complete(f"""
        Task: {task}
        
        What I tried: {result.trajectory}
        
        Why it failed: {result.error}
        
        What should I do differently next time?
        Be specific about the mistake and the correction.
        """)
        
        reflections.append(reflection)
    
    return "Max trials reached"
```

### Reflexion for Coding Tasks

Reflexion showed impressive results on coding benchmarks:

**HumanEval results (original paper):**
- GPT-4 baseline: 67.0%  
- GPT-4 + Reflexion (4 trials): 91.0%

The gains come from the agent learning to:
- Recognize similar error patterns across trials
- Avoid approaches that failed previously
- Build on partial solutions from failed attempts

**Code-specific reflection patterns:**
- "My solution failed because I forgot to handle the empty list edge case"
- "The test expects a list sorted by value descending, not ascending"
- "I used the wrong API — need pandas.merge not pandas.join"

### Reflexion Memory System

The paper distinguishes:
- **Short-term memory**: Trajectory of the current episode (ReAct loop history)
- **Long-term memory**: Distilled reflections stored across episodes

This maps directly to the memory patterns discussed in `agent-memory-patterns.md`:
- Short-term = context window
- Long-term = episodic memory store (file or vector database)

### Reflexion Weaknesses
- **Multi-call cost**: Multiple complete attempts consume significant tokens
- **Context growth**: Accumulated reflections grow the context
- **Reflection quality**: If the model generates poor reflections, subsequent trials don't improve
- **Not parallelizable**: Must run sequentially (each trial informs the next)

### When to Use Reflexion
- Tasks with clear success/failure signals (test pass/fail)
- When individual attempts have a high failure rate
- When learning from specific mistakes matters
- Complex debugging scenarios

---

## Pattern 4: Tree of Thought (ToT)

### Concept

Tree of Thought (Yao et al., 2023) extends ReAct by exploring multiple reasoning paths simultaneously:

```
Task
├── Approach A: Fix bug in handler
│   ├── A1: Add null check ← evaluation: promising (7/10)
│   └── A2: Restructure handler ← evaluation: risky (4/10)
└── Approach B: Fix bug in middleware  
    ├── B1: Add timeout ← evaluation: worth exploring (6/10)
    └── B2: Disable middleware ← evaluation: bad idea (2/10)

Best path: Approach A → A1 (highest eval score)
```

### Characteristics
- **Exploration**: Considers multiple approaches before committing
- **Self-evaluation**: Agent scores each branch before exploring
- **Backtracking**: Can abandon dead ends and return to earlier states
- **Token-expensive**: Exploring multiple branches costs 3-10× ReAct

### Use Cases in Coding
- Architecture decisions with multiple valid approaches
- Debugging complex issues with multiple possible root causes
- Code generation when multiple algorithms are valid

---

## How Claude Code Implements Loops

### The Master Agent Loop

From Anthropic's documentation and community analysis (PromptLayer, Medium):

```
Claude Code Agent Loop:

Input: User message / task

1. UNDERSTAND
   - Parse task requirements
   - Check CLAUDE.md for project context
   - Identify relevant files/modules

2. EXPLORE (ReAct sub-loop)
   - Grep/Glob for relevant code
   - View files in relevant sections
   - Run diagnostic commands

3. PLAN (implicit, as part of reasoning)
   - Internal reasoning about approach
   - Not explicitly output (unless /think enabled)

4. IMPLEMENT (tool call sequence)
   - Edit → Bash (test) → Edit (fix) → Bash (test) → ...
   - Loop until tests pass or task complete

5. VERIFY
   - Run full test suite
   - Check for regressions
   - Lint/format if appropriate

6. RESPOND
   - Summarize what was done
   - Note any remaining issues
   - Suggest follow-up actions
```

### Multi-Agent Subloops

Claude Code supports spawning subagents for parallel work:

```python
# Claude Code's internal subagent pattern:
# Main agent spawns subagents for:
# - Code exploration (read-only context)
# - Parallel file modifications
# - Independent test runs

result = spawn_subagent(
    task="Explore auth module and return summary of token validation flow",
    tools=["Read", "Grep", "Glob"],  # Read-only tools
    context_limit=50000
)

# Main agent receives compact summary
# without bloating its own context
```

### Permission Gating

Claude Code's loop includes permission checkpoints that pause execution for human approval:

```
Normal flow: Think → Act → Observe → repeat
Gated flow:  Think → [APPROVAL NEEDED: will modify database schema] 
                 → User approves → Act → Observe → repeat
```

This transforms pure ReAct into a **human-in-the-loop** variant where high-risk actions require explicit approval.

---

## How SWE-agent Implements Loops

### Original SWE-agent (2024)

The original SWE-agent used an elaborate custom ACI (Agent-Computer Interface) with specialized tools:

```
SWE-agent Loop:
  1. Read issue description
  2. find_file() to locate relevant source
  3. open() to read with windowed view
  4. search_file() / search_dir() for patterns
  5. edit() to apply targeted changes
  6. python_runner() to verify changes
  7. submit() when done
```

The ACI design philosophy: provide tools that match how a human developer would work — open a file, scroll through it, search for patterns, make targeted edits.

### mini-SWE-agent (2025) — Radical Simplification

mini-SWE-agent abandoned the elaborate ACI for a single bash tool:

```python
# The entire mini-SWE-agent system prompt:
SYSTEM = """You are an expert software engineer solving a GitHub issue.
You have access to a bash tool. Use it to:
1. Explore the repository structure
2. Find the relevant code
3. Implement the fix
4. Verify with tests

When done, use the submit tool."""

# The loop is just:
while not done:
    response = claude.complete(messages)
    if response.tool_use:
        output = bash.execute(response.command)
        messages.append(tool_result(output))
```

**Result**: >74% on SWE-bench Verified with 100 lines of code.

**Key insight**: Modern LLMs are smart enough to navigate a codebase using just bash. The elaborate tooling of original SWE-agent was compensating for earlier, less capable models.

---

## Combining Patterns

Modern production agents combine multiple patterns:

### Claude Code's Hybrid Approach

```
Phase: Exploration
  Pattern: ReAct (flexible, exploratory)
  Tools: Read, Grep, Glob
  Duration: Until relevant code is found

Phase: Implementation
  Pattern: Plan+Execute (structured, parallel-ready)
  Tools: Edit, Bash
  Duration: Until tests pass

Phase: Verification  
  Pattern: Reflexion-lite (retry on test failure)
  Tools: Bash (test runner)
  Duration: Until 0 failures or max retries
```

### Devin's Approach

Devin (Cognition AI) uses a more elaborate planning architecture:
1. **Strategic planning**: High-level task decomposition
2. **Tactical execution**: ReAct loop within each subtask
3. **Error recovery**: Reflexion-style retry on unexpected failures
4. **Human collaboration**: Pause for clarification at ambiguity points

---

## Comparison Table

| Pattern | Token Cost | Adaptability | Learning | Best For |
|---------|-----------|--------------|---------|----------|
| ReAct | Low | High | None | Exploratory tasks |
| Plan+Execute | Medium | Medium | None | Well-defined tasks |
| Reflexion | High | Medium | High | Repeated failure tasks |
| Tree of Thought | Very High | Very High | None | Multi-option decisions |
| Hybrid | Medium | High | Medium | Production coding agents |

---

## Implementation Frameworks

### LangGraph (LangChain)

LangGraph provides a graph-based runtime for agent loops:

```python
from langgraph.graph import StateGraph

builder = StateGraph(AgentState)
builder.add_node("plan", plan_node)
builder.add_node("execute", execute_node)
builder.add_node("reflect", reflect_node)
builder.add_edge("plan", "execute")
builder.add_conditional_edges(
    "execute",
    should_reflect,
    {"reflect": "reflect", "done": END}
)
builder.add_edge("reflect", "execute")

graph = builder.compile()
```

### Claude Agent SDK

Anthropic's Agent SDK implements the ReAct loop natively:

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Fix the failing test in auth module",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Bash", "Grep"],
        setting_sources=["project"],  # Load CLAUDE.md
    )
):
    if isinstance(message, ResultMessage):
        print(message.result)
```

### OpenAI Agents SDK

```python
from openai import OpenAI

client = OpenAI()
run = client.beta.threads.runs.create_and_poll(
    thread_id=thread.id,
    assistant_id=assistant.id,
    instructions="Fix the bug described in the issue"
)

# Handles the ReAct loop internally
# with tool calls and results
```

---

## Failure Modes and Mitigations

### Infinite Loop

**Problem**: Agent keeps trying the same approach in a loop.
**Mitigation**: 
- Max step limit
- Detect repeated tool calls with same parameters
- Hash recent actions; refuse duplicates

### Context Explosion

**Problem**: Long ReAct loops fill the context window.
**Mitigation**:
- Periodic summarization of early history
- Subagents for exploration phases
- Hard token budget per phase

### Premature Termination

**Problem**: Agent incorrectly decides the task is done.
**Mitigation**:
- Require successful test run before `done`
- Explicit success criteria in task description
- Verification subagent with separate context

### Hallucinated Observations

**Problem**: Agent fabricates tool outputs rather than calling tools.
**Mitigation**:
- Strict tool-use format enforcement
- Sandbox validation (tool calls must go through real executor)
- Log all tool calls for audit

---

## Sources

- ReAct paper: https://arxiv.org/abs/2210.03629 (Yao et al., 2022)
- Reflexion paper: https://arxiv.org/abs/2303.11366 (NeurIPS 2023)
- Reflexion GitHub: https://github.com/noahshinn/reflexion
- Reflexion Medium guide: https://medium.com/@vi.ha.engr/building-a-self-correcting-ai-a-deep-dive-into-the-reflexion-agent-with-langchain-and-langgraph-ae2b1ddb8c3b
- SWE-agent architecture: https://swe-agent.com/latest/background/architecture/
- SWE-agent paper: https://arxiv.org/pdf/2405.15793
- mini-SWE-agent: https://github.com/SWE-agent/mini-swe-agent
- Claude Code how it works: https://code.claude.com/docs/en/how-claude-code-works
- Claude Agent SDK loop: https://platform.claude.com/docs/en/agent-sdk/agent-loop
- Claude Code agentic loop analysis: https://blog.promptlayer.com/claude-code-behind-the-scenes-of-the-master-agent-loop/
- ReAct prompting guide: https://www.promptingguide.ai/techniques/react
- Plan-and-Execute: https://www.telusdigital.com/insights/data-and-ai/article/building-ai-agents-with-plan-and-execute
- Agentic reasoning patterns: https://servicesground.com/blog/agentic-reasoning-patterns/
