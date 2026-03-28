# HuggingFace smolagents — Comprehensive Research Guide

> **Last Updated:** March 2025 | **Launched:** December 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Philosophy — Why Code Agents?](#philosophy)
3. [Architecture](#architecture)
4. [CodeAgent — The Primary Agent Type](#codeagent)
5. [ToolCallingAgent — JSON-Based Tool Use](#toolcallingagent)
6. [CodeAgent vs ToolCallingAgent Comparison](#comparison)
7. [Tools — Building & Using](#tools)
8. [Multi-Agent Orchestration & ManagedAgent](#multiagent)
9. [Model Integration](#models)
10. [Secure Code Execution](#security)
11. [CLI Tools](#cli)
12. [Hub Integration](#hub)
13. [Code Examples](#code-examples)
14. [Benchmarks & Research](#benchmarks)
15. [Pros & Cons](#pros-cons)
16. [Official URLs](#official-urls)

---

## Overview

**smolagents** is HuggingFace's open-source Python library for building AI agents that "think in code." Launched in December 2024, it takes a radical minimalist approach: the entire agent logic fits in approximately **1,000 lines of code** in `agents.py`.

The library's central innovation is the **CodeAgent** — an agent that expresses its actions as Python code snippets rather than JSON tool-call descriptions. This approach, backed by multiple research papers, demonstrably improves agent performance on complex tasks.

### Key Stats

- **~1,000 lines** for core agent logic
- **Model-agnostic** — works with HuggingFace, OpenAI, Anthropic, local models
- **Tool-agnostic** — MCP servers, LangChain tools, HuggingFace Spaces as tools
- **Modality-agnostic** — text, vision, video, audio
- Supports **multi-agent orchestration** via `ManagedAgent`
- Free and open source (Apache 2.0)

---

## Philosophy — Why Code Agents? {#philosophy}

### The Agency Spectrum

smolagents categorizes agents by their level of agency:

| Agency Level | Description | Pattern |
|---|---|---|
| ☆☆☆ | LLM output has no impact on flow | `process_llm_output(response)` |
| ★☆☆ | LLM determines basic control flow | Router: `if llm_decision(): path_a()` |
| ★★☆ | LLM determines function execution | Tool call: `run_function(llm_chosen_tool, args)` |
| ★★★ | LLM controls iteration and continuation | Multi-step: `while llm_should_continue(): next_step()` |
| ★★★ | Agentic workflows start other workflows | Multi-agent: `if llm_trigger(): execute_agent()` |

### Why Code > JSON for Actions

The traditional approach (used by OpenAI, Anthropic, LangChain) is:

```json
// JSON-based tool call
{
  "tool": "search",
  "arguments": {"query": "weather in Paris"}
}
```

smolagents's CodeAgent approach:

```python
# Code-based action
results = search("weather in Paris")
temperature = parse_temperature(results)
if temperature > 20:
    recommendation = "wear light clothes"
print(f"Temperature: {temperature}°C. Tip: {recommendation}")
```

### Why Code is Better

Multiple research papers back this:

1. **"Executable Code Actions Elicit Better LLM Agents"** (2024) — showed code actions significantly outperform JSON on complex multi-step tasks
2. **Natural composability** — code supports nesting, loops, conditionals inherently
3. **Reuse and abstraction** — variables and intermediate results can be referenced
4. **Parallel execution** — multiple tools can be called in a single step
5. **Rich ecosystem** — access to the entire Python ecosystem

Example of composability advantage:

```python
# Code agent can do this in ONE step:
prices = [get_stock_price(ticker) for ticker in ["AAPL", "GOOGL", "MSFT"]]
total = sum(prices)
average = total / len(prices)
print(f"Portfolio average: ${average:.2f}")

# JSON agent would need 3+ separate turns (one per stock)
```

---

## Architecture {#architecture}

### Core Loop

```
┌─────────────────────────────────────────────────┐
│              Agent Loop (ReAct)                  │
│                                                  │
│  1. Receive task/observation                     │
│  2. LLM generates THOUGHT + ACTION               │
│  3. ACTION = Python code snippet                 │
│  4. Execute code in sandbox                      │
│  5. Capture OBSERVATION (output/error)           │
│  6. Add to memory                                │
│  7. Repeat until final answer                    │
└─────────────────────────────────────────────────┘
```

### MultiStepAgent Base Class

Both `CodeAgent` and `ToolCallingAgent` inherit from `MultiStepAgent`:

```python
class MultiStepAgent:
    def __init__(self, tools, model, max_steps=10):
        self.tools = tools
        self.model = model
        self.max_steps = max_steps
    
    def run(self, task: str) -> str:
        memory = [SystemPromptStep(), TaskStep(task)]
        
        for step in range(self.max_steps):
            action = self.model(memory)  # LLM decides next action
            
            if action.is_final_answer:
                return action.answer
            
            observation = self.execute(action)  # Run code or tool call
            memory.append(ActionStep(action, observation))
        
        return "Max steps reached"
```

---

## CodeAgent — The Primary Agent Type {#codeagent}

`CodeAgent` is the flagship agent that writes Python code as its action format:

### Basic Usage

```python
from smolagents import CodeAgent, InferenceClientModel, DuckDuckGoSearchTool

model = InferenceClientModel()  # Default HF model
agent = CodeAgent(
    tools=[DuckDuckGoSearchTool()],
    model=model,
    max_steps=10,
    additional_authorized_imports=["pandas", "numpy"],  # Allow extra imports
    stream_outputs=True,    # Stream thinking/code
    verbosity_level=2,      # Show detailed logs
)

result = agent.run("What is the GDP per capita of Singapore vs Japan in 2024?")
```

### What the LLM Generates (Action Format)

At each step, the LLM generates a "thought" followed by a Python code block:

```
Thought: I need to search for GDP per capita data for Singapore and Japan.

Code:
```python
singapore = web_search("Singapore GDP per capita 2024")
japan = web_search("Japan GDP per capita 2024")
print(f"Singapore: {singapore[:500]}")
print(f"Japan: {japan[:500]}")
```<end_code>
```

### CodeAgent Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tools` | `List[Tool]` | Available tools |
| `model` | `Model` | LLM backend |
| `max_steps` | `int` | Max iterations (default: 20) |
| `additional_authorized_imports` | `List[str]` | Extra Python imports allowed |
| `planning_interval` | `int` | Produce plan every N steps |
| `stream_outputs` | `bool` | Stream code/outputs |
| `verbosity_level` | `int` | Logging verbosity (0-2) |
| `managed_agents` | `List[ManagedAgent]` | Sub-agents available as tools |
| `memory` | `AgentMemory` | Custom memory implementation |

### Authorized Imports Security Model

By default, only these imports are allowed in code:
```python
# Always allowed
import os, sys, math, json, re, datetime, pathlib, typing, ...

# Controlled via additional_authorized_imports
agent = CodeAgent(
    tools=[],
    model=model,
    additional_authorized_imports=["pandas", "numpy", "matplotlib"]
)
```

---

## ToolCallingAgent — JSON-Based Tool Use {#toolcallingagent}

`ToolCallingAgent` is the classic approach, using the model's built-in tool-calling API:

### Basic Usage

```python
from smolagents import ToolCallingAgent, LiteLLMModel, DuckDuckGoSearchTool

model = LiteLLMModel(model_id="gpt-4o")
agent = ToolCallingAgent(
    tools=[DuckDuckGoSearchTool()],
    model=model,
)

result = agent.run("What is the current weather in Tokyo?")
```

### What Happens Internally

The model generates a JSON tool call:
```json
{
  "name": "web_search",
  "arguments": {"query": "current weather Tokyo 2025"}
}
```

The framework parses this and executes the tool, returning the result to the model.

### When to Use ToolCallingAgent

- When the model (like GPT-4o) has excellent native tool-calling
- When actions are simple single-tool calls
- When you need maximum compatibility with model providers
- When code execution is not desired or needed

---

## CodeAgent vs ToolCallingAgent Comparison {#comparison}

| Aspect | CodeAgent | ToolCallingAgent |
|--------|-----------|------------------|
| **Action format** | Python code | JSON tool call |
| **Composability** | Excellent (native Python) | Limited (one tool per step) |
| **Parallelism** | Yes (multiple tools per step) | No (one at a time) |
| **Computation** | Yes (arbitrary Python) | Only via tools |
| **Security risk** | Higher (code execution) | Lower (just function calls) |
| **Model requirements** | Code generation ability | Tool-calling API |
| **Debugging** | Easier (readable code) | Moderate |
| **Performance** | Better on complex tasks | Sufficient for simple tasks |
| **Variable reuse** | Yes (Python variables) | No |
| **Recommended for** | Complex multi-step tasks | Simple tool-use tasks |

### Research Evidence

The paper "Executable Code Actions Elicit Better LLM Agents" demonstrates:
- Code actions achieve **higher task completion rates** on multi-step reasoning
- Code allows **reusing intermediate results** without extra LLM calls
- Natural **error handling** via Python exceptions
- Better **generalization** to novel task patterns

---

## Tools — Building & Using {#tools}

### Built-in Tools

```python
from smolagents import (
    DuckDuckGoSearchTool,   # Web search
    WebSearchTool,          # Generic web search
    VisitWebpageTool,       # Fetch webpage content
    WikipediaSearchTool,    # Wikipedia search
)
```

### Custom Tool via @tool Decorator

```python
from smolagents import tool

@tool
def get_stock_price(ticker: str) -> float:
    """
    Get the current stock price for a given ticker symbol.
    
    Args:
        ticker: Stock ticker symbol (e.g., AAPL, GOOGL)
    
    Returns:
        Current stock price in USD
    """
    import yfinance as yf
    stock = yf.Ticker(ticker)
    return stock.history(period="1d")["Close"].iloc[-1]

# Use in agent
agent = CodeAgent(
    tools=[get_stock_price],
    model=model,
)
```

### Custom Tool via Class

```python
from smolagents import Tool

class TranslationTool(Tool):
    name = "translate"
    description = "Translate text from one language to another"
    inputs = {
        "text": {"type": "string", "description": "Text to translate"},
        "target_lang": {"type": "string", "description": "Target language code (e.g., 'fr', 'es')"},
    }
    output_type = "string"
    
    def forward(self, text: str, target_lang: str) -> str:
        # Your translation implementation
        from googletrans import Translator
        translator = Translator()
        result = translator.translate(text, dest=target_lang)
        return result.text
```

### Loading Tools from External Sources

```python
from smolagents import ToolCollection

# From an MCP server
tools = ToolCollection.from_mcp(
    {"url": "http://localhost:3001/mcp"},
    trust_remote_code=True
)

# From LangChain
from langchain_community.tools import TavilySearchResults
from smolagents import Tool

langchain_tool = TavilySearchResults(max_results=3)
smolagents_tool = Tool.from_langchain(langchain_tool)

# From HuggingFace Hub Space
image_gen_tool = Tool.from_space(
    space_id="black-forest-labs/FLUX.1-schnell",
    name="image_generator",
    description="Generates an image based on a prompt",
    api_name="/infer",
)

# Share your tool to Hub
my_tool.push_to_hub("username/my-tool")
loaded_tool = Tool.from_hub("username/my-tool")
```

---

## Multi-Agent Orchestration & ManagedAgent {#multiagent}

smolagents supports multi-agent systems through `ManagedAgent`:

### ManagedAgent Concept

A `ManagedAgent` wraps any agent and makes it available as a **tool** for an orchestrator agent. The orchestrator can then delegate tasks to specialized sub-agents.

```python
from smolagents import CodeAgent, ManagedAgent, InferenceClientModel, DuckDuckGoSearchTool

model = InferenceClientModel()

# Specialist agents
research_agent = CodeAgent(
    tools=[DuckDuckGoSearchTool()],
    model=model,
)

# Wrap as ManagedAgent (makes it callable as a tool)
managed_researcher = ManagedAgent(
    agent=research_agent,
    name="web_researcher",
    description="""A specialized research agent that can search the web.
    Use it when you need up-to-date information on any topic.
    Input: A research question or topic.
    Output: Synthesized research findings.""",
)

# Orchestrator agent
orchestrator = CodeAgent(
    tools=[],
    model=model,
    managed_agents=[managed_researcher],  # Sub-agents available as tools
)

# The orchestrator can now call web_researcher like a tool
result = orchestrator.run(
    "Research quantum computing advances in 2025 and summarize the top 3 breakthroughs."
)
```

### Multi-Agent Architecture Pattern

```python
# Complex pipeline with multiple specialists
image_agent = CodeAgent(
    tools=[image_generation_tool],
    model=model,
)

code_agent = CodeAgent(
    tools=[python_executor],
    model=model,
    additional_authorized_imports=["pandas", "matplotlib"],
)

data_agent = CodeAgent(
    tools=[database_tool],
    model=model,
)

# Wrap each
managed_image = ManagedAgent(image_agent, "image_creator", 
                              "Creates images from descriptions")
managed_code = ManagedAgent(code_agent, "code_runner",
                             "Runs Python data analysis code")  
managed_data = ManagedAgent(data_agent, "data_fetcher",
                             "Retrieves data from databases")

# Master orchestrator
master = CodeAgent(
    tools=[],
    model=model,
    managed_agents=[managed_image, managed_code, managed_data],
)

result = master.run(
    """Analyze our sales data from Q1 2025, 
    create a visualization, and generate a cover image for the report."""
)
```

### Hierarchical vs Flat Multi-Agent

```python
# Hierarchical: orchestrator delegates to sub-agents
orchestrator → [researcher, coder, writer]

# Flat/Pipeline: agents are chained
researcher.run(task1) → coder.run(task2, context=research) → ...

# Mixed: orchestrator with some managed, some sequential
orchestrator → managed_researcher
orchestrator → sequential_pipeline([coder, tester])
```

---

## Model Integration {#models}

smolagents is model-agnostic with multiple integration options:

### HuggingFace Inference (Default)

```python
from smolagents import InferenceClientModel

# Default model via HF Inference API
model = InferenceClientModel()

# Specific model
model = InferenceClientModel(model_id="meta-llama/Llama-3.1-70B-Instruct")

# Specific provider (Together, Fireworks, etc.)
model = InferenceClientModel(
    model_id="deepseek-ai/DeepSeek-R1",
    provider="together",
    token="hf_xxx",
)
```

### OpenAI / Anthropic / 100+ via LiteLLM

```python
from smolagents import LiteLLMModel

# OpenAI
model = LiteLLMModel(model_id="gpt-4o")

# Anthropic
model = LiteLLMModel(
    model_id="anthropic/claude-opus-4-6-latest",
    api_key=os.environ["ANTHROPIC_API_KEY"]
)

# Any LiteLLM-supported model
model = LiteLLMModel(model_id="cohere/command-r-plus")
```

### Local Models

```python
from smolagents import TransformersModel

# Local transformers model
model = TransformersModel(
    model_id="Qwen/Qwen2.5-Coder-7B-Instruct",
    device_map="auto",
    max_new_tokens=4096,
)

# Ollama
from smolagents import OpenAIModel
model = OpenAIModel(
    model_id="llama3.1",
    api_base="http://localhost:11434/v1/",
    api_key="ollama",  # Dummy key
)
```

### Azure OpenAI

```python
from smolagents import AzureOpenAIModel

model = AzureOpenAIModel(
    model_id=os.environ["AZURE_OPENAI_MODEL"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    api_version=os.environ["OPENAI_API_VERSION"],
)
```

---

## Secure Code Execution {#security}

CodeAgent executes Python code, requiring sandboxing for security:

### Execution Environments

| Environment | Security | Use Case |
|-------------|----------|----------|
| Local (default) | Low — runs in-process | Development only |
| Docker | High — isolated container | Recommended for production |
| E2B | High — cloud sandbox | Serverless production |
| Modal | High — cloud sandbox | High-scale production |
| Blaxel | High — managed sandbox | Enterprise |
| Pyodide+Deno (WASM) | High — browser-isolated | Edge/browser deployments |

### Docker Execution

```python
from smolagents import CodeAgent, InferenceClientModel
from smolagents.docker_executor import DockerExecutor

# Spin up a Docker sandbox
executor = DockerExecutor(image="python:3.12-slim")

agent = CodeAgent(
    tools=[],
    model=InferenceClientModel(),
    executor=executor,
    additional_authorized_imports=["pandas", "numpy"],
)
```

### E2B Sandbox

```python
from smolagents.e2b_executor import E2BExecutor

executor = E2BExecutor(api_key=os.environ["E2B_API_KEY"])

agent = CodeAgent(
    tools=[DuckDuckGoSearchTool()],
    model=model,
    executor=executor,
)
```

---

## CLI Tools {#cli}

smolagents ships with two CLI commands:

### smolagent — General Purpose

```bash
# Basic usage
smolagent "Plan a trip to Tokyo, Kyoto and Osaka from March 28 to April 7"

# With specific model
smolagent "Analyze this dataset" \
  --model-type "InferenceClientModel" \
  --model-id "meta-llama/Llama-3.1-70B-Instruct" \
  --imports pandas numpy \
  --tools web_search

# Interactive mode
smolagent  # Launches setup wizard
```

### webagent — Web Browsing

```bash
# Automated web browsing using Playwright
webagent "Go to amazon.com, find the best-rated laptop under $1000, get specs and price" \
  --model-type "LiteLLMModel" \
  --model-id "gpt-4o"
```

---

## Hub Integration {#hub}

One unique feature of smolagents is seamless HuggingFace Hub integration:

```python
# Share agent to Hub
agent = CodeAgent(tools=[my_tool], model=model)
agent.push_to_hub("username/my-research-agent")

# Load agent from Hub
loaded_agent = CodeAgent.from_hub("username/my-research-agent")

# Share tools
my_tool.push_to_hub("username/my-custom-tool")
loaded_tool = Tool.from_hub("username/my-custom-tool")

# Use Hub Space as tool
space_tool = Tool.from_space(
    space_id="stabilityai/stable-diffusion-3-medium",
    name="image_gen",
    description="Generate images",
    api_name="/infer",
)
```

---

## Code Examples {#code-examples}

### Complete Research Agent

```python
from smolagents import (
    CodeAgent, 
    InferenceClientModel, 
    DuckDuckGoSearchTool,
    VisitWebpageTool,
    tool,
)
import json

@tool
def save_report(content: str, filename: str) -> str:
    """Save a research report to a file.
    
    Args:
        content: The report content
        filename: Output filename (without extension)
    
    Returns:
        Confirmation message with file path
    """
    path = f"reports/{filename}.md"
    with open(path, "w") as f:
        f.write(content)
    return f"Report saved to {path}"

model = InferenceClientModel(model_id="meta-llama/Llama-3.1-70B-Instruct")

agent = CodeAgent(
    tools=[
        DuckDuckGoSearchTool(),
        VisitWebpageTool(),
        save_report,
    ],
    model=model,
    max_steps=15,
    additional_authorized_imports=["json", "re"],
    stream_outputs=True,
    verbosity_level=1,
)

result = agent.run("""
Research the current state of AI coding assistants in 2025.
Compare at least 3 major tools (GitHub Copilot, Cursor, etc.).
Include: features, pricing, performance benchmarks.
Save the final report as 'ai_coding_assistants_2025'.
""")

print(result)
```

### Multi-Agent Travel Planner

```python
from smolagents import CodeAgent, ManagedAgent, InferenceClientModel, tool
from typing import Optional

model = InferenceClientModel()

@tool
def get_flight_prices(origin: str, destination: str, date: str) -> str:
    """Get flight prices between cities on a given date."""
    # Your flight API implementation
    return f"Flights from {origin} to {destination} on {date}: $XXX-$XXX"

@tool
def get_hotel_prices(city: str, checkin: str, checkout: str) -> str:
    """Get hotel prices in a city for given dates."""
    return f"Hotels in {city} ({checkin} to {checkout}): $XX-$XXX/night"

@tool
def get_attractions(city: str) -> str:
    """Get top tourist attractions in a city."""
    return f"Top attractions in {city}: ..."

# Specialist agents
flight_agent = CodeAgent(tools=[get_flight_prices], model=model)
hotel_agent = CodeAgent(tools=[get_hotel_prices], model=model)
activities_agent = CodeAgent(tools=[get_attractions], model=model)

# Wrap as ManagedAgents
managed_flights = ManagedAgent(
    flight_agent, "flight_specialist",
    "Finds best flight options between cities"
)
managed_hotels = ManagedAgent(
    hotel_agent, "hotel_specialist",
    "Finds accommodation options in cities"
)
managed_activities = ManagedAgent(
    activities_agent, "activities_specialist",
    "Recommends tourist attractions and activities"
)

# Orchestrator
travel_planner = CodeAgent(
    tools=[],
    model=model,
    managed_agents=[managed_flights, managed_hotels, managed_activities],
)

itinerary = travel_planner.run("""
Plan a 7-day trip to Japan for 2 people in April 2025.
Flying from Singapore.
Budget: $3000 total (excluding flights).
Include: flights, hotels in Tokyo + Kyoto, key activities.
Create a day-by-day itinerary.
""")

print(itinerary)
```

---

## Benchmarks & Research {#benchmarks}

### Performance Evidence

**"Executable Code Actions Elicit Better LLM Agents"** (Wang et al., 2024):
- Code actions outperform JSON/text actions on **ALFWorld** (+15%)
- Code actions outperform on **WebShop** (+12%)
- Code actions outperform on **Mind2Web** (+18%)
- Particularly effective for multi-step tasks requiring intermediate computation

### Model Performance (CodeAgent)

Based on community benchmarks (GAIA, HotpotQA):
- **GPT-4o + CodeAgent**: Best overall performance
- **Claude 3.5 Sonnet + CodeAgent**: Strong, especially for code-heavy tasks
- **Llama 3.1 70B + CodeAgent**: Best open-source performance
- **Qwen2.5-Coder 7B + CodeAgent**: Impressive for model size

### Comparison with Other Frameworks

| Framework | Agent Type | Code Actions | Open Models | Minimal Overhead |
|-----------|-----------|--------------|-------------|-----------------|
| smolagents | CodeAgent | ✅ First-class | ✅ Strong | ✅ ~1K LOC |
| LangGraph | Custom | ❌ Manual | ✅ Yes | ❌ Large |
| AutoGen | AssistantAgent | ✅ CodeExec | ✅ Yes | ❌ Complex |
| CrewAI | Agent | ❌ Via tools | ✅ Yes | ✅ Moderate |

---

## Pros & Cons {#pros-cons}

### Pros

✅ **Radical simplicity** — ~1,000 lines of core code, easy to understand and modify  
✅ **Code actions** — research-backed superior performance on complex tasks  
✅ **Model-agnostic** — HuggingFace, OpenAI, Anthropic, local, any LLM  
✅ **HuggingFace ecosystem** — Hub sharing, Spaces as tools, Inference Providers  
✅ **MCP support** — connect any MCP server as tool source  
✅ **LangChain tools** — import existing tool ecosystem  
✅ **Multi-agent** — ManagedAgent for hierarchical orchestration  
✅ **Security options** — Docker, E2B, Modal sandboxes  
✅ **CLI** — run agents without code via smolagent/webagent  
✅ **Open source** — full Apache 2.0, community-driven  
✅ **Streaming** — real-time output streaming  
✅ **Minimal abstractions** — easy to customize and extend  

### Cons

❌ **Newer library** — smaller ecosystem vs LangChain/AutoGen  
❌ **Code execution security** — requires explicit sandbox setup for production  
❌ **Less enterprise features** — no built-in deployment platform  
❌ **CodeAgent requires code-capable models** — weaker models produce poor code  
❌ **Limited production tooling** — no checkpointing, persistence built-in  
❌ **Documentation** — still maturing (launched Dec 2024)  
❌ **No visual IDE** — unlike AutoGen Studio or CrewAI AMP  
❌ **Memory system** — basic compared to more mature frameworks  

---

## Official URLs {#official-urls}

- **GitHub**: https://github.com/huggingface/smolagents
- **Documentation**: https://huggingface.co/docs/smolagents
- **Introductory Blog Post**: https://huggingface.co/blog/smolagents
- **HF Course - Agents Course**: https://huggingface.co/learn/agents-course
- **PyPI**: https://pypi.org/project/smolagents/
- **Research Paper (Code Actions)**: https://huggingface.co/papers/2402.01030
- **DeepWiki**: https://deepwiki.com/huggingface/smolagents
- **smolagents.org**: https://smolagents.org/

---

## Key Takeaways

1. **smolagents = radical minimalism** — designed to be understandable, not abstracted
2. **CodeAgent is the core innovation** — writing actions as Python code beats JSON tool calls
3. **Research-backed** — multiple papers confirm code actions outperform JSON actions
4. **Model-agnostic** — use any model, any provider, even local models
5. **ManagedAgent** enables multi-agent hierarchies without complex orchestration frameworks
6. **Security is opt-in** — choose your sandbox: Docker, E2B, Modal, or local (dev only)
7. Best for **developers who want control** and understand Python deeply
8. Launched December 2024 — rapidly maturing, watch for updates

---

*Research compiled March 2025. smolagents is actively developed by HuggingFace; check official docs for latest.*
