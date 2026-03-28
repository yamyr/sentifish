# Evolution of Function Calling in LLMs: From GPT-4 to Parallel Tools and Structured Outputs

> **Research Date:** March 2026  
> **Focus:** Historical evolution of function calling/tool use, current state across providers, structured outputs, and how Anthropic vs OpenAI approaches differ

---

## Overview

Function calling — the ability for an LLM to request execution of external functions and incorporate results — transformed AI from passive text generators to active agents. What began as an experimental feature in GPT-4 (June 2023) has evolved into a mature, standardized capability with parallel execution, strict schema validation, and deep integration with agentic frameworks.

The evolution spans four phases:
1. **2023**: Basic function calling — single function per turn, best-effort JSON
2. **2024**: Parallel calls, structured outputs, tool_choice forcing
3. **2025**: Native tool use across all frontier models, Model Context Protocol (MCP)
4. **2025+**: Reasoning-native function calling, agentic computer use

---

## Timeline

```
2023 Jun  OpenAI releases function calling with GPT-4 / GPT-3.5-turbo
2023 Nov  Claude 2.1 gets improved tool use
2024 Jan  OpenAI: Parallel function calls (multiple tools in one response)
2024 Feb  Google Gemini: Native function calling
2024 Mar  Mistral: Function calling support
2024 Jun  GPT-4o: function_calling → tools (terminology rename)
2024 Aug  OpenAI: Structured Outputs with strict JSON schema validation
2024 Nov  Google: MCP support announced for Gemini
2025 Feb  Claude 3.7: Extended thinking with interleaved tool use
2025 Mar  OpenAI Agents SDK: tool_choice="required" production patterns
2025 Apr  GPT-4.1: Improved tool use, parallel tool calls
2025 May  Strands Agents: Model-driven tool orchestration at scale
2025 Jun  o3: Reasoning model with tool use and computer use
2026 Mar  All frontier models: Native tool use as baseline capability
```

---

## Part 1: OpenAI Function Calling Evolution

### 2023: The Original API

June 2023 introduced function calling with a `functions` array and `function_call` parameter:

```python
# ORIGINAL 2023 API (now deprecated)
response = openai.ChatCompletion.create(
    model="gpt-4-0613",
    messages=[
        {"role": "user", "content": "What's the weather in Paris?"}
    ],
    functions=[{
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"]
                }
            },
            "required": ["location"]
        }
    }],
    function_call="auto"  # Let model decide when to call
)

# Parse function call
if response.choices[0].message.function_call:
    func_name = response.choices[0].message.function_call.name
    func_args = json.loads(response.choices[0].message.function_call.arguments)
```

**Limitations of original API:**
- Only one function call per response
- Best-effort JSON (could fail schema validation)
- No guarantee of valid argument types
- Limited to sequential execution

### 2024: Tools API + Parallel Calls

The `functions` API was deprecated in favor of `tools`, enabling **multiple simultaneous function calls**:

```python
# MODERN API (2024+)
from openai import OpenAI
import json

client = OpenAI()

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_time",
            "description": "Get current time in a timezone",
            "parameters": {
                "type": "object",
                "properties": {
                    "timezone": {"type": "string"}
                },
                "required": ["timezone"]
            }
        }
    }
]

messages = [{"role": "user", "content": "What's the weather and current time in Tokyo?"}]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"  # auto | none | required | {"type":"function","function":{"name":"..."}}
)

# Handle PARALLEL tool calls
tool_calls = response.choices[0].message.tool_calls
# Model can return MULTIPLE calls in one response!
print(f"Number of tool calls: {len(tool_calls)}")  # Could be 2!

# Execute all tool calls
for tool_call in tool_calls:
    func_name = tool_call.function.name
    func_args = json.loads(tool_call.function.arguments)
    
    if func_name == "get_weather":
        result = get_weather(**func_args)
    elif func_name == "get_time":
        result = get_time(**func_args)
    
    # Add each result back to messages
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(result)
    })

# Final response with all tool results
final_response = client.chat.completions.create(
    model="gpt-4o",
    messages=[response.choices[0].message, *messages[1:]]  # Include assistant message
)
```

### tool_choice Parameter Options

```python
# 1. Auto (default) - model decides
tool_choice="auto"

# 2. Disable tools
tool_choice="none"

# 3. Force AT LEAST ONE tool call
tool_choice="required"

# 4. Force specific tool
tool_choice={
    "type": "function",
    "function": {"name": "get_weather"}
}
```

### 2024: Structured Outputs

August 2024 brought guaranteed schema conformance via JSON Schema:

```python
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI()

class ExtractedInfo(BaseModel):
    product_name: str
    price: float
    currency: str
    in_stock: bool
    features: list[str]

# Method 1: response_format with Pydantic
completion = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "user", "content": "Extract info: MacBook Pro 16\" at $2,499 - 512GB SSD, 36GB RAM, in stock"}
    ],
    response_format=ExtractedInfo,
)

product = completion.choices[0].message.parsed
print(product.product_name)  # "MacBook Pro 16\""
print(product.price)         # 2499.0
print(product.in_stock)      # True
```

### Strict Mode for Function Calling

```python
# strict=True guarantees valid arguments
tools = [{
    "type": "function",
    "function": {
        "name": "create_order",
        "strict": True,  # ← Guarantees valid JSON matching schema
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": "string"},
                "quantity": {"type": "integer", "minimum": 1},
                "customer_email": {"type": "string", "format": "email"}
            },
            "required": ["product_id", "quantity", "customer_email"],
            "additionalProperties": False  # Required for strict mode
        }
    }
}]
```

**Strict mode requirements:**
- All optional properties must have default values
- No `additionalProperties: true`
- All nested schemas must also be strict
- Uses structured outputs under the hood

---

## Part 2: Anthropic Tool Use

### Claude's Approach

Anthropic uses "tool use" terminology (not "function calling") and takes a different structural approach:

```python
import anthropic
import json

client = anthropic.Anthropic()

# Define tools (similar structure, different API)
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {  # ← "input_schema" not "parameters"
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit"
                }
            },
            "required": ["location"]
        }
    }
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "What's the weather in Singapore?"}
    ]
)

# Parse tool use from response
for block in response.content:
    if block.type == "tool_use":
        tool_name = block.name
        tool_input = block.input  # Already dict, not JSON string!
        
        # Execute tool
        result = get_weather(**tool_input)
        
        # Return result in next turn
        messages = [
            {"role": "user", "content": "What's the weather in Singapore?"},
            {"role": "assistant", "content": response.content},
            {
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result)
                }]
            }
        ]
```

### Claude tool_choice Options

```python
# Claude tool_choice
client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    tool_choice={"type": "auto"},      # Auto
    # OR
    tool_choice={"type": "any"},       # Must use at least one tool
    # OR
    tool_choice={"type": "tool", "name": "get_weather"},  # Specific tool
    # OR
    tool_choice={"type": "none"},      # No tools (added in 2025)
)
```

### Claude Parallel Tool Use

```python
# Claude supports parallel tool calls (multiple tools in one response)
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    tools=tools,
    messages=[{
        "role": "user",
        "content": "Compare weather in Tokyo, Paris, and NYC"
    }]
)

# Response may contain multiple tool_use blocks
tool_calls = [block for block in response.content if block.type == "tool_use"]
print(f"Parallel calls: {len(tool_calls)}")  # Could be 3

# Execute all in parallel
import asyncio

async def execute_all_tools(tool_calls):
    results = await asyncio.gather(*[
        execute_tool_async(tc.name, tc.input)
        for tc in tool_calls
    ])
    return list(zip(tool_calls, results))
```

### Claude Extended Thinking + Tool Use (2025)

A unique Claude capability: thinking interleaved with tool use, enabling more sophisticated reasoning:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # Allow up to 10k thinking tokens
    },
    tools=tools,
    messages=[{
        "role": "user",
        "content": "Analyze this complex financial data and recommend the best investment strategy..."
    }]
)

# Response includes thinking blocks AND tool use
for block in response.content:
    if block.type == "thinking":
        print(f"Claude's reasoning: {block.thinking[:200]}...")
    elif block.type == "tool_use":
        print(f"Tool call: {block.name}({block.input})")
    elif block.type == "text":
        print(f"Final answer: {block.text}")
```

### Claude Structured Output (Tool-Based)

Unlike OpenAI's `response_format`, Claude achieves structured output via forced tool use:

```python
from pydantic import BaseModel
from anthropic import Anthropic

class SentimentAnalysis(BaseModel):
    sentiment: str
    confidence: float
    key_phrases: list[str]

def structured_claude_output(text: str) -> SentimentAnalysis:
    client = Anthropic()
    
    # Force tool use for structured output
    response = client.messages.create(
        model="claude-haiku-3-5",
        max_tokens=1024,
        tools=[{
            "name": "analyze_sentiment",
            "description": "Analyze sentiment and return structured results",
            "input_schema": SentimentAnalysis.model_json_schema()
        }],
        tool_choice={"type": "tool", "name": "analyze_sentiment"},
        messages=[{"role": "user", "content": f"Analyze: {text}"}]
    )
    
    tool_use = next(b for b in response.content if b.type == "tool_use")
    return SentimentAnalysis(**tool_use.input)
```

---

## Part 3: OpenAI vs Anthropic Differences

### Key API Structural Differences

| Aspect | OpenAI | Anthropic |
|--------|--------|-----------|
| Term | "Function calling" / "Tools" | "Tool use" |
| Tool definition | `parameters` (JSON Schema) | `input_schema` (JSON Schema) |
| Tool result role | `"tool"` | `"user"` (with tool_result content block) |
| Tool result format | String or list | Content block with tool_use_id |
| Arguments format | JSON **string** | Python **dict** |
| Structured output | `response_format` native | Via forced tool use |
| Strict validation | `strict: true` in tool def | No equivalent (best-effort) |
| Parallel calls | ✅ Yes | ✅ Yes |
| Thinking + tools | ❌ Separate | ✅ Interleaved |
| tool_choice "none" | ✅ Yes | ✅ Yes (2025) |

### Code Pattern Comparison

**OpenAI Tool Result Return:**
```python
# OpenAI: separate "tool" role message
messages.append({
    "role": "tool",
    "tool_call_id": tool_call.id,
    "content": json.dumps(result)  # String
})
```

**Anthropic Tool Result Return:**
```python
# Anthropic: user message with tool_result content block
messages.append({
    "role": "user",
    "content": [{
        "type": "tool_result",
        "tool_use_id": tool_use.id,   # Note: tool_use_id not tool_call_id
        "content": json.dumps(result)
    }]
})
```

### JSON Mode Comparison

```python
# OpenAI JSON Mode
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Return JSON with name and age"}],
    response_format={"type": "json_object"},  # Best effort
)

# OpenAI Structured Output (strict)
response = client.beta.chat.completions.parse(
    model="gpt-4o-2024-08-06",
    messages=[...],
    response_format=MyPydanticModel,  # Guaranteed
)

# Anthropic: No native JSON mode — use tool forcing or prompt instruction
# Method 1: Tool forcing
response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=[{"name": "output", "input_schema": MySchema}],
    tool_choice={"type": "tool", "name": "output"},
    messages=[...]
)

# Method 2: Prompt + prefill
response = client.messages.create(
    model="claude-sonnet-4-6",
    messages=[
        {"role": "user", "content": "Return JSON with name and age"},
        {"role": "assistant", "content": "{"}  # Prefill forces JSON
    ]
)
```

---

## Part 4: Google Gemini Function Calling

### Gemini API

```python
import google.generativeai as genai

genai.configure(api_key="YOUR_KEY")

def get_stock_price(ticker: str) -> dict:
    """Get current stock price."""
    return {"ticker": ticker, "price": 195.50, "currency": "USD"}

# Gemini auto-detects Python function signatures!
model = genai.GenerativeModel(
    model_name='gemini-1.5-pro',
    tools=[get_stock_price]  # Pass Python function directly
)

response = model.generate_content("What is Apple's current stock price?")

# Handle function call
for part in response.parts:
    if hasattr(part, 'function_call'):
        func_name = part.function_call.name
        func_args = dict(part.function_call.args)
        result = get_stock_price(**func_args)
```

### Gemini tool_config

```python
from google.generativeai.types import content_types

model = genai.GenerativeModel(
    model_name='gemini-1.5-pro',
    tools=[get_stock_price, get_weather],
    tool_config=content_types.to_tool_config({
        "function_calling_config": {
            "mode": "ANY",  # NONE | AUTO | ANY | specific function
            "allowed_function_names": ["get_stock_price"]
        }
    })
)
```

---

## Part 5: Model Context Protocol (MCP)

Introduced by Anthropic in late 2024 and gaining widespread adoption in 2025, MCP is a **standardized protocol** for tool definitions that works across LLM providers.

### MCP Architecture

```
MCP Architecture:

AI Model (Claude/GPT/Gemini)
       │
       │ MCP Protocol
       ▼
MCP Server (tool definitions + execution)
       │
       ├── Local tools (file system, code execution)
       ├── Remote APIs (databases, web services)
       └── UI automation (browser control)
```

### MCP vs Ad-hoc Tool Definitions

```python
# Traditional approach — manual tool definition per model
openai_tool = {
    "type": "function",
    "function": {
        "name": "read_file",
        "parameters": {"type": "object", "properties": {"path": {"type": "string"}}}
    }
}

anthropic_tool = {
    "name": "read_file",
    "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}}
}

# MCP approach — define once, use with any model
# MCP server definition (e.g., filesystem MCP server)
{
    "tools": [{
        "name": "read_file",
        "description": "Read a file from the filesystem",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "File path to read"}
            },
            "required": ["path"]
        }
    }]
}
```

### MCP Adoption (2025)

By 2025, MCP was supported by:
- Claude (all models via Anthropic API)
- Google Gemini (December 2024 announcement)
- OpenAI (via third-party adapters)
- VS Code, Cursor, Windsurf (IDE integrations)
- n8n, Zapier (workflow platforms)
- 1,000+ MCP servers in the community

---

## Part 6: Reasoning Models and Tool Use (o1/o3)

### o1/o3 Unique Approach

OpenAI's reasoning models (o1, o3) handle function calling differently from standard models:

```python
# o3 with tool use
response = client.chat.completions.create(
    model="o3",
    messages=[{
        "role": "user",
        "content": "Solve this math problem step by step and verify with the calculator tool"
    }],
    tools=tools,
    # NOTE: reasoning_effort controls how much thinking happens before tool calls
    # "low" | "medium" | "high"  
)
```

**Key differences with o-series models:**
1. Model thinks extensively before deciding to use a tool
2. Often solves problems without tools when reasoning suffices
3. More accurate tool argument generation (fewer errors)
4. Cannot be told "think step by step" — already does internally
5. Lower latency for tool selection (knows exactly when tools are needed)

### Extended Thinking with Tools (Claude)

```python
# Claude 3.7+ with extended thinking and tool use
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 8000},
    tools=[database_query_tool, analytics_tool],
    messages=[{
        "role": "user",
        "content": "Analyze Q4 sales data and identify the top 3 growth opportunities"
    }]
)

# Claude's response may include:
# 1. <thinking> block — internal reasoning visible
# 2. tool_use block — calls database_query  
# 3. <thinking> block — reasoning about query results
# 4. tool_use block — calls analytics
# 5. text block — final synthesized answer
```

---

## Part 7: Complete Tool Loop Implementation

```python
"""
Complete, production-ready tool loop implementation.
Handles parallel calls, retries, and error reporting.
"""
import json
import asyncio
from openai import AsyncOpenAI
from typing import Callable, Any

client = AsyncOpenAI()

async def run_tool_loop(
    messages: list[dict],
    tools: list[dict],
    tool_handlers: dict[str, Callable],
    model: str = "gpt-4o-mini",
    max_iterations: int = 10
) -> str:
    """Execute a complete tool loop with parallel execution support."""
    
    iteration = 0
    
    while iteration < max_iterations:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        messages.append(message)
        
        # Check if we're done
        if message.tool_calls is None:
            return message.content
        
        # Execute ALL tool calls in parallel
        async def execute_one(tc):
            try:
                handler = tool_handlers.get(tc.function.name)
                if not handler:
                    return tc.id, f"Error: Unknown tool {tc.function.name}"
                
                args = json.loads(tc.function.arguments)
                result = await asyncio.to_thread(handler, **args) \
                    if not asyncio.iscoroutinefunction(handler) \
                    else await handler(**args)
                
                return tc.id, json.dumps(result)
            except Exception as e:
                return tc.id, f"Error: {str(e)}"
        
        results = await asyncio.gather(*[execute_one(tc) for tc in message.tool_calls])
        
        # Add all results
        for tool_call_id, result in results:
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": result
            })
        
        iteration += 1
    
    return "Max iterations reached"


# Usage
tools_def = [
    {"type": "function", "function": {
        "name": "search", "description": "Search the web",
        "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}
    }},
    {"type": "function", "function": {
        "name": "calculate", "description": "Perform calculations",
        "parameters": {"type": "object", "properties": {"expression": {"type": "string"}}, "required": ["expression"]}
    }}
]

handlers = {
    "search": lambda query: {"results": f"Search results for: {query}"},
    "calculate": lambda expression: {"result": eval(expression)}
}

result = asyncio.run(run_tool_loop(
    messages=[{"role": "user", "content": "What is 25% of the current Bitcoin price?"}],
    tools=tools_def,
    tool_handlers=handlers
))
```

---

## Pros and Cons

### OpenAI Tool Use
✅ Native structured output with Pydantic  
✅ `strict: true` for guaranteed schema compliance  
✅ Mature, well-documented API  
✅ Automatic prompt caching on long tool schemas  
❌ `strict` mode has schema restrictions (no `additionalProperties`)  
❌ Arguments come as JSON string (needs parsing)  

### Anthropic Tool Use
✅ Arguments already parsed (dict, not string)  
✅ Interleaved thinking + tool use  
✅ More natural conversation structure  
✅ Better at knowing when NOT to use tools  
❌ No native structured output (need tool forcing)  
❌ `strict` parameter ignored (best-effort validation)  
❌ Tool results go in "user" role (less intuitive)  

### Gemini Function Calling
✅ Auto-detects Python function signatures  
✅ Native Python function → tool conversion  
✅ Long context for large tool schemas  
❌ Less mature ecosystem  
❌ Pricing for function calls can be complex  

---

## Official Resources

- **OpenAI Function Calling Guide**: https://platform.openai.com/docs/guides/function-calling
- **OpenAI Structured Outputs**: https://platform.openai.com/docs/guides/structured-outputs
- **Anthropic Tool Use**: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- **Anthropic Extended Thinking**: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
- **Google Gemini Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling
- **Model Context Protocol**: https://modelcontextprotocol.io/
- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **OpenAI Parallel Function Calls**: https://platform.openai.com/docs/guides/function-calling#parallel-function-calling
- **Function Calling Complete Guide 2026**: https://ofox.ai/blog/function-calling-tool-use-complete-guide-2026/
