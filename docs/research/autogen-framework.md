# Microsoft AutoGen Framework — Comprehensive Research Guide

> **Last Updated:** March 2025 | **Current Version:** 0.4.x (stable)

---

## Table of Contents

1. [Overview](#overview)
2. [History & Evolution](#history)
3. [v0.4 Architecture — Layered Design](#architecture)
4. [AutoGen Core — Actor Model](#autogen-core)
5. [AutoGen AgentChat — High-Level API](#agentchat)
6. [AutoGen Extensions](#extensions)
7. [Core Agents](#core-agents)
8. [Group Chat & Multi-Agent Patterns](#group-chat)
9. [Code Examples](#code-examples)
10. [Magentic-One](#magentic-one)
11. [AutoGen Studio](#studio)
12. [Comparisons](#comparisons)
13. [Benchmarks & Use Cases](#benchmarks)
14. [Pros & Cons](#pros-cons)
15. [Official URLs](#official-urls)

---

## Overview

**AutoGen** is Microsoft Research's open-source framework for building multi-agent AI applications. Originally released in Fall 2023, it quickly became one of the most popular agentic AI frameworks. AutoGen enables developers to create intelligent applications where multiple AI agents collaborate, use tools, and handle complex tasks through conversation.

The v0.4 release (announced January 2025, stable February 2025) represents a **complete architectural redesign** based on 18 months of community feedback. The redesign adopts the **actor model** for multi-agent orchestration, making AutoGen significantly more scalable, modular, and production-ready.

### Key Design Goals of AutoGen v0.4

1. **Greater modularity** — reuse agents seamlessly across applications
2. **Better debugging and scaling** support
3. **Improved code quality and maturity**
4. **Extensibility** — plugin architecture for new capabilities
5. **Polyglot support** — agents can run in different languages/processes

---

## History & Evolution {#history}

### Timeline

| Version | Date | Key Features |
|---------|------|--------------|
| v0.1 | Fall 2023 | Initial release, ConversableAgent, AgentChat |
| v0.2 | Early 2024 | Stability improvements, ecosystem growth |
| v0.4 Preview | Fall 2024 | Actor model redesign preview |
| v0.4 Stable | January 2025 | Full release with AgentChat rewrite |
| v0.4.x | Feb-Mar 2025 | Extensions, Magentic-One updates |

### The v0.2 → v0.4 Architectural Shift

v0.2 was built around synchronous, Python-native agents with direct method calls. This worked for prototyping but had production limitations:

- **Tightly coupled agents** — hard to reuse across applications
- **Synchronous execution** — bottlenecks in multi-step workflows
- **Limited scalability** — couldn't distribute agents across processes
- **Debugging difficulty** — opaque execution flow
- **No built-in state management** — had to implement manually

v0.4 adopted the **actor model** (popularized by Erlang, Akka) where agents communicate exclusively via async messages, enabling natural decoupling and scalability.

---

## v0.4 Architecture — Layered Design {#architecture}

```
┌─────────────────────────────────────────────┐
│          Applications & Tools               │
│    (Magentic-One, AutoGen Studio, etc.)      │
└─────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────┐
│           AutoGen Extensions                │
│   (Advanced clients, agents, integrations)  │
└─────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────┐
│           AutoGen AgentChat                 │
│  (High-level API: AssistantAgent, Teams)    │
└─────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────┐
│            AutoGen Core                     │
│   (Actor model, async messages, runtime)    │
└─────────────────────────────────────────────┘
```

### Package Structure

```bash
pip install autogen-agentchat    # High-level API (includes Core)
pip install autogen-ext          # Extensions
pip install autogen-core         # Just the Core (advanced use)
```

---

## AutoGen Core — Actor Model {#autogen-core}

The foundation of v0.4 is the **actor model** implementation:

### Actor Model Concepts

- **Agents = Actors** — independent computation units
- **Messages = Communication** — agents only interact via async messages
- **Runtime** — manages message delivery and scheduling
- **Event-driven** — agents respond to messages, not direct calls

### Key Benefits of Actor Model

1. **Natural decoupling** — agents don't know about each other's internals
2. **Process isolation** — agents can run in separate processes/machines
3. **Observability** — message flow can be traced and monitored
4. **Static & dynamic workflows** — supports both predefined and runtime-determined flows

### Core Abstractions

```python
from autogen_core import (
    AgentId,
    MessageContext,
    RoutedAgent,
    SingleThreadedAgentRuntime,
    message_handler,
)

# Agent definition
class MyAgent(RoutedAgent):
    def __init__(self):
        super().__init__("my_agent")
    
    @message_handler
    async def handle_task(self, message: TaskMessage, ctx: MessageContext) -> None:
        # Process message
        result = await self.process(message.content)
        # Send result to another agent
        await self.send_message(
            ResultMessage(content=result),
            AgentId("result_collector", "default")
        )

# Runtime setup
runtime = SingleThreadedAgentRuntime()
await MyAgent.register(runtime, "my_agent", lambda: MyAgent())
runtime.start()
```

### Runtime Types

| Runtime | Use Case |
|---------|----------|
| `SingleThreadedAgentRuntime` | Local development, testing |
| `GrpcWorkerAgentRuntime` | Distributed, multi-process agents |
| `WorkerAgentRuntime` | Production distributed workflows |

---

## AutoGen AgentChat — High-Level API {#agentchat}

AgentChat provides the familiar, easy-to-use interface for rapid prototyping while leveraging Core's actor model underneath.

### Core Agents in AgentChat

#### AssistantAgent

The primary LLM-powered agent:

```python
import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import TextMessage
from autogen_core import CancellationToken
from autogen_ext.models.openai import OpenAIChatCompletionClient

async def main():
    model_client = OpenAIChatCompletionClient(model="gpt-4o")
    
    agent = AssistantAgent(
        name="assistant",
        model_client=model_client,
        system_message="You are a helpful AI assistant.",
        tools=[],           # Optional tools
        memory=[],          # Optional memory modules
        reflect_on_tool_use=True,  # Reflect after tool execution
    )
    
    response = await agent.on_messages(
        [TextMessage(content="Hello! What can you do?", source="user")],
        CancellationToken()
    )
    print(response.chat_message.content)

asyncio.run(main())
```

#### UserProxyAgent

Represents a human in the conversation:

```python
from autogen_agentchat.agents import UserProxyAgent

user_proxy = UserProxyAgent(
    name="user_proxy",
    input_func=input,  # Gets actual human input
    # Or: input_func=None for fully automated
)
```

#### CodeExecutorAgent

Executes code safely:

```python
from autogen_agentchat.agents import CodeExecutorAgent
from autogen_ext.code_executors.local import LocalCommandLineCodeExecutor
from autogen_ext.code_executors.docker import DockerCommandLineCodeExecutor

# Local execution (dev only)
executor = CodeExecutorAgent(
    name="code_executor",
    code_executor=LocalCommandLineCodeExecutor(work_dir="coding_workspace")
)

# Docker execution (production)
executor = CodeExecutorAgent(
    name="code_executor",
    code_executor=DockerCommandLineCodeExecutor(
        image="python:3.12-slim",
        work_dir="/workspace"
    )
)
```

---

## AutoGen Extensions {#extensions}

The Extensions layer provides:

- **Model clients**: OpenAI, Azure OpenAI, Anthropic, Mistral, Gemini via LiteLLM
- **Code executors**: Local, Docker, Azure Container Apps
- **Tool integrations**: LangChain tools, MCP servers
- **Vector stores**: ChromaDB, Azure AI Search
- **Memory**: Long-term memory systems

### Model Configuration

```python
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.models.anthropic import AnthropicChatCompletionClient

# OpenAI
openai_client = OpenAIChatCompletionClient(
    model="gpt-4o",
    api_key="your-key",
    temperature=0.7,
)

# Azure OpenAI
azure_client = OpenAIChatCompletionClient(
    model="gpt-4o",
    azure_endpoint="https://your-resource.openai.azure.com/",
    azure_deployment="gpt-4o",
    api_version="2024-06-01",
)

# Anthropic
anthropic_client = AnthropicChatCompletionClient(
    model="claude-3-5-sonnet-20241022",
    api_key="your-key",
)
```

---

## Core Agents {#core-agents}

### v0.2 ConversableAgent (Legacy, still supported)

The original base class for all conversational agents in AutoGen v0.2:

```python
import autogen

config_list = [{"model": "gpt-4o", "api_key": "your-key"}]
llm_config = {"config_list": config_list}

# Basic conversable agent (v0.2 API)
assistant = autogen.AssistantAgent(
    name="assistant",
    llm_config=llm_config,
    system_message="You are a helpful assistant.",
)

user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    human_input_mode="TERMINATE",  # NEVER, ALWAYS, TERMINATE
    max_consecutive_auto_reply=10,
    code_execution_config={"work_dir": "workspace"},
    is_termination_msg=lambda msg: "TERMINATE" in msg.get("content", ""),
)

# Start conversation
user_proxy.initiate_chat(
    assistant,
    message="Write a Python script to calculate fibonacci numbers."
)
```

### Human Input Modes

| Mode | Description |
|------|-------------|
| `NEVER` | Fully automated, no human input |
| `ALWAYS` | Ask human every turn |
| `TERMINATE` | Only ask when agent sends TERMINATE |

---

## Group Chat & Multi-Agent Patterns {#group-chat}

### v0.2 GroupChat (Legacy)

```python
import autogen

config_list = [{"model": "gpt-4o", "api_key": "your-key"}]
llm_config = {"config_list": config_list}

# Define agents
researcher = autogen.AssistantAgent(
    name="Researcher",
    system_message="Research specialist. Find information and cite sources.",
    llm_config=llm_config,
)

coder = autogen.AssistantAgent(
    name="Coder",
    system_message="Python developer. Write clean, tested code.",
    llm_config=llm_config,
)

reviewer = autogen.AssistantAgent(
    name="Reviewer",
    system_message="Code reviewer. Find bugs and suggest improvements.",
    llm_config=llm_config,
)

user_proxy = autogen.UserProxyAgent(
    name="User",
    human_input_mode="TERMINATE",
    code_execution_config={"work_dir": "coding_workspace"},
)

# Create group chat
groupchat = autogen.GroupChat(
    agents=[user_proxy, researcher, coder, reviewer],
    messages=[],
    max_round=12,
    speaker_selection_method="auto",  # LLM decides who speaks next
)

manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

# Start
user_proxy.initiate_chat(
    manager,
    message="Build a web scraper that collects weather data and visualizes trends."
)
```

### v0.4 Teams (New API)

```python
from autogen_agentchat.teams import RoundRobinGroupChat, SelectorGroupChat, Swarm
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

model_client = OpenAIChatCompletionClient(model="gpt-4o")

# Create agents
agent1 = AssistantAgent("researcher", model_client=model_client, 
                         system_message="Research specialist.")
agent2 = AssistantAgent("writer", model_client=model_client,
                         system_message="Technical writer.")

# Termination condition
termination = TextMentionTermination("DONE") | MaxMessageTermination(20)

# Pattern 1: Round Robin (each agent speaks in turn)
team = RoundRobinGroupChat(
    participants=[agent1, agent2],
    termination_condition=termination,
)

# Pattern 2: Selector (LLM selects next speaker)
team = SelectorGroupChat(
    participants=[agent1, agent2],
    model_client=model_client,  # Used to select next speaker
    termination_condition=termination,
)

# Pattern 3: Swarm (agents handoff to each other)
team = Swarm(
    participants=[agent1, agent2],
    termination_condition=termination,
)

# Run
import asyncio
result = asyncio.run(team.run(task="Research and write about quantum computing"))
print(result.messages[-1].content)
```

### Team Patterns Comparison

| Pattern | Description | Use Case |
|---------|-------------|----------|
| `RoundRobinGroupChat` | Each agent takes turns | Structured multi-turn discussions |
| `SelectorGroupChat` | LLM selects next speaker | Dynamic expert routing |
| `Swarm` | Agents explicitly handoff | Pipeline workflows |
| Custom orchestrator | Your own selection logic | Complex business rules |

---

## Code Examples {#code-examples}

### Complete Research Pipeline (v0.4)

```python
import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core.tools import FunctionTool

# Define tools
def web_search(query: str) -> str:
    """Search the web for information."""
    # Your implementation
    return f"Results for {query}: ..."

def write_file(filename: str, content: str) -> str:
    """Write content to a file."""
    with open(filename, "w") as f:
        f.write(content)
    return f"Written to {filename}"

# Create model
model = OpenAIChatCompletionClient(model="gpt-4o")

# Create agents with tools
researcher = AssistantAgent(
    name="researcher",
    model_client=model,
    tools=[FunctionTool(web_search, description="Search the web")],
    system_message="You are a research specialist. Search for information and provide summaries with citations. Say 'RESEARCH_DONE' when complete.",
)

analyst = AssistantAgent(
    name="analyst",
    model_client=model,
    system_message="You are a data analyst. Analyze the research findings and extract key insights.",
)

writer = AssistantAgent(
    name="writer",
    model_client=model,
    tools=[FunctionTool(write_file, description="Write to file")],
    system_message="You are a technical writer. Compile research and analysis into a comprehensive report. Say 'DONE' when the report is complete.",
)

# Build team
termination = TextMentionTermination("DONE")
team = SelectorGroupChat(
    participants=[researcher, analyst, writer],
    model_client=model,
    termination_condition=termination,
)

# Run pipeline
async def main():
    result = await team.run(
        task="Research the latest advances in quantum computing and write a technical report."
    )
    print("\n=== Final Report ===")
    print(result.messages[-1].content)

asyncio.run(main())
```

### State Save/Load (v0.4)

```python
import asyncio
import json

async def main():
    # ... setup agent ...
    agent = AssistantAgent(...)
    
    # Run some interactions
    await agent.on_messages([...], CancellationToken())
    
    # Save state
    state = await agent.save_state()
    with open("agent_state.json", "w") as f:
        json.dump(state, f)
    
    # Later, restore state
    with open("agent_state.json") as f:
        saved_state = json.load(f)
    
    new_agent = AssistantAgent(...)
    await new_agent.load_state(saved_state)
```

### Streaming Responses (v0.4)

```python
async def main():
    agent = AssistantAgent(
        name="assistant",
        model_client=OpenAIChatCompletionClient(model="gpt-4o"),
    )
    
    # Stream the response
    async for message in agent.on_messages_stream(
        [TextMessage(content="Explain quantum entanglement", source="user")],
        CancellationToken()
    ):
        if isinstance(message, ModelClientStreamingChunkEvent):
            print(message.content, end="", flush=True)
        elif isinstance(message, Response):
            print("\n[Done]")
```

---

## Magentic-One {#magentic-one}

**Magentic-One** is a generalist multi-agent system built on AutoGen, released by Microsoft Research as a reference implementation.

### Architecture

```
Orchestrator (GPT-4o)
├── WebSurfer     — Web browsing (Playwright)
├── FileSurfer    — File system navigation
├── Coder         — Code writing and analysis
└── ComputerTerminal  — Command execution
```

### Key Features

- **Self-directed** — orchestrator plans and delegates automatically
- **Multi-modal** — handles text, images, files, web content
- **Error recovery** — retries and adapts to failures
- **Benchmarks** — state-of-the-art on GAIA, WebArena, AssistantBench

### Example

```python
from autogen_ext.teams.magentic_one import MagenticOne
from autogen_ext.models.openai import OpenAIChatCompletionClient

client = OpenAIChatCompletionClient(model="gpt-4o")
m1 = MagenticOne(client=client)

result = asyncio.run(m1.run("Research Tesla's Q3 2024 earnings and create a summary spreadsheet"))
```

---

## AutoGen Studio {#studio}

AutoGen Studio is a **low-code visual interface** for building and testing AutoGen applications:

### v0.4 Studio Features

- **Drag-and-drop agent builder** — create agent teams visually
- **Real-time updates** — watch agents collaborate live
- **Flow visualizations** — see message flow and execution
- **Execution controls** — pause, resume, modify running agents
- **Component galleries** — share/discover community-built agents

### Install and Run

```bash
pip install autogenstudio
autogenstudio ui --port 8081
# Open http://localhost:8081
```

---

## Comparisons {#comparisons}

### AutoGen v0.2 vs v0.4

| Feature | v0.2 | v0.4 |
|---------|------|------|
| Architecture | Synchronous, Python-native | Actor model, async messaging |
| State management | Manual | Built-in save/load |
| Multi-process | Not supported | Native via gRPC runtime |
| Streaming | Limited | Full streaming support |
| Extensibility | Plugin system | Layered (Core/AgentChat/Ext) |
| Agent selection | Auto/round-robin/custom | RoundRobin/Selector/Swarm |
| Observability | Limited | OTEL traces, full logging |

### AutoGen vs LangGraph

| Feature | AutoGen | LangGraph |
|---------|---------|-----------|
| Primary paradigm | Multi-agent conversation | Stateful graph workflows |
| Level of abstraction | Higher (AgentChat) | Lower (explicit graph) |
| Conversation model | Message-passing actors | State transitions |
| Built-in agents | Yes (Assistant, UserProxy) | Minimal (prebuilt React) |
| Human-in-loop | UserProxyAgent | interrupt_before/after |
| Checkpointing | State save/load | Automatic checkpointing |
| Learning curve | Low-Medium | Medium-High |

### AutoGen vs CrewAI

| Feature | AutoGen | CrewAI |
|---------|---------|--------|
| Agent roles | Flexible (any role) | Strict role-based |
| Orchestration | GroupChat / Teams | Crews / Flows |
| Code execution | Built-in | Via tools |
| Enterprise focus | Research-led | Enterprise-first |
| LLM support | Wide (via extensions) | Wide (via LiteLLM) |

---

## Benchmarks & Use Cases {#benchmarks}

### Benchmark Results

**GAIA Benchmark (General AI Assistants)**
- Magentic-One scored state-of-the-art on GAIA v2 at launch (2024)
- Level 1: ~70% accuracy
- Level 2: ~52% accuracy
- Level 3: ~32% accuracy (complex multi-step tasks)

**WebArena**
- Magentic-One competitive with best agents at ~21% task completion

### Production Use Cases

1. **Business process automation** — automating complex multi-step business workflows
2. **Code generation & review** — researcher + coder + reviewer pipelines
3. **Market research** — multi-agent internet research and summarization
4. **Data analysis** — fetching, analyzing, and visualizing data
5. **Security operations** — automated security triage and response
6. **Customer support** — multi-tier support escalation systems

---

## Pros & Cons {#pros-cons}

### Pros

✅ **Microsoft Research backing** — well-resourced, academically rigorous  
✅ **Actor model** — scalable, distributed, production-grade architecture  
✅ **Easy to start** — AgentChat provides high-level API for rapid prototyping  
✅ **Built-in code execution** — Docker/local code executor out-of-box  
✅ **State management** — save/load agent state natively in v0.4  
✅ **Streaming** — full streaming support for real-time UX  
✅ **AutoGen Studio** — visual debugging and development UI  
✅ **Magentic-One** — reference multi-agent system for complex tasks  
✅ **Multi-process** — agents can run in different processes/machines  
✅ **OTEL tracing** — production observability built-in  

### Cons

❌ **v0.2 → v0.4 breaking changes** — significant migration effort required  
❌ **Documentation gaps** — v0.4 docs still catching up with the implementation  
❌ **Community fragmentation** — AG2 fork created controversy  
❌ **Production deployment** — no official hosted platform (unlike LangGraph)  
❌ **Complex for simple tasks** — actor model is overkill for single-agent apps  
❌ **Python-first** — multi-language support is nascent  

---

## Official URLs {#official-urls}

- **AutoGen GitHub**: https://github.com/microsoft/autogen
- **AutoGen Docs**: https://microsoft.github.io/autogen/stable/
- **AutoGen Blog**: https://devblogs.microsoft.com/autogen/
- **v0.4 Launch Post**: https://devblogs.microsoft.com/autogen/autogen-reimagined-launching-autogen-0-4/
- **Microsoft Research Article**: https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/
- **Migration Guide v0.2→v0.4**: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/migration-guide.html
- **AutoGen Studio**: https://microsoft.github.io/autogen/stable/user-guide/autogenstudio-user-guide/
- **Magentic-One Paper**: https://arxiv.org/abs/2411.04468
- **PyPI**: https://pypi.org/project/autogen-agentchat/

---

## Key Takeaways

1. **AutoGen v0.4 is a complete rewrite** — don't assume v0.2 knowledge applies
2. **Three-layer architecture**: Core (actor model) → AgentChat (high-level) → Extensions
3. **Actor model** enables natural scaling to distributed multi-agent systems
4. **AgentChat** maintains the beloved conversational API from v0.2 with major improvements
5. **Magentic-One** demonstrates AutoGen's capability for complex real-world tasks
6. **AutoGen Studio** dramatically lowers the barrier to building multi-agent systems
7. The framework is best suited for **conversation-centric** multi-agent patterns vs. graph-centric LangGraph

---

*Research compiled March 2025. AutoGen is in active development; check official docs for latest.*
