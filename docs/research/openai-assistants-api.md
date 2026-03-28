# OpenAI Assistants API — Comprehensive Research Guide

> **Last Updated:** March 2025 | **⚠️ Deprecation Notice:** Assistants API deprecated Aug 26, 2025; shuts down Aug 26, 2026. Migrate to Responses API.

---

## Table of Contents

1. [Overview & Status](#overview)
2. [Architecture — Core Concepts](#architecture)
3. [Assistants](#assistants)
4. [Threads & Messages](#threads)
5. [Runs — Execution Engine](#runs)
6. [Built-in Tools](#tools)
7. [Function Calling in Assistants](#function-calling)
8. [Streaming](#streaming)
9. [File Handling & Vector Stores](#files)
10. [How It Differs from Chat Completions](#differences)
11. [The Responses API — Successor](#responses-api)
12. [Code Examples](#code-examples)
13. [Migration Guide Summary](#migration)
14. [Comparisons](#comparisons)
15. [Pros & Cons](#pros-cons)
16. [Official URLs](#official-urls)

---

## Overview & Status {#overview}

The **OpenAI Assistants API** was launched in November 2023 as a stateful, higher-level API for building AI-powered assistants and agents. Unlike the Chat Completions API (which is stateless), the Assistants API managed:

- **Conversation history** (Threads)
- **File storage and retrieval** (File Search / RAG)
- **Code execution** (Code Interpreter)
- **Function calling** with tool orchestration
- **Persistent assistant configurations**

### ⚠️ Deprecation Timeline

| Date | Event |
|------|-------|
| November 2023 | Assistants API v1 beta launched |
| April 2024 | Assistants API v2 released |
| December 18, 2024 | v1 beta discontinued (v2 only) |
| March 2025 | Responses API launched as successor |
| **August 26, 2025** | **Assistants API deprecated** |
| **August 26, 2026** | **Assistants API shuts down** |

**For new projects, use the Responses API** (see section below). This document covers the Assistants API for migration understanding and historical reference.

---

## Architecture — Core Concepts {#architecture}

The Assistants API is built around 5 key objects:

```
┌──────────────────────────────────────────────────────┐
│                   OpenAI Platform                    │
├──────────────┬───────────────────────────────────────┤
│  Assistant   │  Persistent AI configuration          │
│  (config)    │  (model, instructions, tools)         │
├──────────────┼───────────────────────────────────────┤
│   Thread     │  Conversation session (messages)      │
│  (session)   │  Auto-managed context window          │
├──────────────┼───────────────────────────────────────┤
│   Message    │  Content unit (text, image, file)     │
│  (content)   │  From user or assistant               │
├──────────────┼───────────────────────────────────────┤
│    Run       │  Execution of assistant on thread     │
│  (execution) │  Manages tool calls and state         │
├──────────────┼───────────────────────────────────────┤
│  Run Step    │  Individual action within a Run       │
│  (step)      │  Message creation or tool call        │
└──────────────┴───────────────────────────────────────┘
```

### Key Architectural Insight

Unlike Chat Completions where you send the full conversation each request, the Assistants API:
1. **Stores conversation history server-side** (in Threads)
2. **Manages context window automatically** (smart truncation)
3. **Persists assistant configuration** (reusable across conversations)
4. **Handles tool execution lifecycle** (including requires_action state)

---

## Assistants {#assistants}

An `Assistant` is a persistent configuration object:

```python
from openai import OpenAI
client = OpenAI()

# Create an assistant
assistant = client.beta.assistants.create(
    name="Financial Analyst",
    description="Expert in financial data analysis and visualization",
    model="gpt-4o",
    instructions="""You are an expert financial analyst. 
    Analyze financial data, identify trends, and create visualizations.
    Always explain your methodology and cite specific data points.""",
    tools=[
        {"type": "code_interpreter"},
        {"type": "file_search"},
        {
            "type": "function",
            "function": {
                "name": "get_stock_price",
                "description": "Get the current stock price for a ticker",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ticker": {
                            "type": "string",
                            "description": "Stock ticker symbol"
                        }
                    },
                    "required": ["ticker"]
                }
            }
        }
    ],
    tool_resources={
        "code_interpreter": {
            "file_ids": []  # Added per-run or per-thread
        }
    },
    temperature=0.7,
    response_format="auto",
)

print(f"Created assistant: {assistant.id}")

# Retrieve existing assistant
assistant = client.beta.assistants.retrieve("asst_abc123")

# Update assistant
client.beta.assistants.update(
    assistant_id="asst_abc123",
    instructions="Updated instructions...",
    model="gpt-4o",
)

# List all assistants
assistants = client.beta.assistants.list(limit=20, order="desc")

# Delete
client.beta.assistants.delete("asst_abc123")
```

### Assistant Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Display name |
| `model` | string | OpenAI model ID |
| `instructions` | string | System-level behavior guidance |
| `tools` | list | Up to 128 tools |
| `tool_resources` | object | Files for code_interpreter/file_search |
| `temperature` | float | 0-2, randomness (default 1) |
| `top_p` | float | Nucleus sampling parameter |
| `response_format` | string/object | `auto`, `text`, `json_object`, or JSON schema |
| `metadata` | object | Custom key-value pairs |

---

## Threads & Messages {#threads}

A `Thread` represents a conversation session:

```python
# Create an empty thread
thread = client.beta.threads.create()

# Create thread with initial messages
thread = client.beta.threads.create(
    messages=[
        {
            "role": "user",
            "content": "Analyze the sales data in the attached CSV",
            "attachments": [
                {
                    "file_id": file.id,
                    "tools": [{"type": "code_interpreter"}]
                }
            ]
        }
    ]
)

# Add a message to existing thread
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="What are the top 3 trends you see?",
)

# Add message with image
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content=[
        {"type": "text", "text": "What does this chart show?"},
        {
            "type": "image_url",
            "image_url": {"url": "https://example.com/chart.png"}
        }
    ]
)

# List messages in thread
messages = client.beta.threads.messages.list(
    thread_id=thread.id,
    order="asc",  # Chronological
)
for msg in messages.data:
    print(f"{msg.role}: {msg.content[0].text.value}")

# Retrieve specific message
message = client.beta.threads.messages.retrieve(
    thread_id=thread.id,
    message_id="msg_abc123"
)

# Delete thread when done (cleanup)
client.beta.threads.delete(thread.id)
```

### Context Window Management

Threads automatically handle context window overflow:
- Smart truncation of older messages when context limit approaches
- Can customize with `max_prompt_tokens` and `max_completion_tokens` on Run
- Thread stores up to 100,000 messages

```python
# Control token budget per run
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id,
    max_prompt_tokens=2000,    # Truncate thread to fit this budget
    max_completion_tokens=1000, # Cap response length
    truncation_strategy={
        "type": "last_messages",
        "last_messages": 10    # Keep only last 10 messages
    }
)
```

---

## Runs — Execution Engine {#runs}

A `Run` is the execution of an assistant on a thread:

### Run Lifecycle States

```
                    ┌─────────────────────────┐
                    │         queued           │
                    └────────────┬────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │        in_progress       │
                    └────────────┬────────────┘
                                 ↓
               ┌─────────────────┴──────────────────┐
               ↓                                    ↓
  ┌─────────────────────────┐       ┌─────────────────────────┐
  │    requires_action       │       │       completed          │
  │  (tool calls pending)    │       └─────────────────────────┘
  └────────────┬────────────┘
               ↓ (submit tool outputs)
  ┌─────────────────────────┐
  │        in_progress       │
  └─────────────────────────┘

Other terminal states: failed, cancelled, expired, incomplete
```

### Creating and Polling Runs

```python
import time

# Create a run
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id=assistant.id,
    instructions="Additional instructions for this specific run",
    # Override assistant settings per-run:
    model="gpt-4o",  # Optional override
    temperature=0.5, # Optional override
)

# Poll until completion (simple approach)
while run.status in ["queued", "in_progress", "cancelling"]:
    time.sleep(1)
    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )

if run.status == "completed":
    messages = client.beta.threads.messages.list(thread_id=thread.id)
    print(messages.data[0].content[0].text.value)
elif run.status == "requires_action":
    # Handle tool calls (see Function Calling section)
    pass
elif run.status == "failed":
    print(f"Run failed: {run.last_error}")

# Using built-in polling helper
run = client.beta.threads.runs.create_and_poll(
    thread_id=thread.id,
    assistant_id=assistant.id,
    poll_interval_ms=500,
)
```

### Run Steps

A run consists of multiple steps (tool calls and message creation):

```python
# Get all steps for a run
run_steps = client.beta.threads.runs.steps.list(
    thread_id=thread.id,
    run_id=run.id,
)

for step in run_steps.data:
    print(f"Step type: {step.type}")  # message_creation or tool_calls
    if step.type == "tool_calls":
        for tc in step.step_details.tool_calls:
            print(f"  Tool: {tc.type}")
            if tc.type == "function":
                print(f"  Function: {tc.function.name}")
                print(f"  Args: {tc.function.arguments}")
            elif tc.type == "code_interpreter":
                print(f"  Code: {tc.code_interpreter.input}")
```

---

## Built-in Tools {#tools}

### 1. Code Interpreter

Runs Python code in a sandboxed environment with file I/O:

```python
# Enable code interpreter
assistant = client.beta.assistants.create(
    model="gpt-4o",
    tools=[{"type": "code_interpreter"}],
    tool_resources={
        "code_interpreter": {
            "file_ids": [uploaded_file.id]  # Up to 20 files
        }
    }
)

# Use case: data analysis + visualization
# User: "Analyze this CSV and create a chart"
# Code Interpreter will:
# 1. Read the CSV file
# 2. Write and execute pandas/matplotlib code
# 3. Return results + generated images
```

**Capabilities:**
- Execute Python code (pandas, numpy, matplotlib, scikit-learn, etc.)
- Read/write files within the sandbox
- Generate charts and images (returned as file objects)
- Iterate and fix errors automatically
- Access attached files

**Pricing:** $0.03 per code interpreter session (as of 2024)

### 2. File Search (RAG)

Vector-store-backed semantic search over uploaded documents:

```python
# Create vector store
vector_store = client.beta.vector_stores.create(
    name="Product Documentation",
    file_ids=[file1.id, file2.id],
    expires_after={
        "anchor": "last_active_at",
        "days": 7
    }
)

# Enable file search with vector store
assistant = client.beta.assistants.create(
    model="gpt-4o",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "vector_store_ids": [vector_store.id]
        }
    }
)

# Supported file types: PDF, Word, TXT, HTML, Markdown, JSON, CSV, etc.
# Max 512 MB per file, up to 5M tokens per file
# Vector stores: up to 10,000 files (100M files for stores created after Nov 2025)
```

**How it works:**
1. Files are chunked and embedded on upload
2. On each run, relevant chunks are retrieved via semantic search
3. Retrieved context is injected into the model's prompt
4. Citations are automatically included in responses

### 3. Function Calling

Custom functions that your code executes (see next section).

---

## Function Calling in Assistants {#function-calling}

Function calling in the Assistants API requires a loop to handle the `requires_action` state:

### Non-Streaming Function Calling

```python
import json

# Define functions in assistant
assistant = client.beta.assistants.create(
    model="gpt-4o",
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get weather for a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"},
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"]
                        }
                    },
                    "required": ["location"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_flights",
                "description": "Search for available flights",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "origin": {"type": "string"},
                        "destination": {"type": "string"},
                        "date": {"type": "string"}
                    },
                    "required": ["origin", "destination", "date"]
                }
            }
        }
    ]
)

def handle_run(thread_id, assistant_id):
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=assistant_id,
    )
    
    while True:
        run = client.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id
        )
        
        if run.status == "completed":
            messages = client.beta.threads.messages.list(
                thread_id=thread_id,
                order="desc",
            )
            return messages.data[0].content[0].text.value
        
        elif run.status == "requires_action":
            tool_outputs = []
            
            for tool_call in run.required_action.submit_tool_outputs.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                
                # Execute the actual function
                if fn_name == "get_weather":
                    result = get_weather(**fn_args)
                elif fn_name == "search_flights":
                    result = search_flights(**fn_args)
                else:
                    result = f"Unknown function: {fn_name}"
                
                tool_outputs.append({
                    "tool_call_id": tool_call.id,
                    "output": json.dumps(result)
                })
            
            # Submit ALL tool outputs at once
            run = client.beta.threads.runs.submit_tool_outputs(
                thread_id=thread_id,
                run_id=run.id,
                tool_outputs=tool_outputs
            )
        
        elif run.status in ["failed", "cancelled", "expired"]:
            raise Exception(f"Run {run.status}: {run.last_error}")
        
        time.sleep(0.5)  # Poll interval
```

### Streaming Function Calling

```python
from openai import AssistantEventHandler
from typing_extensions import override

class EventHandler(AssistantEventHandler):
    
    @override
    def on_text_created(self, text) -> None:
        print("\nassistant > ", end="", flush=True)
    
    @override
    def on_text_delta(self, delta, snapshot):
        print(delta.value, end="", flush=True)
    
    @override
    def on_tool_call_created(self, tool_call):
        print(f"\n[Calling: {tool_call.function.name}]")
    
    @override
    def on_tool_call_done(self, tool_call):
        fn_name = tool_call.function.name
        fn_args = json.loads(tool_call.function.arguments)
        
        if fn_name == "get_weather":
            result = get_weather(**fn_args)
        else:
            result = "Unknown function"
        
        # Submit result and continue streaming
        with client.beta.threads.runs.submit_tool_outputs_stream(
            thread_id=self.current_run.thread_id,
            run_id=self.current_run.id,
            tool_outputs=[{
                "tool_call_id": tool_call.id,
                "output": json.dumps(result)
            }],
            event_handler=EventHandler(),
        ) as stream:
            stream.until_done()

# Use streaming
with client.beta.threads.runs.stream(
    thread_id=thread.id,
    assistant_id=assistant.id,
    event_handler=EventHandler(),
) as stream:
    stream.until_done()
```

---

## Streaming {#streaming}

The Assistants API supports Server-Sent Events (SSE) streaming:

### Stream Events

| Event | Description |
|-------|-------------|
| `thread.created` | Thread was created |
| `thread.run.created` | Run started |
| `thread.run.in_progress` | Run is executing |
| `thread.run.requires_action` | Tool calls needed |
| `thread.run.completed` | Run finished |
| `thread.run.failed` | Run errored |
| `thread.message.created` | New message started |
| `thread.message.delta` | Token chunk received |
| `thread.message.completed` | Message complete |
| `thread.run.step.created` | New step started |
| `thread.run.step.delta` | Step progress |
| `thread.run.step.completed` | Step done |

---

## File Handling & Vector Stores {#files}

### Uploading Files

```python
# Upload for code interpreter
with open("data.csv", "rb") as f:
    file = client.files.create(
        file=f,
        purpose="assistants"
    )

# Upload image for vision
with open("chart.png", "rb") as f:
    image_file = client.files.create(
        file=f,
        purpose="vision"
    )

# File limits
# Max size per file: 512 MB
# Max tokens per file: 5,000,000
# Storage per project: 2.5 TB
```

### Vector Stores

```python
# Create vector store
vs = client.beta.vector_stores.create(
    name="Company Knowledge Base",
)

# Add files to vector store (batch)
batch = client.beta.vector_stores.file_batches.create(
    vector_store_id=vs.id,
    file_ids=[f1.id, f2.id, f3.id],
)

# Wait for processing
while batch.status == "in_progress":
    time.sleep(1)
    batch = client.beta.vector_stores.file_batches.retrieve(
        vector_store_id=vs.id,
        batch_id=batch.id
    )

# Attach to thread (overrides assistant's vector store for this thread)
thread = client.beta.threads.create(
    tool_resources={
        "file_search": {
            "vector_store_ids": [vs.id]
        }
    }
)

# Configure chunking strategy
vs_with_custom_chunking = client.beta.vector_stores.create(
    name="Custom Chunked Store",
    chunking_strategy={
        "type": "static",
        "static": {
            "max_chunk_size_tokens": 400,
            "chunk_overlap_tokens": 200
        }
    }
)
```

---

## How It Differs from Chat Completions {#differences}

### Chat Completions API (Raw)

```python
# Stateless — must send full history each time
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are helpful"},
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "What's the weather?"},
    ]
)
# Developer manages history, context, tools, files
```

### Assistants API (Stateful)

```python
# Stateful — OpenAI manages history in Threads
thread = client.beta.threads.create()
client.beta.threads.messages.create(thread.id, role="user", content="Hello")
run = client.beta.threads.runs.create(thread.id, assistant_id=asst.id)
# OpenAI manages: history, context window, tool execution
```

### Key Differences

| Feature | Chat Completions | Assistants API |
|---------|-----------------|----------------|
| State management | Developer | OpenAI (Threads) |
| Context window | Manual | Auto-managed |
| Tool execution | Manual loop | Managed lifecycle |
| File storage | None | Files + Vector Stores |
| Code execution | None | Built-in Code Interpreter |
| Configuration | Per-request | Persistent (Assistants) |
| Cost model | Per token | Per token + tool fees |
| Statefulness | None | Server-side |

---

## The Responses API — Successor {#responses-api}

Launched March 2025, the **Responses API** replaces both Chat Completions (for agentic use) and Assistants API:

### Key Improvements

1. **Unified interface** — one API for stateless and stateful use
2. **Better performance** — 3% improvement on SWE-bench vs Chat Completions
3. **Lower costs** — 40-80% better cache utilization
4. **Agentic by default** — model runs multi-tool loops in single request
5. **Built-in tools** — web_search, file_search, code_interpreter, computer_use, MCP

### Responses API Quick Example

```python
from openai import OpenAI
client = OpenAI()

# Simple: single turn
response = client.responses.create(
    model="gpt-4o",
    input="What's 2+2?",
)
print(response.output_text)

# With built-in tools
response = client.responses.create(
    model="gpt-4o",
    tools=[
        {"type": "web_search_preview"},
        {"type": "code_interpreter", "container": {"type": "auto"}},
    ],
    input="Search for the latest GPT-5 benchmarks and analyze them",
    store=True,  # Store for multi-turn
)

# Multi-turn stateful (like Threads)
response2 = client.responses.create(
    model="gpt-4o",
    previous_response_id=response.id,  # Continues conversation
    input="Now compare those benchmarks to Claude 3.5",
)

# With function calling
response = client.responses.create(
    model="gpt-4o",
    tools=[{
        "type": "function",
        "name": "get_weather",
        "description": "Get weather for a location",
        "parameters": {
            "type": "object",
            "properties": {"location": {"type": "string"}},
            "required": ["location"]
        }
    }],
    input="What's the weather in Singapore?",
)

# Handle function call output
if response.output[0].type == "function_call":
    fn_call = response.output[0]
    result = get_weather(json.loads(fn_call.arguments)["location"])
    
    # Submit result and continue
    response2 = client.responses.create(
        model="gpt-4o",
        previous_response_id=response.id,
        input=[{
            "type": "function_call_output",
            "call_id": fn_call.call_id,
            "output": json.dumps(result)
        }]
    )
```

### Assistants → Responses Migration

| Assistants Concept | Responses Equivalent |
|-------------------|---------------------|
| `assistant.create()` | `instructions` parameter |
| `thread.create()` | `store=True` + `previous_response_id` |
| `run.create()` | `responses.create()` |
| `requires_action` | `output[].type == "function_call"` |
| `submit_tool_outputs` | New `responses.create()` with function output |
| Code Interpreter | `{"type": "code_interpreter"}` tool |
| File Search | `{"type": "file_search"}` tool |
| Vector Stores | Same (shared between APIs) |

---

## Code Examples {#code-examples}

### Complete Assistant Chatbot (Assistants API)

```python
from openai import OpenAI
import json, time

client = OpenAI()

# Setup (one-time)
assistant = client.beta.assistants.create(
    name="Customer Support Bot",
    instructions="""You are a helpful customer support agent for TechCorp.
    Be friendly, concise, and accurate. If you don't know something, 
    say so and offer to escalate to a human agent.""",
    model="gpt-4o",
    tools=[
        {"type": "file_search"},
        {
            "type": "function",
            "function": {
                "name": "get_order_status",
                "description": "Get the status of a customer order",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "string"}
                    },
                    "required": ["order_id"]
                }
            }
        }
    ]
)

def chat(user_message: str, thread_id: str = None) -> tuple[str, str]:
    """
    Send a message and get a response.
    Returns (response_text, thread_id)
    """
    # Create or reuse thread
    if thread_id is None:
        thread = client.beta.threads.create()
        thread_id = thread.id
    
    # Add user message
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=user_message,
    )
    
    # Create and poll run
    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread_id,
        assistant_id=assistant.id,
    )
    
    # Handle function calls if needed
    while run.status == "requires_action":
        tool_outputs = []
        for tc in run.required_action.submit_tool_outputs.tool_calls:
            args = json.loads(tc.function.arguments)
            
            if tc.function.name == "get_order_status":
                result = {"status": "shipped", "eta": "2025-04-01"}
            else:
                result = {"error": "unknown function"}
            
            tool_outputs.append({
                "tool_call_id": tc.id,
                "output": json.dumps(result)
            })
        
        run = client.beta.threads.runs.submit_tool_outputs_and_poll(
            thread_id=thread_id,
            run_id=run.id,
            tool_outputs=tool_outputs,
        )
    
    # Get response
    messages = client.beta.threads.messages.list(
        thread_id=thread_id,
        order="desc",
        limit=1
    )
    
    response_text = messages.data[0].content[0].text.value
    return response_text, thread_id

# Usage
response, thread = chat("Hi, what's the status of order ORD-12345?")
print(response)

response2, thread = chat("Can I change my delivery address?", thread)
print(response2)
```

---

## Migration Guide Summary {#migration}

Moving from Assistants API to Responses API:

### What Changes

```python
# BEFORE (Assistants API)
assistant = client.beta.assistants.create(
    model="gpt-4o",
    instructions="You are helpful",
    tools=[{"type": "code_interpreter"}]
)
thread = client.beta.threads.create()
client.beta.threads.messages.create(thread.id, role="user", content="Hello")
run = client.beta.threads.runs.create_and_poll(thread.id, assistant_id=assistant.id)
messages = client.beta.threads.messages.list(thread.id)
result = messages.data[0].content[0].text.value

# AFTER (Responses API)
response = client.responses.create(
    model="gpt-4o",
    instructions="You are helpful",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    input="Hello",
    store=True,  # Enable stateful storage
)
result = response.output_text

# For multi-turn:
response2 = client.responses.create(
    model="gpt-4o",
    instructions="You are helpful",
    previous_response_id=response.id,  # Instead of thread
    input="Follow-up question",
)
```

---

## Comparisons {#comparisons}

### Assistants API vs Chat Completions

| Feature | Chat Completions | Assistants API |
|---------|-----------------|----------------|
| Conversation state | Developer-managed | OpenAI-managed |
| Context window | Manual | Auto-managed |
| Code execution | No | Yes (Code Interpreter) |
| File search/RAG | No | Yes (File Search) |
| File storage | No | Yes (2.5 TB) |
| Streaming | Yes | Yes |
| Function calling | Yes | Yes |
| Cost | Per token | Per token + $0.03/CI session |

### Assistants API vs Responses API (New)

| Feature | Assistants API | Responses API |
|---------|---------------|---------------|
| Status | Deprecated Aug 2025 | Current/recommended |
| State management | Thread objects | `previous_response_id` |
| Configuration | Assistant objects | `instructions` per-call |
| Agentic loop | Run lifecycle | Automatic multi-tool |
| Performance | Baseline | +3% on SWE-bench |
| Cache efficiency | 40-60% | 40-80% (improved) |
| Built-in tools | 3 (CI, FS, Function) | 6+ (+ web, MCP, computer) |

---

## Pros & Cons {#pros-cons}

### Assistants API Pros (Historical)

✅ **Managed state** — no need to send full history on each request  
✅ **Built-in tools** — Code Interpreter and File Search without extra setup  
✅ **Persistent configuration** — reusable Assistant objects  
✅ **Auto context management** — smart thread truncation  
✅ **File storage** — 2.5 TB per project  
✅ **Vector stores** — server-side RAG infrastructure  
✅ **Streaming** — SSE events for real-time UX  
✅ **Token efficiency** — messages stored server-side  

### Assistants API Cons

❌ **Deprecated** — shutting down August 26, 2026  
❌ **Additional costs** — $0.03/session for Code Interpreter  
❌ **Polling required** — run lifecycle adds latency  
❌ **OpenAI lock-in** — no portability to other providers  
❌ **Limited customization** — can't modify RAG internals  
❌ **Rate limits** — thread/run operations count against API limits  
❌ **Vendor dependency** — state stored on OpenAI servers  
❌ **Replaced by simpler API** — Responses API is cleaner  

---

## Official URLs {#official-urls}

- **Assistants API Deep Dive**: https://developers.openai.com/api/docs/assistants/deep-dive
- **Assistants Migration Guide**: https://developers.openai.com/api/docs/assistants/migration
- **Responses API Docs**: https://developers.openai.com/api/docs/guides/migrate-to-responses
- **File Search Guide**: https://developers.openai.com/api/docs/guides/tools-file-search
- **Code Interpreter Guide**: https://developers.openai.com/api/docs/guides/tools-code-interpreter
- **Function Calling (Assistants)**: https://developers.openai.com/api/docs/assistants/tools/function-calling
- **Assistants Streaming**: https://platform.openai.com/docs/api-reference/assistants-streaming
- **Deprecations**: https://developers.openai.com/api/docs/deprecations
- **OpenAI Python SDK**: https://github.com/openai/openai-python
- **New Tools for Building Agents**: https://openai.com/index/new-tools-for-building-agents/

---

## Key Takeaways

1. **The Assistants API is deprecated** — don't build new projects on it; use the Responses API
2. **Core innovation**: managed state (Threads), built-in tools (Code Interpreter, File Search)
3. **Run lifecycle** is the core pattern: queued → in_progress → requires_action → completed
4. **Function calling** requires a loop: create run → poll → check requires_action → submit outputs
5. **Responses API is simpler** — `previous_response_id` replaces Threads; instructions replace Assistants
6. **Vector Stores** (file search infrastructure) are shared between Assistants and Responses APIs
7. For new agentic projects: use **Responses API** for single-model or **OpenAI Agents SDK** for multi-agent

---

*Research compiled March 2025. Assistants API shutting down August 26, 2026 — migrate to Responses API.*
