# Emerging AI Agent Frameworks 2025: Pydantic AI, OpenAI Agents SDK, Letta, Strands, Bee, Magentic-One

> **Research Date:** March 2026  
> **Focus:** New and emerging agent frameworks released or significantly updated in 2025

---

## Overview

2025 was a landmark year for AI agent frameworks. The market fragmented: instead of one dominant framework (as LangChain was in 2023–2024), the ecosystem diversified into purpose-built tools optimized for specific use cases — type-safe Pythonic agents, cloud-native agents, memory-persistent agents, and enterprise-grade multi-agent systems.

Key themes:
- **Model-driven approach**: Modern LLMs are smart enough; frameworks should get out of the way
- **Type safety**: Pydantic-native validation catches errors at development time
- **Native tool use**: Frameworks embrace model-native function calling rather than custom parsers
- **Persistence and memory**: Long-running, stateful agents that remember across sessions
- **Open source + enterprise**: Major players (AWS, IBM, Microsoft, OpenAI) publishing SDKs

---

## Framework Landscape 2025

| Framework | Creator | Stars | Language | Key Differentiator |
|-----------|---------|-------|----------|-------------------|
| Pydantic AI | Pydantic | 8k+ | Python | Type-safe, Pythonic, Logfire observability |
| OpenAI Agents SDK | OpenAI | 15k+ | Python | Minimal abstraction, production-ready |
| Letta (MemGPT) | Letta AI | 35k+ | Python | Stateful memory, self-editing context |
| Strands Agents | AWS | 5k+ | Python | Model-driven, AWS-native, minimal code |
| Bee Agent Framework | IBM | 3k+ | TypeScript | Enterprise, Granite models, LangChain compat |
| Magentic-One | Microsoft | 6k+ | Python | Multi-agent, generalist task completion |
| LangGraph | LangChain | 10k+ | Python | Graph-based, state machine workflows |
| smolagents | HuggingFace | 12k+ | Python | Lightweight code-first agents |

---

## Part 1: Pydantic AI

### Overview

Pydantic AI, released by the Pydantic team in late 2024, brings the type-safety philosophy of Pydantic to AI agent development. The goal: catch errors at write-time (IDE autocomplete + type checking) rather than at runtime.

**Key features:**
- Multi-model support: OpenAI, Anthropic, Gemini, Groq, Mistral, Ollama
- Dependency injection system for tools and context
- Native Pydantic model validation for structured outputs
- Logfire integration for real-time observability
- Async-first design with `run_sync()` convenience wrapper
- Type-safe `RunContext[T]` for dependency passing to tools

### Architecture

```
PydanticAI Agent Architecture:

Agent[Deps, Result]
    │
    ├── Model (OpenAI, Anthropic, etc.)
    │
    ├── Instructions / System Prompt
    │    └── Can be static string or dynamic callable
    │
    ├── Tools (Function tools with type annotations)
    │    └── @agent.tool - has RunContext access
    │    └── @agent.tool_plain - stateless tools
    │
    ├── Result Type (Pydantic model for validation)
    │    └── Retries on validation failure
    │
    └── Dependencies (Injected context/services)
```

### Code Examples

#### Basic Agent

```python
from pydantic_ai import Agent

agent = Agent(
    'anthropic:claude-sonnet-4-6',
    instructions='Be concise, reply with one sentence.',
)

result = agent.run_sync('Where does "hello world" come from?')
print(result.output)
# Output: The phrase "hello world" originated in Brian Kernighan's
# 1972 C programming tutorial.
```

#### Agent with Structured Output

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class ProductAnalysis(BaseModel):
    sentiment: str  # positive, negative, neutral
    score: float    # 0.0 to 1.0
    key_issues: list[str]
    summary: str

analyzer = Agent(
    'openai:gpt-4o-mini',
    result_type=ProductAnalysis,
    instructions='Analyze product reviews and return structured insights.'
)

result = analyzer.run_sync(
    "Great product but shipping was very slow. The quality exceeded expectations!"
)

# Guaranteed Pydantic-validated output
print(result.output.sentiment)   # "positive"
print(result.output.score)       # 0.75
print(result.output.key_issues)  # ["slow shipping"]
```

#### Agent with Dependency Injection

```python
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext
import httpx

@dataclass
class Deps:
    http_client: httpx.AsyncClient
    weather_api_key: str

weather_agent = Agent(
    'openai:gpt-4o',
    deps_type=Deps,
    instructions='Provide weather information using the available tools.'
)

@weather_agent.tool
async def get_weather(ctx: RunContext[Deps], city: str) -> dict:
    """Get current weather for a city."""
    response = await ctx.deps.http_client.get(
        f"https://api.openweathermap.org/data/2.5/weather",
        params={"q": city, "appid": ctx.deps.weather_api_key}
    )
    return response.json()

# Usage
async def main():
    async with httpx.AsyncClient() as client:
        deps = Deps(http_client=client, weather_api_key="your-key")
        result = await weather_agent.run(
            "What's the weather like in Tokyo?",
            deps=deps
        )
        print(result.output)
```

#### Multi-Turn Conversation

```python
from pydantic_ai import Agent

assistant = Agent(
    'anthropic:claude-sonnet-4-6',
    instructions='You are a helpful coding assistant.'
)

async def chat_session():
    history = []
    
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit':
            break
        
        result = await assistant.run(user_input, message_history=history)
        print(f"Assistant: {result.output}")
        
        # Maintain conversation history
        history = result.all_messages()
```

### Pydantic AI Observability with Logfire

```python
import logfire
from pydantic_ai import Agent

# Initialize observability
logfire.configure()
logfire.instrument_pydantic_ai()

agent = Agent('openai:gpt-4o', instructions='...')

# All agent runs are automatically traced in Logfire:
# - Input/output tokens
# - Tool calls and results
# - Model selection
# - Errors and retries
result = agent.run_sync("Analyze this data...")
```

**Official URLs:**
- Docs: https://ai.pydantic.dev/
- GitHub: https://github.com/pydantic/pydantic-ai
- Logfire: https://logfire.pydantic.dev/

---

## Part 2: OpenAI Agents SDK

### Overview

OpenAI released its Agents SDK (previously "Swarm") as a production-ready framework for building agentic AI applications. The philosophy is **minimal abstraction** — a small set of primitives that compose cleanly without "framework magic."

**Core primitives:**
- `Agent`: An LLM with instructions, tools, and handoffs
- `Tool`: A function the agent can call
- `Handoff`: Agent can transfer control to another agent
- `Runner`: Executes agent loops with tracing

### Architecture

```
OpenAI Agents SDK Architecture:

Runner
  │
  ▼
Agent Loop:
  Agent (LLM + Instructions + Tools)
       │
       ├── Tool Call → Execute Tool → Return Result → Continue
       ├── Handoff → Transfer to Another Agent
       └── Final Response → Return to User

Multi-Agent:
Orchestrator Agent
    ├── Handoff → Specialist Agent A (Billing)
    ├── Handoff → Specialist Agent B (Technical)
    └── Handoff → Specialist Agent C (Returns)
```

### Code Examples

#### Basic Agent

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant.",
    model="gpt-4o-mini"
)

result = Runner.run_sync(agent, "What is the capital of France?")
print(result.final_output)
```

#### Agent with Tools

```python
from agents import Agent, Runner, function_tool
import httpx

@function_tool
def search_web(query: str) -> str:
    """Search the web for current information."""
    # Implementation here
    return f"Search results for: {query}"

@function_tool
def get_weather(city: str) -> dict:
    """Get current weather for a city."""
    resp = httpx.get(f"https://wttr.in/{city}?format=j1")
    return resp.json()

research_agent = Agent(
    name="Research Agent",
    instructions="""You are a research assistant. Use web search to find 
    current information. Always cite your sources.""",
    tools=[search_web, get_weather],
    model="gpt-4o"
)

result = Runner.run_sync(
    research_agent,
    "What's the weather in Singapore and what are today's top tech news?"
)
print(result.final_output)
```

#### Multi-Agent with Handoffs

```python
from agents import Agent, Runner, handoff

billing_agent = Agent(
    name="Billing Specialist",
    instructions="You handle billing questions, refunds, and payment issues.",
    model="gpt-4o-mini"
)

technical_agent = Agent(
    name="Technical Support",
    instructions="You handle technical issues, bugs, and feature questions.",
    model="gpt-4o-mini"
)

triage_agent = Agent(
    name="Triage Agent",
    instructions="""You are a customer service triage agent. Determine the 
    nature of the customer's issue and route to the appropriate specialist.
    
    - Billing/payment issues → billing agent
    - Technical problems → technical agent""",
    handoffs=[
        handoff(billing_agent),
        handoff(technical_agent)
    ],
    model="gpt-4o-mini"
)

result = Runner.run_sync(
    triage_agent,
    "I was charged twice for my subscription last month"
)
# Automatically routes to billing_agent
print(result.final_output)
```

#### Streaming with Tracing

```python
from agents import Agent, Runner, trace
import asyncio

agent = Agent(
    name="Streaming Agent",
    instructions="Be helpful and detailed.",
    model="gpt-4o"
)

async def main():
    with trace("my_workflow"):
        async for event in Runner.run_streamed(
            agent, "Explain quantum computing in 3 paragraphs"
        ):
            if event.type == "text_delta":
                print(event.delta, end="", flush=True)

asyncio.run(main())
```

**Official URLs:**
- Docs: https://openai.github.io/openai-agents-python/
- GitHub: https://github.com/openai/openai-agents-python

---

## Part 3: Letta (MemGPT)

### Overview

Letta (formerly MemGPT) is a platform for building **stateful agents** — AI that has persistent memory, can learn over time, and manages its own context window. The core innovation: agents actively manage their own memory, writing and retrieving information as needed rather than receiving all context upfront.

**Key innovation: Self-managed memory tiers**
- **In-context (core)**: Currently active memory, always visible
- **External archival**: Long-term storage the agent can search
- **Recall**: Conversation history with search capability

### Memory Architecture

```
Letta Agent Memory Model:

┌─────────────────────────────────────────────┐
│            Context Window                    │
│  ┌─────────────────────────────────────┐    │
│  │    Core Memory (In-Context)         │    │
│  │  persona: "I am Alex, an assistant" │    │
│  │  human:   "User prefers bullet pts" │    │
│  │  [custom memory blocks...]          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
         │ search/retrieve              │ save/write
         ▼                              ▼
┌──────────────────┐        ┌────────────────────┐
│  Archival Memory │        │  Recall Memory     │
│  (Vector Store)  │        │  (Conversation DB) │
│  - Long docs     │        │  - Past exchanges  │
│  - User prefs    │        │  - Task history    │
│  - KB articles   │        │  - Decisions made  │
└──────────────────┘        └────────────────────┘
```

### Letta v1 Agent Loop (2025 Rearchitecture)

In September 2025, Letta rearchitected its agent loop to better align with frontier reasoning models (Claude, GPT-4o). The new loop:

```
User Message
     │
     ▼
┌─────────────┐
│  Think      │  (Reasoning step — may use extended thinking)
└─────────────┘
     │
     ▼
┌─────────────┐
│  Tool Call  │  (Memory read/write, external APIs, etc.)
└─────────────┘
     │
     ▼
┌─────────────┐
│  Respond    │  (or loop back to Think)
└─────────────┘
```

### Code Example: Building a Stateful Agent

```python
from letta_client import Letta

# Initialize Letta client
client = Letta(base_url="http://localhost:8283")

# Create a stateful agent
agent_state = client.agents.create(
    name="personal-assistant",
    model="claude-sonnet-4-6",
    embedding="text-embedding-3-small",
    
    # Initial memory blocks
    memory_blocks=[
        {
            "label": "persona",
            "value": "I am Alex, a personalized AI assistant. I remember user preferences and past conversations."
        },
        {
            "label": "human", 
            "value": "New user — learning preferences over time."
        }
    ],
    
    # Tools available
    tools=["web_search", "send_message", "archival_memory_search", "archival_memory_insert"]
)

print(f"Agent ID: {agent_state.id}")

# Send message — agent persists memory across sessions
response = client.agents.messages.create(
    agent_id=agent_state.id,
    messages=[{
        "role": "user",
        "content": "My name is John and I prefer responses in bullet points."
    }]
)

# Later session — agent remembers
response2 = client.agents.messages.create(
    agent_id=agent_state.id,
    messages=[{
        "role": "user",
        "content": "What do you know about me?"
    }]
)
# Agent responds: "• Your name is John\n• You prefer bullet point format..."
```

### Memory Omni-Tool (2025)

Letta introduced the memory "omni-tool" with Claude Sonnet 4.5, allowing the agent to use a single tool to manage all memory operations:

```python
# Agent internally uses memory_manage tool
{
    "tool": "memory_manage",
    "action": "write",
    "memory_block": "human",
    "content": "John prefers bullet points. Works in software engineering."
}
```

### Letta REST API

```python
import requests

# Create agent
resp = requests.post("http://localhost:8283/v1/agents", json={
    "name": "support-agent",
    "model": "openai/gpt-4o-mini",
    "memory_blocks": [{"label": "persona", "value": "Support specialist"}]
})
agent_id = resp.json()["id"]

# Chat
resp = requests.post(f"http://localhost:8283/v1/agents/{agent_id}/messages", json={
    "messages": [{"role": "user", "content": "How do I reset my password?"}]
})
print(resp.json()["messages"][-1]["content"])
```

**Official URLs:**
- GitHub: https://github.com/letta-ai/letta
- Docs: https://docs.letta.com/
- Blog: https://www.letta.com/blog

---

## Part 4: Strands Agents (AWS)

### Overview

Strands Agents, released by AWS in May 2025, takes the most **opinionated minimal-code approach**: define a prompt, list tools, let the model drive everything. Already used in production by Amazon Q Developer, AWS Glue, and VPC Reachability Analyzer.

**Core philosophy:** Modern LLMs have reasoning and tool use natively — frameworks should enable rather than dictate.

### Architecture

```
Strands Agent = Model + Tools + System Prompt

     User Request
          │
          ▼
    ┌──────────┐
    │  Model   │  (Plan, Reason, Decide)
    │          │
    │  Uses:   │
    │ - Tools  │──▶ Execute Tool ──▶ Return Result
    │ - Memory │
    │ - Prompt │
    └──────────┘
          │
          ▼
    Final Response
```

### Code Examples

#### Minimal Agent

```python
from strands import Agent
from strands_tools import http_request, calculator

agent = Agent(
    model="us.anthropic.claude-sonnet-4-5-20251001-v1:0",
    tools=[http_request, calculator],
    system_prompt="You are a research assistant with web access."
)

# That's it — model drives all planning and execution
response = agent("What is the current price of Bitcoin and convert it to SGD?")
print(response)
```

#### Custom Tools

```python
from strands import Agent, tool

@tool
def query_database(sql: str) -> list[dict]:
    """Execute a SQL query and return results."""
    import sqlite3
    conn = sqlite3.connect("business.db")
    cursor = conn.execute(sql)
    return [dict(row) for row in cursor.fetchall()]

@tool
def send_slack_message(channel: str, message: str) -> bool:
    """Send a message to a Slack channel."""
    import slack_sdk
    client = slack_sdk.WebClient(token=os.environ["SLACK_TOKEN"])
    client.chat_postMessage(channel=channel, text=message)
    return True

business_agent = Agent(
    model="anthropic.claude-3-5-sonnet-20241022-v2:0",
    tools=[query_database, send_slack_message],
    system_prompt="""You are a business intelligence agent. 
    Query data and report findings via Slack."""
)

response = business_agent(
    "Find all orders over $10,000 this month and notify #sales-team"
)
```

#### Multi-Agent with Strands

```python
from strands import Agent
from strands.multiagent import swarm, orchestrator

# Define specialist agents
researcher = Agent(
    model="claude-haiku-3-5",
    tools=[web_search, wikipedia],
    system_prompt="You research and gather information."
)

writer = Agent(
    model="claude-sonnet-4-6",
    tools=[spellcheck, format_markdown],
    system_prompt="You write clear, engaging content."
)

# Orchestrator coordinates specialists
coordinator = orchestrator(
    model="claude-sonnet-4-6",
    agents={"researcher": researcher, "writer": writer},
    system_prompt="Coordinate research and writing tasks."
)

report = coordinator("Write a report on AI in healthcare in 2025")
```

### AWS Integration

Strands integrates natively with AWS services:

```python
from strands import Agent
from strands.models.bedrock import BedrockModel
from strands_tools import aws_tools  # S3, DynamoDB, Lambda tools

model = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-5-20251001-v1:0",
    region_name="us-east-1"
)

aws_agent = Agent(
    model=model,
    tools=aws_tools,
    system_prompt="You manage AWS infrastructure."
)

response = aws_agent(
    "List all S3 buckets and identify any without versioning enabled"
)
```

**Official URLs:**
- GitHub: https://github.com/strands-agents/sdk-python
- Docs: https://strandsagents.com/latest/
- AWS Blog: https://aws.amazon.com/blogs/opensource/introducing-strands-agents-an-open-source-ai-agents-sdk/

---

## Part 5: Bee Agent Framework (IBM)

### Overview

IBM's Bee Agent Framework, released in 2024–2025, is an enterprise-grade TypeScript framework for building AI agents. Designed for IBM's Granite models but supports all major providers.

**Key features:**
- TypeScript-first with full type safety
- LangChain compatibility layer
- IBM Granite model optimization
- Enterprise memory backends (Redis, PostgreSQL)
- Built-in GPTQ quantization support
- OpenTelemetry tracing

### Architecture

```
Bee Agent Framework:

BeeAgent
    │
    ├── LLM (Granite, OpenAI, WatsonX)
    ├── Memory (Sliding Window, Token Buffer, Summarize)
    ├── Tools (Search, Calculator, Python, Custom)
    ├── ReAct Loop (Reason → Act → Observe)
    └── Logger (OpenTelemetry)
```

### Code Example

```typescript
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { DuckDuckGoSearchTool } from "bee-agent-framework/tools/search/duckDuckGoSearch";
import { CalculatorTool } from "bee-agent-framework/tools/calculator";

const llm = new OllamaChatLLM({
  modelId: "granite3.1-dense:8b",
});

const agent = new BeeAgent({
  llm,
  memory: new TokenMemory({ llm }),
  tools: [
    new DuckDuckGoSearchTool(),
    new CalculatorTool(),
  ],
});

const response = await agent
  .run({ prompt: "How much is 42 * 1337?" })
  .observe((emitter) => {
    emitter.on("update", async ({ data, update, meta }) => {
      console.log(`Step ${meta.iteration}: ${update.key} = ${update.value}`);
    });
  });

console.log(`Agent: ${response.result.text}`);
```

### IBM WatsonX Integration

```typescript
import { WatsonXChatLLM } from "bee-agent-framework/adapters/watsonx/chat";

const llm = new WatsonXChatLLM({
  modelId: "ibm/granite-3-1-8b-instruct",
  projectId: process.env.WATSONX_PROJECT_ID,
  parameters: {
    temperature: 0.0,
    max_new_tokens: 2000,
  }
});
```

**Official URLs:**
- GitHub: https://github.com/i-am-bee/bee-agent-framework
- Docs: https://i-am-bee.github.io/bee-agent-framework/
- IBM Research: https://research.ibm.com/blog/bee-agent-framework

---

## Part 6: Magentic-One (Microsoft)

### Overview

Magentic-One is Microsoft's multi-agent framework for **generalist task completion** — designed to handle real-world tasks that require a team of specialist agents working together. Unlike single-agent systems, Magentic-One coordinates agents with different capabilities (web browsing, code execution, file handling) under an orchestrator.

### Agent Team Architecture

```
Magentic-One System:

Orchestrator (Plans + Coordinates)
    │
    ├── WebSurfer (Browser automation, web navigation)
    ├── FileSurfer (File system operations, reading docs)
    ├── Coder (Code writing and execution)
    └── ComputerTerminal (Terminal commands, scripts)
```

### Key Design Principles

1. **Closed-loop**: Each action reports back to orchestrator for replanning
2. **Task Ledger**: Shared record of what's been done, what's left
3. **Progress Checks**: Orchestrator evaluates progress and replans if stuck
4. **No hard-coded flows**: LLM-driven dynamic planning

### Code Example

```python
from autogen_ext.teams.magentic_one import MagenticOne
from autogen_ext.models.openai import OpenAIChatCompletionClient

client = OpenAIChatCompletionClient(model="gpt-4o")

# MagenticOne creates all specialist agents automatically
magntic_one = MagenticOne(client=client)

task = """
Find the latest AI news from the past week, 
write a 500-word summary, and save it as ai_news.md
"""

await Console(magntic_one.run_stream(task=task))
```

### Benchmark Performance

Magentic-One achieved state-of-the-art results on:
- **GAIA benchmark**: 38% (generalist AI assistant tasks)
- **AssistantBench**: 35.8% on hard web tasks
- **WebArena**: Competitive web automation performance

**Official URLs:**
- GitHub: https://github.com/microsoft/autogen/tree/main/python/packages/autogen-ext/src/autogen_ext/teams/magentic_one
- Paper: https://arxiv.org/abs/2411.04468
- Microsoft Blog: https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/

---

## Framework Comparison Matrix

| Criterion | Pydantic AI | OpenAI SDK | Letta | Strands | Bee | Magentic-One |
|-----------|-------------|------------|-------|---------|-----|--------------|
| Learning curve | Low | Very Low | Medium | Very Low | Medium | Medium |
| Type safety | ✅ Excellent | ⚠️ Good | ⚠️ Moderate | ✅ Good | ✅ Excellent | ⚠️ Moderate |
| Multi-agent | ⚠️ Manual | ✅ Handoffs | ⚠️ Limited | ✅ Orchestrator | ⚠️ Manual | ✅ Native |
| Memory/state | ❌ Stateless | ❌ Stateless | ✅ Core feature | ⚠️ Pluggable | ✅ Multiple | ❌ Session-only |
| Model support | Wide | OpenAI-focused | Wide | AWS/all | IBM/Wide | OpenAI/Wide |
| Production use | ✅ Yes | ✅ Yes | ✅ Yes | ✅ AWS prod | ✅ Enterprise | ⚠️ Research/beta |
| Observability | ✅ Logfire | ✅ Built-in | ⚠️ Basic | ⚠️ Custom | ✅ OpenTelemetry | ⚠️ Basic |

---

## Selection Guide

### Choose Pydantic AI when:
- Python team values type safety and IDE support
- Mixed LLM providers, want to switch easily
- Structured outputs are central to the use case
- Logfire observability is valuable

### Choose OpenAI Agents SDK when:
- Primarily using OpenAI models
- Simplicity and minimal abstraction preferred
- Multi-agent handoffs are needed
- Production-ready but lightweight

### Choose Letta when:
- Agents need persistent memory across sessions
- Users have evolving preferences/context
- Personal assistant or long-term relationship use cases
- Self-managing context window is important

### Choose Strands when:
- AWS-native deployment on Bedrock
- Want minimal boilerplate
- Multi-model flexibility is important
- Team likes model-driven approach

### Choose Bee when:
- TypeScript/Node.js stack
- IBM WatsonX or Granite models
- Enterprise compliance requirements
- LangChain compatibility desired

### Choose Magentic-One when:
- Complex multi-step tasks requiring different capabilities
- Web automation + code execution + file handling needed
- Generalist task completion is the goal
- Microsoft ecosystem integration
