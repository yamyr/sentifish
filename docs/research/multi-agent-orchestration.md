# Multi-Agent Orchestration Patterns

> Research compiled March 2026. Sources: DEV.to orchestration patterns guide, OpenAI Swarm GitHub, AutoGen Microsoft Research, CrewAI docs, LangGraph docs, aihola.com, Anthropic building effective agents.

---

## Overview

Multi-agent orchestration is the discipline of coordinating multiple AI agents to collaboratively solve problems that exceed the capability, context window, or specialization of any single agent. As LLMs become cheaper and more capable, architectures involving 5–50+ cooperating agents have become practical for production use cases.

The core engineering question is: **how do agents coordinate?** The coordination model determines:
- Latency (sequential vs parallel execution)
- Fault tolerance (single point of failure vs distributed resilience)
- Observability (centralized trace vs distributed log reconstruction)
- Scalability (linear scaling vs bottlenecks)
- Debugging complexity (single flow vs emergent behavior)

---

## The Five Core Orchestration Patterns

Every multi-agent system in production maps to one (or a hybrid) of five fundamental patterns.

### 1. Orchestrator-Worker (Hub-and-Spoke)

The most widely deployed pattern. A central orchestrator receives a task, decomposes it into subtasks, dispatches each to a specialized worker, and aggregates the results.

```
              ┌─────────────┐
              │ Orchestrator│
              │  (Planner)  │
              └──────┬──────┘
        ┌─────────┬──┴──┬─────────┐
        ▼         ▼     ▼         ▼
   ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │Worker 1│ │Wrkr 2│ │Wrkr 3│ │Wrkr 4│
   │(Code)  │ │(Test)│ │(Docs)│ │(API) │
   └────────┘ └──────┘ └──────┘ └──────┘
        └─────────┴──┬──┴─────────┘
                     ▼
              ┌─────────────┐
              │  Aggregated │
              │   Result    │
              └─────────────┘
```

**Characteristics**:
- Workers do not communicate with each other — all coordination flows through the orchestrator
- Orchestrator maintains global state and handles error recovery
- Workers are stateless or maintain only local state
- Easy to debug: single control flow to trace

**Implementations**:
- **LangGraph Supervisor pattern**: Orchestrator node routes to worker nodes
- **AutoGen GroupChat with selector**: Manager agent selects next speaker
- **Claude Code Teams**: Orchestrator spawns and coordinates sub-agents
- **CrewAI Hierarchical Process**: Manager agent oversees task delegation

**Use cases**:
- Customer support triage (route → resolve → verify)
- Code generation (plan → implement module A → implement module B → integrate)
- Document processing (split pages → extract per page → merge)
- Any workload where subtasks are independent

**Failure modes**:
- Orchestrator is a single point of failure
- Context window bottleneck: orchestrator must hold full task + all intermediate results
- Throughput ceiling: orchestrator LLM latency limits decomposition speed

---

### 2. Swarm Pattern (Decentralized / Emergent)

Agents operate as autonomous peers with no central coordinator. Coordination emerges from shared state and local decision rules — inspired by ant colonies and bird flocking.

```
  ┌──────┐    handoff     ┌──────┐
  │Agent1│ ──────────────▶│Agent2│
  └──────┘                └──────┘
     ▲                       │
     │        ┌──────┐       │
     └────────│Agent3│◀──────┘
              └──────┘
               ╔══════════════╗
               ║ Shared State ║
               ║  (Blackboard)║
               ╚══════════════╝
```

**Key mechanism**: Handoffs. When an agent encounters a task outside its specialization, it transfers control to a more appropriate agent by calling a `transfer_to_XXX` function.

**OpenAI Swarm framework** (Oct 2024):
- Two primitives: **Agents** and **Handoffs**
- Stateless architecture (no state retained between runs)
- Agent instructions → system prompt of active agent
- On handoff: system prompt changes to the new agent's instructions
- Lightweight and highly controllable
- Labeled "educational" by OpenAI (not production-hardened)

```python
# OpenAI Swarm example
from swarm import Swarm, Agent

def transfer_to_billing():
    return billing_agent

def transfer_to_technical():
    return technical_agent

triage_agent = Agent(
    name="Triage Agent",
    instructions="Route customer queries to the appropriate specialist.",
    functions=[transfer_to_billing, transfer_to_technical]
)

billing_agent = Agent(
    name="Billing Agent", 
    instructions="Handle all billing and payment questions."
)
```

**Characteristics**:
- No single point of failure
- Naturally parallel (agents work concurrently)
- Poor observability (must reconstruct trace from distributed logs)
- Emergent behavior can be unpredictable

**Use cases**:
- Research workflows (50 agents explore 50 hypotheses in parallel)
- Competitive intelligence gathering
- Large-scale web scraping
- Tasks where optimal path is unknown upfront

---

### 3. Pipeline Pattern (Sequential Stages)

Agents are arranged in a linear sequence where each agent processes the output of the previous one. Analogous to Unix pipes or manufacturing assembly lines.

```
Input → [Agent A: Parse] → [Agent B: Analyze] → [Agent C: Format] → Output
```

**Characteristics**:
- Predictable execution order
- Each agent specializes in one transformation
- Easy to debug (linear trace)
- Low latency only if stages are fast; overall latency = sum of all stages
- A bottleneck at any stage affects the whole pipeline

**Agentless** is essentially a pipeline (localize → repair → validate) with LLM calls as stages rather than agents.

**Aider Architect/Editor** uses a 2-stage pipeline:
1. Architect (o1/Claude Opus): reasons about what to change and why
2. Editor (DeepSeek/o1-mini): translates the plan into actual file edits

**Use cases**:
- Document processing (extract → transform → load)
- Code review (analyze → comment → summarize)
- Content generation (outline → draft → polish → publish)

---

### 4. Hierarchical Pattern (Tree Structure)

A tree of agents where higher-level agents manage lower-level ones, creating layers of abstraction. The root receives the original task; leaf agents execute atomic operations.

```
                    ┌─────────────────┐
                    │ Strategic Agent  │ (L0: Goals & Strategy)
                    └────────┬────────┘
              ┌──────────────┴──────────────┐
    ┌─────────┴──────────┐       ┌──────────┴──────────┐
    │  Tactical Agent A  │       │  Tactical Agent B   │ (L1: Planning)
    └──────┬─────────────┘       └──────┬──────────────┘
     ┌─────┴────┐                ┌──────┴────┐
   ┌─┴──┐   ┌──┴─┐           ┌──┴──┐   ┌───┴─┐
   │Op 1│   │Op 2│           │Op 3 │   │Op 4 │  (L2: Execution)
   └────┘   └────┘           └─────┘   └─────┘
```

**Characteristics**:
- Clear authority and delegation
- Scales to large agent teams (10+ agents)
- Overhead grows with tree depth (each delegation adds latency)
- Context compression at each level (higher-level agents summarize lower-level results)

**Implementations**:
- **Devin 2.0**: Primary Devin orchestrates sub-Devins for parallel workstreams
- **AgentOrchestra** (arxiv 2025): Central planning agent + specialized sub-teams
- **CrewAI Flows**: Hierarchical with manager agent auto-assigned

**Use cases**:
- Large software projects (CTO → PM → engineers)
- Enterprise automation (director → department heads → workers)
- Research programs (PI → research leads → lab members)

---

### 5. Mesh Pattern (Peer-to-Peer)

All agents can communicate directly with any other agent. No hierarchy, no central coordinator.

```
Agent1 ←──→ Agent2
  ↕    ╲  ╱   ↕
Agent3 ←──→ Agent4
```

**Characteristics**:
- Maximum flexibility
- Extremely difficult to debug and observe
- Risk of circular dependencies and deadlocks
- Rarely used in pure form; usually constrained by protocols

**Use cases**:
- Collaborative creative work (agents negotiate and revise)
- Consensus-seeking (agents vote/debate until agreement)
- Simulation environments

---

## Framework Implementations

### AutoGen (Microsoft)

**Versions**: 0.2 (original) → 0.4 (redesigned)

**AutoGen 0.2 (original)**:
- Conversation-based: agents exchange natural language messages
- `AssistantAgent` + `UserProxyAgent` + `GroupChat`
- Simple round-robin or LLM-selected speaker order
- Human input mode: `ALWAYS`, `NEVER`, `TERMINATE`

**AutoGen 0.4 (2024 redesign)**:
- **Actor model** (inspired by Erlang/Akka): agents as actors exchanging typed messages
- **Asynchronous, event-driven**: agents react to messages without blocking
- **Three-layer architecture**:
  1. **Core**: Agent runtime, message routing, actor lifecycle
  2. **AgentChat**: High-level conversation patterns (GroupChat, RoundRobin, Selector)
  3. **Extensions**: Tool integrations, model clients, memory

```python
# AutoGen 0.4 GroupChat
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import StopAfterNMessages

agent1 = AssistantAgent("Researcher", model_client=...)
agent2 = AssistantAgent("Writer", model_client=...)
agent3 = AssistantAgent("Editor", model_client=...)

team = RoundRobinGroupChat(
    participants=[agent1, agent2, agent3],
    termination_condition=StopAfterNMessages(9)  # 3 rounds
)
result = await team.run(task="Write an article about MCP.")
```

**Group chat patterns**:
- `RoundRobinGroupChat`: Agents take turns in fixed order
- `SelectorGroupChat`: LLM selects next speaker based on context
- Custom selector: Programmatic next-speaker logic

**Key strength**: Research-grade framework with deep Microsoft ecosystem integration (Azure AI, Semantic Kernel).

---

### CrewAI

**Purpose**: Role-based multi-agent orchestration focused on ease of use  
**Analogy**: A crew of specialists working on a project

**Core concepts**:
- **Agent**: Has a role, goal, backstory, and optional tools
- **Task**: Has a description, expected output, assigned agent
- **Crew**: Collection of agents + tasks + process type
- **Process**: How tasks execute (sequential or hierarchical)

```python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI coding agents",
    backstory="Expert at finding and synthesizing technical information",
    tools=[search_tool, web_fetch_tool],
    verbose=True
)

writer = Agent(
    role="Tech Content Writer", 
    goal="Craft compelling technical documentation",
    backstory="Expert at translating complex AI topics for developers",
    verbose=True
)

research_task = Task(
    description="Research the latest SWE-bench results",
    expected_output="Detailed report with scores and analysis",
    agent=researcher
)

write_task = Task(
    description="Write a summary of the research findings",
    expected_output="Well-structured markdown document",
    agent=writer,
    context=[research_task]  # Uses output from research_task
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential
)

result = crew.kickoff()
```

**Execution processes**:
- **Sequential**: Tasks execute in order; each output feeds the next
- **Hierarchical**: Manager agent auto-created; tasks delegated and validated

**Built-in memory**:
- Short-term: current task context
- Long-term: SQLite-backed episodic memory
- Shared entity memory: facts about entities across the crew

**Use cases**: Marketing automation, content pipelines, research workflows, customer service

---

### LangGraph

**Purpose**: Graph-based workflow orchestration for stateful agents  
**Core insight**: Model agent workflows as directed graphs where nodes are LLM calls or functions, edges are transitions

**Architecture**:
- **State**: Shared typed object passed between all nodes
- **Nodes**: Python functions or LLM calls that read/update state
- **Edges**: Transitions between nodes (conditional or unconditional)
- **Graph**: The compiled workflow

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    task: str
    code: str
    test_results: str
    done: bool

def write_code(state: AgentState) -> AgentState:
    # LLM writes code based on task
    code = llm.invoke(f"Write code for: {state['task']}")
    return {"code": code}

def run_tests(state: AgentState) -> AgentState:
    # Execute tests
    results = subprocess.run(["pytest"], capture_output=True)
    return {"test_results": results.stdout}

def check_done(state: AgentState) -> str:
    if "passed" in state["test_results"]:
        return "done"
    return "fix"

def fix_code(state: AgentState) -> AgentState:
    fixed = llm.invoke(f"Fix this code:\n{state['code']}\nError:\n{state['test_results']}")
    return {"code": fixed}

# Build graph
workflow = StateGraph(AgentState)
workflow.add_node("write", write_code)
workflow.add_node("test", run_tests)
workflow.add_node("fix", fix_code)

workflow.set_entry_point("write")
workflow.add_edge("write", "test")
workflow.add_conditional_edges("test", check_done, {"done": END, "fix": "fix"})
workflow.add_edge("fix", "test")

app = workflow.compile()
result = app.invoke({"task": "Implement a binary search function"})
```

**Key features**:
- **Cycles**: Unlike DAGs, LangGraph supports loops (critical for agent retry loops)
- **Persistence**: Built-in checkpointing; resume interrupted workflows
- **Human-in-loop**: Pause at any edge for human approval
- **Streaming**: Stream intermediate state updates
- **Subgraphs**: Compose larger graphs from smaller ones

**Supervisor pattern** (Orchestrator-Worker in LangGraph):
```python
# Supervisor routes to specialized agents
def supervisor(state):
    task = state["current_task"]
    if "test" in task:
        return {"next": "tester"}
    elif "code" in task:
        return {"next": "coder"}
    else:
        return {"next": "researcher"}
```

**Use cases**: Complex stateful workflows, human-in-loop approval flows, retry/error-recovery loops, production agentic systems requiring observability

---

### OpenAI Swarm / Agents SDK

**OpenAI Swarm** (October 2024):
- Experimental educational framework
- Two primitives: Agents + Handoffs
- Stateless (no state between runs)
- Designed for simplicity, not production scale

**OpenAI Agents SDK** (2025, production successor to Swarm):
- Production-hardened
- Persistent state across turns
- Built-in tracing and observability
- Guardrails: input/output validation
- Handoffs: structured agent transfer with context passing

```python
from agents import Agent, Runner, handoff

billing_agent = Agent(
    name="Billing",
    instructions="Handle billing inquiries and payments."
)

tech_agent = Agent(
    name="Technical Support",
    instructions="Resolve technical issues and bugs."
)

triage_agent = Agent(
    name="Triage",
    instructions="Route customer queries appropriately.",
    handoffs=[billing_agent, tech_agent]  # Can hand off to these
)

result = await Runner.run(triage_agent, "I can't access my account")
```

---

## Coordination Patterns (Cross-Framework)

### Pattern: Shared Blackboard

All agents read/write to a shared state store:

```
Agent 1 ──writes──▶ ┌──────────────┐
Agent 2 ──writes──▶ │  Shared      │ ◀──reads── Agent 3
Agent 4 ──reads──▶  │  State/DB    │ ◀──reads── Agent 5
                    └──────────────┘
```

Used by LangGraph (typed state), AutoGen (conversation history), and many custom implementations.

### Pattern: Message Bus

Agents publish and subscribe to topics:

```
Agent 1 ──publish("code.written")──▶ ┌─────────┐
Agent 2 ──publish("tests.run")──────▶│ Message │
                                      │   Bus   │
Agent 3 ◀──subscribe("code.*")───────└─────────┘
Agent 4 ◀──subscribe("tests.*")──────┘
```

Used by AutoGen 0.4's actor model with typed message routing.

### Pattern: Voting / Consensus

Multiple agents produce independent outputs; a final agent (or majority vote) selects the best:

```
Task ──▶ Agent 1 ──▶ Solution A ──┐
Task ──▶ Agent 2 ──▶ Solution B ──┼──▶ Judge/Vote ──▶ Final
Task ──▶ Agent 3 ──▶ Solution C ──┘
```

Used by Agentless (sample k patches, select via majority vote), and LLM-as-judge patterns.

### Pattern: Hierarchical Delegation with Verification

```
Manager
  → Assign task to Worker
  ← Receive result
  → Verify result (re-check, run tests)
  → Accept if valid, else re-assign or fix
```

Used by CrewAI hierarchical process, Devin 2.0 orchestration.

---

## When to Use Each Pattern

| Pattern | Use When | Avoid When |
|---------|---------|-----------|
| Orchestrator-Worker | Clear task decomposition, 3-8 agents, auditability needed | >10 workers (orchestrator bottleneck), inter-worker communication needed |
| Swarm | Parallel exploration, no clear decomposition, real-time responsiveness | Auditability required, deterministic output expected |
| Pipeline | Sequential transformations, each step well-defined | Any step can fail unpredictably, stages are tightly coupled |
| Hierarchical | 10+ agents, multiple abstraction layers, enterprise scale | Fast iteration needed, overhead acceptable |
| Mesh | Creative collaboration, consensus-seeking | Production systems (too unpredictable) |

**Key advice** (from aihola.com): "Reconsider whether you need multiple agents at all." Single agents with good tools often outperform complex multi-agent systems for tasks under ~1 hour of work.

---

## Production Considerations

### State Management

- **Ephemeral state**: In-memory, lost on restart. Suitable for short tasks.
- **Persistent state**: SQLite/Postgres-backed. Required for long-running tasks, recovery, audit.
- **Distributed state**: Redis/cloud store. Required for parallel agents across machines.

### Failure Handling

Common failure modes in multi-agent systems:
1. **Agent deadlock**: Agents waiting on each other with no progress
2. **Runaway loops**: Agent keeps retrying without progress (implement step limits)
3. **Context overflow**: Accumulated history exceeds model context window
4. **Tool failure cascades**: One tool failure causes downstream agent failures
5. **Inconsistent state**: Parallel agents write conflicting updates

Mitigations:
- Max iteration limits on all loops
- Timeout on all agent steps
- Idempotent writes (safe to retry)
- Optimistic locking on shared state
- Circuit breakers for external tool calls

### Observability

Multi-agent systems are harder to debug than single agents. Essential telemetry:
- **Trace ID**: Unique ID per top-level task that propagates to all sub-agents
- **Span per agent step**: Start time, end time, input, output, tool calls
- **State snapshots**: Record full state at each checkpoint
- **Token counts**: Track token usage per agent per step

Frameworks with built-in observability:
- **LangGraph**: Built-in tracing, LangSmith integration
- **OpenAI Agents SDK**: Native tracing
- **AutoGen 0.4**: Structured logging across the actor runtime

---

## Comparison Table

| Framework | Pattern | Language | Open Source | Production-Ready | Best For |
|-----------|---------|---------|-------------|-----------------|---------|
| AutoGen 0.4 | Actor/Conversation | Python | ✅ | ✅ | Enterprise, research |
| LangGraph | Graph/DAG | Python | ✅ | ✅ | Complex stateful workflows |
| CrewAI | Role-based | Python | ✅ | ✅ | Business automation |
| OpenAI Agents SDK | Swarm/Handoffs | Python | ✅ | ✅ | OpenAI-stack products |
| OpenAI Swarm | Swarm | Python | ✅ | ❌ (educational) | Learning, prototyping |
| Claude Code Teams | Orchestrator-Worker | Any | ❌ | ✅ | Coding tasks |
| Devin 2.0 | Hierarchical | Any | ❌ | ✅ | Software engineering |

---

## Sources

1. DEV.to — "Agent Orchestration Patterns: Swarm vs Mesh vs Hierarchical vs Pipeline": https://dev.to/jose_gurusup_dev/agent-orchestration-patterns-swarm-vs-mesh-vs-hierarchical-vs-pipeline-b40
2. OpenAI Swarm GitHub: https://github.com/openai/swarm
3. OpenAI Cookbook — "Orchestrating Agents: Routines and Handoffs": https://cookbook.openai.com/examples/orchestrating_agents
4. OpenAI Agents SDK: https://openai.github.io/openai-agents-python/
5. Microsoft AutoGen v0.4 Research: https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/
6. AutoGen 0.4 Architecture Preview: https://microsoft.github.io/autogen/0.2/blog/2024/10/02/new-autogen-architecture-preview/
7. AutoGen Multi-Agent Conversation: https://microsoft.github.io/autogen/0.2/docs/Use-Cases/agent_chat/
8. CrewAI GitHub: https://github.com/crewAIInc/crewAI
9. CrewAI Tasks docs: https://docs.crewai.com/en/concepts/tasks
10. LangChain — LangGraph: https://www.langchain.com/langgraph
11. Anthropic — "Building Effective Agents": https://www.anthropic.com/research/building-effective-agents
12. aihola.com — "Multi-Agent Orchestration Patterns Guide": https://aihola.com/article/multi-agent-orchestration-patterns-guide
13. digitalapplied.com — "AI Agent Orchestration Workflows Guide": https://www.digitalapplied.com/blog/ai-agent-orchestration-workflows-guide
