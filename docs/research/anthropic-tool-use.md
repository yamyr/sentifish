# Anthropic Claude Tool Use / Function Calling — Comprehensive Research Guide

> **Last Updated:** March 2025 | **Status:** Production-ready, continuously evolving

---

## Table of Contents

1. [Overview](#overview)
2. [How Tool Use Works — Core Mechanics](#how-it-works)
3. [Tool Definition Schema](#schema)
4. [Client Tools vs Server Tools](#client-vs-server)
5. [tool_choice — Controlling Tool Calls](#tool-choice)
6. [Parallel Tool Calls](#parallel)
7. [Handling Tool Results](#handling-results)
8. [Advanced Tool Features (2025)](#advanced)
9. [Computer Use — Beta](#computer-use)
10. [Building Agents with Claude API](#building-agents)
11. [MCP — Model Context Protocol](#mcp)
12. [Strict Tool Use](#strict)
13. [Code Examples](#code-examples)
14. [Benchmarks & Performance](#benchmarks)
15. [Comparisons](#comparisons)
16. [Pros & Cons](#pros-cons)
17. [Official URLs](#official-urls)

---

## Overview

**Claude tool use** (also called function calling) enables Claude to interact with external systems, APIs, and custom functions defined by developers. When given tools, Claude can decide when and how to invoke them to complete user tasks.

Tool use is the foundational primitive for building AI agents with Claude. Combined with an agent loop, tools allow Claude to:
- Search the web and retrieve information
- Execute code and perform calculations
- Read and write files
- Call external APIs
- Control computer interfaces
- Coordinate multi-step workflows

### What's Changed in 2024-2025

| Feature | Date | Description |
|---------|------|-------------|
| Computer use beta | October 2024 | Desktop automation capability |
| Computer use 2025 update | January 2025 | New actions: hold_key, scroll, triple_click, wait |
| Token-efficient tools beta | February 2025 | Reduced token overhead for parallel tools |
| Tool Search Tool | 2025 | On-demand tool discovery (85% token reduction) |
| Programmatic Tool Calling | 2025 | Tools invoked via code execution |
| Tool Use Examples | 2025 | `input_examples` for better tool understanding |
| Strict tool use | 2025 | `strict: true` for guaranteed schema conformance |
| Server tools | 2025 | web_search, code_execution, file_search, web_fetch |

---

## How Tool Use Works — Core Mechanics {#how-it-works}

### The Agentic Loop

```
1. Developer defines tools (JSON schema)
2. User sends message
3. Claude receives message + tool definitions
4. Claude decides: answer directly OR call tool(s)
   └─ If tool call: returns stop_reason="tool_use"
      with tool_use blocks in response
5. Developer's code executes the tool(s)
6. Developer sends tool results back as tool_result blocks
7. Claude incorporates results and responds
8. Repeat from step 3 until final answer
```

### Client vs Server Execution

```
Client Tools                    Server Tools
(you execute the code)          (Anthropic executes)
──────────────────────          ──────────────────────
• User-defined functions        • web_search
• Anthropic bash/editor tools   • code_execution
                                • file_search
                                • web_fetch
                                • tool_search

stop_reason: "tool_use"        Results returned inline
You must handle tool calls      No loop needed
```

### Stop Reasons

| `stop_reason` | Meaning |
|--------------|---------|
| `"end_turn"` | Claude finished with a natural response |
| `"tool_use"` | Claude wants to call one or more tools |
| `"max_tokens"` | Hit the max_tokens limit |
| `"stop_sequence"` | Hit a custom stop sequence |

---

## Tool Definition Schema {#schema}

### Minimal Tool Definition

```python
import anthropic

client = anthropic.Anthropic()

# Tool definition structure
tool = {
    "name": "get_weather",
    "description": "Get the current weather in a given location. Returns temperature, conditions, humidity, and wind speed. Should be used when the user asks about current weather or temperature for a specific location.",
    "input_schema": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The city and country, e.g. 'Singapore, SG' or 'London, UK'"
            },
            "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "Temperature unit. Use celsius for most countries, fahrenheit for US."
            }
        },
        "required": ["location"]
    }
}

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[tool],
    messages=[{"role": "user", "content": "What's the weather in Tokyo?"}]
)
```

### Full Tool Definition with Advanced Features (2025)

```python
tool_advanced = {
    "name": "github_create_pr",
    "description": """Create a new pull request on GitHub.
    Use this when you need to submit code changes for review.
    Required: repository, title, head branch, base branch.
    The PR will be created in draft mode unless explicitly set otherwise.
    Returns the PR number and URL on success.""",
    
    "input_schema": {
        "type": "object",
        "properties": {
            "repo": {"type": "string", "description": "Repository in format 'owner/repo'"},
            "title": {"type": "string", "description": "PR title (concise, descriptive)"},
            "head": {"type": "string", "description": "Branch containing changes"},
            "base": {"type": "string", "description": "Target branch (usually 'main')"},
            "body": {"type": "string", "description": "PR description in Markdown"},
            "draft": {"type": "boolean", "description": "Create as draft PR?"},
        },
        "required": ["repo", "title", "head", "base"]
    },
    
    # New 2025 features:
    "input_examples": [                  # Example inputs for complex tools
        {
            "repo": "anthropics/claude-examples",
            "title": "Add new example for tool use",
            "head": "feature/tool-examples",
            "base": "main",
            "body": "## Summary\nAdded comprehensive tool use examples.",
            "draft": True
        }
    ],
    "strict": True,                      # Guarantee schema conformance
    "defer_loading": True,               # For Tool Search Tool discovery
    "allowed_callers": ["orchestrator"],  # Restrict which agents can call
}
```

### Best Practices for Tool Descriptions

1. **Be specific about when to use it** — "Use when the user asks about X, NOT when they ask about Y"
2. **Describe parameters in detail** — format, valid values, side effects
3. **Mention what it does NOT return** — prevents hallucination of missing data
4. **State any limitations** — rate limits, data freshness, coverage
5. **Aim for 3-4+ sentences** — more context = better tool selection

---

## Client Tools vs Server Tools {#client-vs-server}

### Client Tools (User-Defined)

You define them, you execute them:

```python
# Your function
def get_database_record(table: str, record_id: str) -> dict:
    # Your actual database query
    return db.query(table, record_id)

# Define as tool
tool = {
    "name": "get_database_record",
    "description": "Retrieve a record from the database by table and ID",
    "input_schema": {
        "type": "object",
        "properties": {
            "table": {"type": "string"},
            "record_id": {"type": "string"}
        },
        "required": ["table", "record_id"]
    }
}

response = client.messages.create(
    model="claude-opus-4-6",
    tools=[tool],
    messages=[{"role": "user", "content": "Get user record 123"}]
)

# Check if tool was called
if response.stop_reason == "tool_use":
    for block in response.content:
        if block.type == "tool_use":
            result = get_database_record(**block.input)
            # Feed result back (see Handling Tool Results section)
```

### Anthropic-Defined Client Tools

Built-in tools that your code executes with Claude's schema:

```python
# bash_20250124 — Run bash commands
bash_tool = {"type": "bash_20250124", "name": "bash"}

# text_editor_20250124 — Edit files
editor_tool = {"type": "text_editor_20250124", "name": "str_replace_based_edit_tool"}

response = client.messages.create(
    model="claude-opus-4-6",
    tools=[bash_tool, editor_tool],
    messages=[{"role": "user", "content": "Create a Python script that prints hello world"}],
    betas=["computer-use-2025-01-24"],  # Required for these tools
)
```

### Server Tools (Anthropic Executes)

Anthropic handles execution; you just see results:

```python
# Web search — Anthropic queries the web
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    tools=[{"type": "web_search_20260209", "name": "web_search"}],
    messages=[{"role": "user", "content": "What's the latest on GPT-5?"}]
)
# No tool call handling needed — results are in response.content

# Code execution — Runs in Anthropic sandbox
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[{"type": "code_execution_20250522", "name": "code_execution"}],
    messages=[{"role": "user", "content": "Calculate the 100th Fibonacci number"}]
)
```

---

## tool_choice — Controlling Tool Calls {#tool-choice}

The `tool_choice` parameter controls when and how Claude uses tools:

```python
# auto (default) — Claude decides whether to use tools
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[tool1, tool2],
    tool_choice={"type": "auto"},  # Default
    messages=[...]
)

# any — Claude MUST use a tool (one of the provided tools)
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[tool1, tool2],
    tool_choice={"type": "any"},  # Must call at least one tool
    messages=[...]
)

# tool — Claude MUST call a SPECIFIC tool
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[get_weather, search_web],
    tool_choice={
        "type": "tool",
        "name": "get_weather"  # Force this specific tool
    },
    messages=[...]
)

# none — Claude CANNOT use any tools (despite having them defined)
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[tool1, tool2],
    tool_choice={"type": "none"},  # No tools despite being defined
    messages=[...]
)
```

### Tool Choice Use Cases

| Setting | When to Use |
|---------|-------------|
| `auto` | Normal agent behavior — let Claude decide |
| `any` | Force the agent to take action (not just talk) |
| `tool` (specific) | Extraction workflows — always use the schema |
| `none` | Give Claude context about tools but don't let it call them |

**Structured extraction with `tool_choice: tool`:**

```python
extract_tool = {
    "name": "extract_person_info",
    "description": "Extract structured person information from text",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "age": {"type": "integer"},
            "email": {"type": "string"},
            "location": {"type": "string"},
        },
        "required": ["name"]
    }
}

# Force extraction — always returns structured data
response = client.messages.create(
    model="claude-haiku-4-5",  # Cheaper for extraction
    tools=[extract_tool],
    tool_choice={"type": "tool", "name": "extract_person_info"},
    messages=[{
        "role": "user",
        "content": "John Smith, 34, lives in New York. john@example.com"
    }]
)

extracted = response.content[0].input
print(extracted)  # {"name": "John Smith", "age": 34, "email": "john@example.com", ...}
```

---

## Parallel Tool Calls {#parallel}

Claude can call multiple tools in a single response (parallel execution):

```python
import anthropic
import asyncio
import json

client = anthropic.Anthropic()

# When Claude calls multiple tools simultaneously
response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=4096,
    tools=[weather_tool, stock_tool, news_tool],
    messages=[{
        "role": "user",
        "content": "Get the weather in Tokyo, the AAPL stock price, and latest tech news"
    }]
)

# Response may contain MULTIPLE tool_use blocks
if response.stop_reason == "tool_use":
    tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
    
    # Execute all tool calls (potentially in parallel)
    async def execute_tools(tool_calls):
        results = {}
        tasks = []
        
        for tc in tool_calls:
            if tc.name == "get_weather":
                tasks.append(("weather", tc.id, asyncio.create_task(
                    get_weather_async(**tc.input)
                )))
            elif tc.name == "get_stock_price":
                tasks.append(("stock", tc.id, asyncio.create_task(
                    get_stock_async(**tc.input)
                )))
            elif tc.name == "search_news":
                tasks.append(("news", tc.id, asyncio.create_task(
                    search_news_async(**tc.input)
                )))
        
        for name, tool_call_id, task in tasks:
            result = await task
            results[tool_call_id] = result
        
        return results
    
    results = asyncio.run(execute_tools(tool_use_blocks))
    
    # Build tool results
    tool_result_content = [
        {
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": json.dumps(results[block.id])
        }
        for block in tool_use_blocks
    ]
    
    # Continue conversation
    final_response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        tools=[weather_tool, stock_tool, news_tool],
        messages=[
            {"role": "user", "content": "Get weather, AAPL price, and tech news"},
            {"role": "assistant", "content": response.content},
            {"role": "user", "content": tool_result_content}
        ]
    )
    
    print(final_response.content[0].text)
```

### Token-Efficient Tools (Beta, Feb 2025)

For models like Claude Sonnet 3.7, use the beta header to reduce token overhead:

```python
response = client.messages.create(
    model="claude-sonnet-4",
    tools=tools,
    messages=messages,
    betas=["token-efficient-tools-2025-02-19"],  # Reduces parallel tool token overhead
)
```

---

## Handling Tool Results {#handling-results}

### Complete Tool Result Loop

```python
import anthropic
import json

client = anthropic.Anthropic()

def process_tool_call(tool_name: str, tool_input: dict) -> str:
    """Execute a tool and return the result as a string."""
    if tool_name == "get_weather":
        return json.dumps({
            "temperature": 25,
            "conditions": "Partly cloudy",
            "humidity": 65,
            "wind_speed": "15 km/h"
        })
    elif tool_name == "search_database":
        records = db.search(**tool_input)
        return json.dumps(records)
    else:
        return f"Unknown tool: {tool_name}"

def run_agent(user_message: str, tools: list) -> str:
    """Run an agent loop until completion."""
    messages = [{"role": "user", "content": user_message}]
    
    while True:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            tools=tools,
            messages=messages,
        )
        
        # Done — no more tool calls
        if response.stop_reason == "end_turn":
            return response.content[0].text
        
        # Tool calls needed
        if response.stop_reason == "tool_use":
            # Add assistant's response to messages
            messages.append({
                "role": "assistant",
                "content": response.content
            })
            
            # Execute all tool calls and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = process_tool_call(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                        # Optional: mark as error
                        # "is_error": True,
                    })
            
            # Add tool results to messages
            messages.append({
                "role": "user",
                "content": tool_results
            })
        
        else:
            # Unexpected stop reason
            raise ValueError(f"Unexpected stop reason: {response.stop_reason}")

# Run it
result = run_agent(
    "What's the weather in Singapore and find all customer records from Singapore?",
    tools=[weather_tool, database_tool]
)
print(result)
```

### Error Handling in Tool Results

```python
# Return error result
tool_result = {
    "type": "tool_result",
    "tool_use_id": block.id,
    "content": "Error: API rate limit exceeded. Please try again in 60 seconds.",
    "is_error": True  # Signals to Claude this is an error
}

# Claude will acknowledge the error and adapt its response
```

---

## Advanced Tool Features (2025) {#advanced}

### 1. Tool Search Tool

Enables on-demand tool discovery from large libraries (85% token reduction):

```python
# Mark tools as deferred — not loaded upfront
tools_with_defer = [
    {
        "name": "github_create_pr",
        "description": "Create a GitHub pull request",
        "input_schema": {...},
        "defer_loading": True  # Only load when searched for
    },
    # ... many more tools
]

# Add the Tool Search Tool itself
tool_search = {
    "type": "tool_search_20250514",
    "name": "tool_search",
    "max_results": 5,  # Return up to 5 matching tools
}

response = client.messages.create(
    model="claude-opus-4-6",
    tools=[tool_search, *tools_with_defer],
    messages=[{"role": "user", "content": "Create a PR for my changes"}],
    betas=["tool-search-tool-2025-10-19"]
)
```

**Impact:** Opus 4 accuracy improved from 49% → 74% on MCP evaluations with large tool libraries.

### 2. Programmatic Tool Calling

Claude invokes tools via code execution (not separate API calls):

```python
# Enable programmatic tool calling
response = client.messages.create(
    model="claude-opus-4-6",
    tools=tools,
    messages=messages,
    betas=["programmatic-tool-calling-2025"],
)
# Claude writes and executes code to call tools,
# enabling loops, parallel calls, conditionals within a single inference
```

### 3. Tool Use Examples (`input_examples`)

Provide schema-validated examples for complex tools:

```python
tool = {
    "name": "send_email",
    "description": "Send an email message",
    "input_schema": {
        "type": "object",
        "properties": {
            "to": {"type": "array", "items": {"type": "string"}},
            "subject": {"type": "string"},
            "body": {"type": "string"},
            "cc": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["to", "subject", "body"]
    },
    "input_examples": [
        {
            "to": ["alice@example.com", "bob@example.com"],
            "subject": "Meeting tomorrow at 2pm",
            "body": "Hi team,\n\nJust a reminder about our meeting...",
            "cc": ["manager@example.com"]
        }
    ]
}
```

### 4. Strict Tool Use

Guarantee schema conformance — Claude's output always matches your JSON schema:

```python
tool = {
    "name": "structured_output",
    "description": "Return structured data",
    "input_schema": {...},
    "strict": True  # Guaranteed schema compliance
}

response = client.messages.create(
    model="claude-opus-4-6",
    tools=[tool],
    tool_choice={"type": "tool", "name": "structured_output"},
    messages=[...],
)
# output will ALWAYS match the input_schema exactly
```

### 5. `defer_loading` and `allowed_callers`

For multi-agent systems:

```python
# Only allow specific agents to call this tool
sensitive_tool = {
    "name": "execute_payment",
    "description": "Process a payment",
    "input_schema": {...},
    "allowed_callers": ["payment_orchestrator"],  # Whitelist
    "defer_loading": True,  # Don't preload in context
}
```

---

## Computer Use — Beta {#computer-use}

Claude can control desktop environments via the Computer Use tool:

### Capabilities

- **Screenshot capture** — see what's on screen
- **Mouse control** — click, drag, scroll
- **Keyboard input** — type text, use shortcuts
- **Desktop automation** — interact with any application

### New Actions (2025 Update)

| Action | Description |
|--------|-------------|
| `screenshot` | Capture current screen |
| `left_click` | Click at coordinates |
| `double_click` | Double-click |
| `triple_click` | Triple-click (select all text) |
| `right_click` | Right-click context menu |
| `left_mouse_down` | Hold mouse button |
| `left_mouse_up` | Release mouse button |
| `drag` | Click and drag |
| `type` | Type text |
| `key` | Press keyboard key/combo |
| `hold_key` | Hold a key |
| `scroll` | Scroll in any direction |
| `wait` | Pause execution |
| `cursor_position` | Get current cursor location |

### Computer Use Example

```python
import anthropic
import base64

client = anthropic.Anthropic()

async def sampling_loop(model: str, messages: list, api_key: str, max_iterations: int = 10):
    """Agent loop for computer use."""
    
    # Beta flag for latest computer use
    beta_flag = "computer-use-2025-11-24"
    
    tools = [
        {
            "type": "computer_20250124",
            "name": "computer",
            "display_width_px": 1024,
            "display_height_px": 768,
            "display_number": 1,
        }
    ]
    
    for _ in range(max_iterations):
        response = client.beta.messages.create(
            model=model,
            max_tokens=4096,
            messages=messages,
            tools=tools,
            betas=[beta_flag],
        )
        
        # Done
        if response.stop_reason == "end_turn":
            return response.content[0].text
        
        # Computer action requested
        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            
            tool_results = []
            for block in response.content:
                if block.type == "tool_use" and block.name == "computer":
                    action = block.input["action"]
                    
                    # Execute the action on actual computer
                    if action == "screenshot":
                        screenshot = capture_screenshot()
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": [{
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": base64.b64encode(screenshot).decode()
                                }
                            }]
                        })
                    elif action == "left_click":
                        x, y = block.input["coordinate"]
                        pyautogui.click(x, y)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": "Clicked successfully"
                        })
                    elif action == "type":
                        pyautogui.typewrite(block.input["text"])
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": "Typed successfully"
                        })
            
            messages.append({"role": "user", "content": tool_results})
    
    return "Max iterations reached"

# Usage
messages = [{"role": "user", "content": "Open a browser and search for 'Anthropic Claude'"}]
result = asyncio.run(sampling_loop(
    model="claude-opus-4-6",
    messages=messages,
    api_key="your-api-key"
))
```

### Security Considerations

⚠️ **Important security guidelines:**

1. Run in an isolated VM or container with minimal privileges
2. Don't give Claude access to sensitive credentials or data
3. Limit internet access to an allowlist of domains
4. Require human confirmation for consequential actions (payments, purchases)
5. Enable prompt injection classifiers (built-in, but opt-outable)
6. Never use computer use in fully automated pipelines without human oversight

### Computer Use Benchmarks

- **WebArena** — state-of-the-art among single-agent systems for browser navigation
- Handles complex multi-step tasks across real websites
- Supports multi-modal input (screenshots as context)

---

## Building Agents with Claude API {#building-agents}

### Minimal Agent Loop

```python
import anthropic
import json

client = anthropic.Anthropic()

def create_agent(system_prompt: str, tools: list):
    """Create and run a Claude agent."""
    
    def run(user_message: str) -> str:
        messages = [{"role": "user", "content": user_message}]
        
        while True:
            response = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=4096,
                system=system_prompt,
                tools=tools,
                messages=messages,
            )
            
            # Final answer
            if response.stop_reason == "end_turn":
                text_blocks = [b for b in response.content if b.type == "text"]
                return text_blocks[0].text if text_blocks else ""
            
            # Tool calls
            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        # Dispatch to your tool implementations
                        result = dispatch_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })
                
                messages.append({"role": "user", "content": tool_results})
    
    return run

def dispatch_tool(name: str, args: dict) -> str:
    """Route tool calls to implementations."""
    tool_map = {
        "web_search": lambda a: web_search(a["query"]),
        "calculator": lambda a: str(eval(a["expression"])),
        "write_file": lambda a: write_file(a["path"], a["content"]),
    }
    
    if name in tool_map:
        try:
            result = tool_map[name](args)
            return json.dumps(result) if not isinstance(result, str) else result
        except Exception as e:
            return f"Error: {str(e)}"
    else:
        return f"Unknown tool: {name}"

# Create and run agent
agent = create_agent(
    system_prompt="You are a helpful research assistant. Use tools to find accurate information.",
    tools=[web_search_tool, calculator_tool, file_write_tool]
)

response = agent("Research the current top 5 programming languages and save the results to programming_trends.md")
print(response)
```

### Multi-Agent Pattern with Claude

```python
# Orchestrator delegates to sub-agents via tool calls

orchestrator_tools = [
    {
        "name": "call_research_agent",
        "description": "Delegate research tasks to the research specialist agent",
        "input_schema": {
            "type": "object",
            "properties": {
                "task": {"type": "string", "description": "The research task to perform"},
                "context": {"type": "string", "description": "Relevant context for the task"}
            },
            "required": ["task"]
        }
    },
    {
        "name": "call_code_agent",
        "description": "Delegate coding tasks to the code specialist agent",
        "input_schema": {
            "type": "object",
            "properties": {
                "task": {"type": "string", "description": "The coding task to perform"},
                "language": {"type": "string", "description": "Programming language to use"}
            },
            "required": ["task"]
        }
    }
]

def call_research_agent(task: str, context: str = "") -> str:
    """Invoke a specialized research sub-agent."""
    research_agent = create_agent(
        system_prompt="You are a specialized research agent. Be thorough and cite sources.",
        tools=[web_search_tool, file_read_tool]
    )
    return research_agent(f"Context: {context}\n\nTask: {task}")

def call_code_agent(task: str, language: str = "python") -> str:
    """Invoke a specialized code sub-agent."""
    code_agent = create_agent(
        system_prompt=f"You are a {language} expert. Write clean, tested, documented code.",
        tools=[code_executor_tool, file_write_tool]
    )
    return code_agent(task)
```

---

## MCP — Model Context Protocol {#mcp}

Claude natively supports the **Model Context Protocol (MCP)** for connecting to external tool servers:

```python
# Connect to MCP server
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[
        {
            "type": "mcp_20250124",   # MCP tool type
            "name": "github",
            "server_url": "https://mcp.github.com",
            "auth": {"type": "bearer", "token": github_token},
        }
    ],
    messages=[{"role": "user", "content": "List my open PRs"}]
)

# Remote MCP (Anthropic-managed execution)
response = client.messages.create(
    model="claude-opus-4-6",
    tools=[{
        "type": "remote_mcp",
        "server_url": "https://your-mcp-server.com",
    }],
    messages=[...]
)
```

**Benefits of MCP:**
- Standardized tool interface across providers
- Reusable tool servers (build once, use everywhere)
- Rich ecosystem of community MCP servers
- Automatic tool discovery from MCP endpoints

---

## Strict Tool Use {#strict}

The `strict: true` parameter guarantees Claude's tool calls always match the JSON schema:

```python
extraction_tool = {
    "name": "extract_invoice_data",
    "description": "Extract structured invoice data from text",
    "input_schema": {
        "type": "object",
        "properties": {
            "invoice_number": {"type": "string"},
            "vendor": {"type": "string"},
            "amount": {"type": "number"},
            "currency": {"type": "string", "enum": ["USD", "SGD", "EUR", "GBP"]},
            "date": {"type": "string", "format": "date"},
            "line_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "description": {"type": "string"},
                        "quantity": {"type": "integer"},
                        "unit_price": {"type": "number"},
                    },
                    "required": ["description", "quantity", "unit_price"]
                }
            }
        },
        "required": ["invoice_number", "vendor", "amount", "currency", "date"]
    },
    "strict": True  # Always validates against schema
}
```

---

## Code Examples {#code-examples}

### Complete Research Agent with Streaming

```python
import anthropic
import json
from typing import Generator

client = anthropic.Anthropic()

# Tool definitions
tools = [
    {
        "name": "web_search",
        "description": "Search the web for current information on any topic. Returns title, URL, and snippet for top results.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "num_results": {"type": "integer", "description": "Number of results (1-10)", "default": 5}
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_to_file",
        "description": "Save content to a markdown file. Use for final reports or documents.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string", "description": "File name (without .md extension)"},
                "content": {"type": "string", "description": "Markdown content to save"}
            },
            "required": ["filename", "content"]
        }
    }
]

def handle_tool_call(name: str, args: dict) -> str:
    if name == "web_search":
        # Your search implementation
        return json.dumps([
            {"title": "Result 1", "url": "https://...", "snippet": "..."},
        ])
    elif name == "save_to_file":
        with open(f"{args['filename']}.md", "w") as f:
            f.write(args["content"])
        return f"Saved to {args['filename']}.md"
    return f"Unknown tool: {name}"

def research_agent(query: str) -> str:
    """Research agent with streaming and tool use."""
    messages = [{"role": "user", "content": query}]
    
    while True:
        # Use streaming for better UX
        full_response = []
        tool_calls = []
        stop_reason = None
        
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=4096,
            system="You are a thorough research assistant. Search for information, synthesize findings, and save reports to files.",
            tools=tools,
            messages=messages,
        ) as stream:
            for event in stream:
                if hasattr(event, "type"):
                    if event.type == "content_block_start":
                        if hasattr(event.content_block, "type"):
                            if event.content_block.type == "text":
                                print("", end="")
                    elif event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            print(event.delta.text, end="", flush=True)
            
            final = stream.get_final_message()
            stop_reason = final.stop_reason
            full_response = final.content
        
        print()  # New line after streaming
        
        if stop_reason == "end_turn":
            text_blocks = [b for b in full_response if b.type == "text"]
            return text_blocks[0].text if text_blocks else "Done."
        
        if stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": full_response})
            
            tool_results = []
            for block in full_response:
                if block.type == "tool_use":
                    print(f"\n[Tool: {block.name}({json.dumps(block.input)[:100]}...)]")
                    result = handle_tool_call(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })
            
            messages.append({"role": "user", "content": tool_results})

# Run
result = research_agent(
    "Research the top 5 AI coding assistants of 2025. Compare their features, pricing, and benchmarks. Save a detailed comparison report."
)
```

---

## Benchmarks & Performance {#benchmarks}

### Tool Use Quality by Model

| Model | Complex Tools | Parallel Calls | Strict Adherence | Speed |
|-------|--------------|----------------|-----------------|-------|
| Claude Opus 4.6 | ★★★★★ | ★★★★★ | ★★★★★ | Moderate |
| Claude Sonnet 4.6 | ★★★★☆ | ★★★★☆ | ★★★★☆ | Fast |
| Claude Haiku 4.5 | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | Very Fast |

### SWE-bench Performance

Adding basic tools produces outsized capability gains:
- **Without tools**: Base model code generation
- **With bash + editor tools**: Surpasses human expert baselines on SWE-bench
- Claude 3.7 Sonnet: ~49% on SWE-bench with computer use
- Claude Opus 4.5+: State-of-the-art on WebArena

### Tool Search Tool Impact

With large tool libraries (50+ MCP tools):
- **Without Tool Search**: 49% accuracy (Opus 4), 55K+ tokens consumed
- **With Tool Search Tool**: 74% accuracy (Opus 4), 85% token reduction
- **Opus 4.5 improvement**: 79.5% → 88.1%

### Token Overhead for Tools

| Model | auto/none | any/tool |
|-------|-----------|---------|
| Claude Opus 4.6 | +346 tokens | +313 tokens |
| Claude Sonnet 4.6 | +346 tokens | +313 tokens |
| Claude Haiku 4.5 | +264 tokens | +231 tokens |

*Additional to tool definition tokens themselves*

---

## Comparisons {#comparisons}

### Claude Tool Use vs OpenAI Function Calling

| Feature | Claude (Anthropic) | OpenAI |
|---------|-------------------|--------|
| Multiple parallel calls | Yes | Yes |
| `tool_choice` control | `auto/any/tool/none` | `auto/required/none` |
| Structured extraction | `tool_choice: tool` | `tool_choice: required` |
| Computer use | Yes (beta) | Via Responses API |
| MCP support | Native | Via adapters |
| Tool search | Yes (2025) | No |
| Strict schema | `strict: true` | `strict: true` |
| Server-side tools | web_search, code_exec | web_search, code_interp |
| Token efficiency | Tool Search Tool | Standard |

### Claude vs Gemini Function Calling

| Feature | Claude | Gemini |
|---------|--------|--------|
| Tool definition | JSON Schema | JSON Schema (similar) |
| Parallel calls | Yes | Yes |
| Code execution | Computer Use + tools | Native code execution |
| Ground search | web_search tool | Google Search grounding |
| Streaming | Yes | Yes |

---

## Pros & Cons {#pros-cons}

### Pros

✅ **Excellent tool following** — Claude Opus reliably calls the right tools with correct args  
✅ **Parallel tool calls** — multiple tools per response for efficiency  
✅ **`tool_choice`** — precise control over when/which tools are called  
✅ **Computer use** — unique desktop automation capability  
✅ **MCP native** — first-class Model Context Protocol support  
✅ **Strict mode** — guaranteed JSON schema adherence  
✅ **Tool Search Tool** — handles massive tool libraries efficiently  
✅ **Server tools** — web_search, code_execution, file_search without your infra  
✅ **Streaming** — real-time token streaming during tool use  
✅ **Safety** — built-in prompt injection classifiers for computer use  
✅ **Extended thinking** — tools compatible with Claude's extended thinking mode  

### Cons

❌ **No stateful API** — must manage conversation history (unlike OpenAI Assistants)  
❌ **Beta features** — computer use, tool search still in beta  
❌ **Anthropic lock-in** — tool calling format is provider-specific  
❌ **Token costs** — tool definitions add to input tokens (mitigated by Tool Search)  
❌ **Rate limits** — production scale requires careful rate limit management  
❌ **Haiku limitations** — smaller models less reliable on complex tool selection  
❌ **No built-in persistence** — no native thread/session management  

---

## Official URLs {#official-urls}

- **Tool Use Overview**: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- **Define Tools**: https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- **Implement Tool Use**: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
- **Computer Use Tool**: https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool
- **MCP Connector**: https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
- **Advanced Tool Use Blog**: https://www.anthropic.com/engineering/advanced-tool-use
- **Building Effective Agents**: https://www.anthropic.com/research/building-effective-agents
- **Tool Reference**: https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference
- **Computer Use Reference Impl**: https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo
- **Python SDK**: https://github.com/anthropics/anthropic-sdk-python
- **Model Context Protocol**: https://modelcontextprotocol.io

---

## Key Takeaways

1. **Tool use is Claude's primary agentic primitive** — everything agent-related builds on this
2. **Client vs Server tools**: client = you execute, server = Anthropic executes (simpler)
3. **`tool_choice: "tool"`** is powerful for structured extraction — always get typed data back
4. **Parallel tool calls** are automatic — Claude can call multiple tools per response
5. **Computer Use** is genuinely novel — desktop automation with vision feedback
6. **Tool Search Tool** solves the large-tool-library problem (85% token reduction)
7. **Strict mode** + `tool_choice: tool` = guaranteed structured output (no hallucination)
8. **MCP** is the future — standardized tool servers that work across all models
9. Build the agent loop yourself — gives full control over state, retries, and branching
10. Claude Opus is best for complex multi-tool scenarios; Haiku for high-throughput simple tasks

---

*Research compiled March 2025. Claude tool use is continuously evolving; check official docs for latest beta features.*
