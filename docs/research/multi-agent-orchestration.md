# Multi-Agent Orchestration Patterns

> Comprehensive research note covering swarm intelligence, hierarchical orchestrator+worker patterns, CrewAI, AutoGen, LangGraph, parallel vs sequential execution, shared state, and inter-agent communication protocols.

---

## 1. Why Multi-Agent?

Single-agent systems are bounded by the context window, constrained to one reasoning thread, and limited to the capabilities of a single role. Multi-agent architectures overcome these limits:

- **Parallelism**: Multiple agents can work simultaneously on independent subtasks
- **Specialization**: Each agent can be optimized (different model, system prompt, tools) for a specific role
- **Context isolation**: Each agent has a focused context window rather than one bloated shared window
- **Fault isolation**: One failing agent doesn't crash the whole pipeline
- **Modularity**: Agents can be swapped, upgraded, or tested independently

Research (AutoGen, MetaGPT, ChatDev papers) has consistently shown multi-agent systems outperforming single-agent systems on complex tasks like software development.

From AutoGen's documentation:
> "Agents can work together in a variety of ways to solve problems. Research works like AutoGen, MetaGPT and ChatDev have shown multi-agent systems out-performing single agent systems at complex tasks like software development."

---

## 2. Core Building Blocks

Every multi-agent system is built from these primitives:

### 2.1 Autonomous Agents
Independent entities capable of making decisions, learning, and acting without human intervention. Each agent has:
- A **role** (what it is)
- A **goal** (what it's optimizing for)
- A **backstory/persona** (context for decisions)
- A **tool set** (what actions it can take)
- A **memory** (what it knows)
- An **LLM** (the reasoning engine)

### 2.2 Environment
The shared context — data sources, APIs, tools, language models. Agents perceive and interact with the environment to fulfill objectives.

### 2.3 Communication Protocol
How agents exchange information. Options:
- **Direct messaging**: point-to-point, synchronous
- **Blackboard systems**: shared memory all agents can read/write
- **Event-based signaling**: pub/sub, asynchronous
- **Tool calling**: agent calls another agent as a tool

### 2.4 Coordination Mechanism
Strategies that align agent goals and manage task division:
- **Centralized orchestrator**: one master agent routes work
- **Hierarchical**: tree of orchestrators and workers
- **Peer-to-peer**: agents negotiate directly
- **Market-based**: agents bid on tasks

---

## 3. Architecture Patterns

### 3.1 Supervisor / Hierarchical Pattern

The most common production pattern. One orchestrator agent decomposes goals and delegates to specialized workers.

```
                    ┌─────────────────┐
                    │   Orchestrator   │  (high-capability model, e.g. Opus)
                    │   "Project Mgr"  │
                    └───────┬─────────┘
                            │ delegates tasks
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ Researcher│  │  Coder   │  │  Tester  │
       │  (Haiku) │  │ (Sonnet) │  │  (Haiku) │
       └──────────┘  └──────────┘  └──────────┘
```

**Key characteristic**: Orchestrator maintains global state and task graph; workers operate in isolated contexts, return summaries.

**Claude Code implementation**: The main conversation spawns up to 10 subagents. Exploration subagents use Haiku (cheap); implementation uses Sonnet. Only summaries return to the main context.

**CrewAI**: Uses `Process.hierarchical` where a manager LLM automatically delegates tasks to the best-suited agent based on role and goal descriptions.

### 3.2 Sequential Pipeline

Tasks flow in a fixed order, each agent's output becoming the next agent's input. Simple, predictable, easy to debug.

```
[Researcher] ──output──▶ [Analyst] ──output──▶ [Writer] ──output──▶ [Editor]
```

**CrewAI**: `Process.sequential` — default mode, each task executed in definition order, previous output available as context.

**Best for**: well-defined linear workflows where each step clearly depends on the previous (e.g., research → draft → review → publish).

### 3.3 Parallel (Swarm) Pattern

Multiple independent agents work simultaneously on non-overlapping tasks.

```python
# LangGraph parallel fan-out
from langgraph.graph import StateGraph, START, END

builder = StateGraph(State)
builder.add_node("orchestrator", orchestrate)
builder.add_node("worker_a", worker_a)
builder.add_node("worker_b", worker_b)
builder.add_node("worker_c", worker_c)
builder.add_node("aggregator", aggregate_results)

builder.add_edge(START, "orchestrator")
builder.add_conditional_edges("orchestrator",
    route_to_workers,
    {"a": "worker_a", "b": "worker_b", "c": "worker_c"}
)
builder.add_edge(["worker_a", "worker_b", "worker_c"], "aggregator")
builder.add_edge("aggregator", END)
```

**OpenAI Swarm**: Lightweight multi-agent framework where agents can hand off to each other. Each agent has its own instructions and tools; "handoff" transfers the conversation to another agent.

**Best for**: tasks that can be parallelized — e.g., researching 10 topics simultaneously, running tests across multiple environments.

### 3.4 Network / Peer-to-Peer

Agents communicate directly with each other without a central orchestrator. Each agent can call any other agent.

```
Agent A ◄──────► Agent B
   ▲                 ▲
   │                 │
   ▼                 ▼
Agent C ◄──────► Agent D
```

**Characteristics**: More flexible, harder to debug. Risk of circular calls or infinite delegation. Requires careful design of routing logic.

### 3.5 Graph-Based (LangGraph)

Workflows represented as directed graphs (potentially cyclic) where nodes are agents/functions and edges define transitions.

```python
from langgraph.graph import StateGraph

class AgentState(TypedDict):
    messages: list
    current_agent: str
    task_complete: bool

graph = StateGraph(AgentState)
graph.add_node("planner", plan_step)
graph.add_node("executor", execute_step)
graph.add_node("reviewer", review_step)

graph.add_conditional_edges(
    "reviewer",
    lambda state: "executor" if not state["task_complete"] else END
)
```

LangGraph is fundamentally built around DAGs (with support for cycles for iterative refinement). It provides:
- **State persistence** between nodes
- **Human-in-the-loop** checkpoints
- **Streaming** at every step
- **Time-travel debugging** (replay from any checkpoint)

---

## 4. Framework Comparison

### 4.1 CrewAI

**Model**: Role-based, agents behave like employees with specific responsibilities.

```python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Senior Research Analyst",
    goal="Uncover cutting-edge developments in AI",
    backstory="Expert researcher with attention to detail",
    tools=[search_tool, web_fetch_tool],
    llm="claude-opus-4-6",
    max_iter=20,
    allow_delegation=True,
    respect_context_window=True,  # Auto-summarizes if context fills
)

writer = Agent(
    role="Tech Content Strategist",
    goal="Craft compelling articles on tech advancements",
    backstory="Experienced technical writer",
    llm="claude-sonnet-4-6",
)

research_task = Task(
    description="Research latest AI agent frameworks",
    expected_output="Detailed report with key findings",
    agent=researcher,
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process=Process.sequential,  # or Process.hierarchical
    memory=True,  # Enables unified memory system
    verbose=True,
)

result = crew.kickoff()
```

**Memory system** (CrewAI 2025): Unified `Memory` class that replaces separate short/long-term/entity memory. Uses LLM to infer scope, categories, importance. Hierarchical scopes like a filesystem: `/project/alpha`, `/agent/researcher/findings`. Composite scoring: semantic similarity + recency + importance.

**Agent attributes of note**:
- `max_retry_limit`: Max retries on error (default 2)
- `code_execution_mode`: `safe` (Docker) or `unsafe` (direct)
- `respect_context_window`: Auto-summarizes to stay within limits

### 4.2 AutoGen (Microsoft)

**Model**: Message-passing between autonomous agents. Supports both synchronous and async multi-turn conversations.

```python
import autogen

config_list = [{"model": "gpt-4", "api_key": "..."}]

assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config={"config_list": config_list},
)

user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    code_execution_config={"work_dir": "coding"},
)

user_proxy.initiate_chat(
    assistant,
    message="Write a Python script to scrape Hacker News top stories",
)
```

AutoGen patterns:
- **Two-agent chat**: UserProxy + Assistant (most common)
- **Group chat**: Multiple agents in a conversation with a GroupChatManager routing messages
- **Nested chat**: Agents can spawn sub-conversations internally
- **Reflection**: Agent critiques its own output before returning

### 4.3 LangGraph

**Model**: Graph-based state machine. Explicit state, deterministic routing with conditional edges, supports cycles.

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# State is a TypedDict shared across all nodes
class State(TypedDict):
    messages: Annotated[list, add_messages]
    plan: str
    code: str
    test_results: str
    iteration: int

graph = StateGraph(State)

# Add nodes
graph.add_node("planner", plan_task)
graph.add_node("coder", write_code)
graph.add_node("tester", run_tests)

# Add edges with routing logic
graph.add_conditional_edges(
    "tester",
    lambda s: "coder" if "FAILED" in s["test_results"] and s["iteration"] < 5 else END,
)

# Compile with persistence
checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)

# Run with thread_id for persistence
config = {"configurable": {"thread_id": "feature-xyz-001"}}
result = app.invoke({"messages": [("user", "Implement feature X")]}, config)
```

LangGraph strengths:
- Maximum control over workflow logic
- Built-in human-in-the-loop (interrupt points)
- State is fully inspectable and debuggable
- LangSmith tracing integration

LangChain's "Deep Agents" (2025) — built on LangGraph — add batteries-included features: automatic long conversation compression, virtual filesystem, subagent spawning.

### 4.4 OpenAI Agents SDK

**Model**: Agents with handoffs. An agent runs until it either completes its task or hands off to another agent.

```python
from agents import Agent, Runner

triage_agent = Agent(
    name="Triage Agent",
    instructions="Route to the correct specialist",
    handoffs=[spanish_agent, billing_agent, tech_agent],
)

result = await Runner.run(triage_agent, "Necesito ayuda con mi factura")
```

Simple, clean API. Handoffs are explicit — an agent declares which agents it can transfer to. Tracing built-in.

### 4.5 Google ADK (Agent Development Kit)

Focuses on multi-agent pipelines with Google Cloud integration. Supports `SequentialAgent`, `ParallelAgent`, and `LoopAgent` primitives.

### 4.6 MetaGPT

Simulates a software company: Product Manager, Architect, Engineer, QA Engineer roles with structured document passing (PRD → Architecture → Code → Tests).

---

## 5. Communication Protocols

### Agent-to-Agent (A2A)

Google's open A2A protocol enables agents to discover each other and exchange tasks. Agents expose capability cards, receive tasks via JSON-RPC, stream progress via SSE.

```
Client Agent ──── POST /tasks/send ────▶ Remote Agent
               ◄── streaming status ────
               ◄── final result ─────────
```

### Model Context Protocol (MCP)

Anthropic's MCP lets agents connect to tools/data sources as clients. MCP servers expose tools, resources, and prompts that any MCP-compatible agent can consume.

```
Agent (MCP client) ──── JSON-RPC 2.0 ────▶ MCP Server
                                           (tools: bash, github, slack, etc.)
```

This enables tool discovery and standardized agent ↔ tool interfaces without custom integration work.

### Blackboard / Shared State

All agents read/write to a shared data structure. Common in LangGraph (`State`) and AutoGen (`GroupChat`). The blackboard holds the full task context; agents pick up and add to it.

---

## 6. Shared State Management

### State Schema Design

```python
# LangGraph state for a software engineering agent swarm
class SwarmState(TypedDict):
    # Inputs
    issue_description: str
    repository_url: str
    
    # Shared working state
    plan: list[str]
    current_step: int
    files_modified: list[str]
    
    # Agent outputs
    research_findings: str
    implementation: dict[str, str]  # filename -> content
    test_results: str
    
    # Control
    iteration: int
    max_iterations: int
    final_pr_url: str
```

### Conflict Prevention

When multiple agents write to shared state simultaneously:
- **Optimistic locking**: Include version/timestamp; fail if stale
- **Partitioned state**: Each agent owns specific state fields
- **Message passing**: Use queues instead of shared writes
- **Append-only**: Agents append to lists rather than overwriting

---

## 7. Parallel vs. Sequential Trade-offs

| Dimension | Parallel | Sequential |
|-----------|----------|-----------|
| Speed | ✅ Faster for independent tasks | ❌ Slower, one task at a time |
| Consistency | ❌ Harder to manage (race conditions) | ✅ Each step sees prior results |
| Debugging | ❌ More complex trace analysis | ✅ Clear linear trace |
| Cost | ❌ All agents run (even if earlier failure) | ✅ Can stop early on failure |
| Use case | Research + analysis, test suites | Build pipelines, code review |

**Hybrid pattern**: Fan-out for independent sub-tasks, then fan-in for aggregation, then sequential for dependent steps.

---

## 8. Production Considerations

### Observability
- Trace every agent call with IDs (run_id, session_id, agent_id, step_id)
- Log both inputs and outputs to each agent
- Track token consumption per agent and per workflow
- LangSmith, Weights & Biases, Helicone for multi-agent tracing

### Failure Modes
- **Agent deadlock**: Two agents waiting on each other — use timeouts and maximum iteration limits
- **Context explosion**: Accumulated history fills all windows — use summarization, context pruning
- **Tool hallucination**: Agent calls non-existent tools — strict tool schemas + validation
- **Goal drift**: Sub-agent pursues a sub-goal that diverges from original intent — orchestrator validation gates

### Cost Management
- Use cheaper models (Haiku) for exploration/classification
- Use expensive models (Opus) only for complex reasoning
- Spawn subagents for isolated work so main context stays clean
- Cache repeated tool schemas with prompt caching

---

## Sources

- adopt.ai: Multi-Agent Frameworks Explained — https://www.adopt.ai/blog/multi-agent-frameworks
- CrewAI Agents docs — https://docs.crewai.com/concepts/agents
- CrewAI Memory docs — https://docs.crewai.com/concepts/memory
- LangChain overview — https://docs.langchain.com/oss/python/langchain/overview
- AutoGen design patterns — https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/intro.html
- Introl: Claude Code CLI Technical Reference — https://introl.com/blog/claude-code-cli-comprehensive-guide-2025
- arXiv: AI Agentic Programming Survey (2508.11126) — https://arxiv.org/html/2508.11126v1
- digitalapplied.com: AI Agent Orchestration Workflows Guide — https://www.digitalapplied.com/blog/ai-agent-orchestration-workflows-guide
