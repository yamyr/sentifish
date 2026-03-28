# Observability and Monitoring for AI Agents

> **Last Updated:** March 2026 | **Research Depth:** Comprehensive | **Sources:** LangSmith, Langfuse, Arize Phoenix, Maxim AI

---

## Overview

Observability for AI agents is fundamentally different from traditional software monitoring. Instead of tracking request/response latency and error rates, you need to understand:

- **Multi-step reasoning traces** — what did the agent think at each step?
- **Tool call patterns** — which tools were called, with what arguments, and what did they return?
- **Token consumption** — how many tokens did each step cost?
- **Model decision-making** — why did the agent choose one path over another?
- **Failure modes** — did the agent hallucinate, loop, or take wrong actions?

The challenge: agents are non-deterministic, multi-step, and can operate over extended time periods. Standard APM (Application Performance Monitoring) tools are insufficient.

---

## The Three Pillars of Agent Observability

### 1. Traces
The complete execution path of an agent run — from user input through all reasoning steps, tool calls, and final output.

### 2. Metrics
Quantitative measurements: token usage, latency per step, success rates, cost per run, error frequency.

### 3. Logs
Structured event records: model invocations, tool executions, state transitions, errors.

---

## Major Observability Platforms

### LangSmith

**What it is:** The native observability platform for LangChain and LangGraph applications.

**Official URL:** https://www.langchain.com/langsmith

**Key Features:**
- Deep integration with LangChain/LangGraph ecosystem
- Automatic trace capture for any LangChain component
- Dataset management for evaluations
- Playground for prompt testing
- Monitoring dashboards for production deployments
- LLM-as-judge evaluators
- Human feedback collection

**Architecture:**
```
Your Agent Code
      │
      ▼
LangSmith Tracer (SDK)
      │
      ▼ (async, non-blocking)
LangSmith API
      │
      ▼
LangSmith Dashboard
  ├── Traces (full run visualization)
  ├── Datasets (test case management)
  ├── Playground (prompt iteration)
  └── Monitoring (production metrics)
```

**Quick Setup:**
```python
import os
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.tools import tool

# Enable LangSmith tracing
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls_..."
os.environ["LANGCHAIN_PROJECT"] = "my-agent-project"

@tool
def search_web(query: str) -> str:
    """Search the web for information"""
    # ... implementation
    return f"Results for {query}"

llm = ChatOpenAI(model="gpt-4o")

# All LangChain calls are automatically traced
agent = create_openai_tools_agent(llm, [search_web], prompt)
executor = AgentExecutor(agent=agent, tools=[search_web])

# This run is fully traced in LangSmith
result = executor.invoke({"input": "What is the weather in Singapore?"})
```

**Custom Trace Spans:**
```python
from langsmith import traceable

@traceable(name="my-custom-step", tags=["important"])
def custom_processing(data: str) -> str:
    # Any function wrapped with @traceable is captured as a span
    result = process(data)
    return result

@traceable(run_type="llm")
def call_llm(messages: list) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    return response.choices[0].message.content
```

**Pros:**
- ✅ Zero-config for LangChain users (just set env vars)
- ✅ Best-in-class LangGraph visualization
- ✅ Excellent dataset/eval tooling
- ✅ Rich filter/search capabilities

**Cons:**
- ❌ Tightly coupled to LangChain ecosystem
- ❌ SaaS-only (no on-prem option for security-sensitive orgs)
- ❌ Can be expensive at scale
- ❌ Limited support for non-Python environments

---

### Langfuse

**What it is:** Open-source LLM observability and evaluation platform. Available as SaaS or self-hosted.

**Official URL:** https://langfuse.com

**Key Differentiator:** Self-hostable (MIT license), multi-framework support, strong privacy/compliance story.

**Architecture:**
```
Your Agent
    │
    ├── Python SDK (langfuse)
    ├── JS/TS SDK (@langfuse/langfuse)  
    ├── LangChain Integration (CallbackHandler)
    ├── LlamaIndex Integration
    └── OpenAI proxy wrapper
              │
              ▼ (async batch sending)
         Langfuse API (cloud or self-hosted)
              │
              ▼
    ┌─────────────────────────────┐
    │     Langfuse Dashboard       │
    │  ├── Traces                  │
    │  ├── Scores                  │
    │  ├── Datasets                │
    │  ├── Cost tracking           │
    │  └── Users/Sessions          │
    └─────────────────────────────┘
```

**Core Concepts:**
- **Trace** — top-level container for an agent run
- **Span** — a unit of work within a trace (tool call, LLM call, etc.)
- **Score** — evaluation result attached to a trace
- **Generation** — an LLM call with input/output/token metadata

**Quick Setup:**
```python
from langfuse import Langfuse
from langfuse.openai import OpenAI  # Drop-in OpenAI replacement

langfuse = Langfuse(
    public_key="pk-lf-...",
    secret_key="sk-lf-...",
    host="https://cloud.langfuse.com"  # or your self-hosted URL
)

# Drop-in OpenAI replacement that auto-traces
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
    # Langfuse metadata (optional)
    name="my-trace-name",
    user_id="user-123",
    session_id="session-456",
    tags=["production", "customer-service"],
)
```

**Manual Tracing for Custom Agents:**
```python
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context

langfuse = Langfuse()

@observe()
def research_agent(user_query: str) -> str:
    # This function is automatically traced
    langfuse_context.update_current_trace(
        name="research-agent",
        user_id="user-123",
        tags=["research"],
        metadata={"query_type": "informational"}
    )
    
    # Sub-spans are created automatically for nested @observe calls
    search_results = search_web(user_query)
    answer = generate_answer(search_results, user_query)
    
    # Add a score
    langfuse_context.score_current_trace(
        name="quality",
        value=0.85,
        comment="Manual review: good answer"
    )
    
    return answer

@observe(name="web-search")
def search_web(query: str) -> str:
    # This creates a nested span
    return perform_search(query)
```

**Token & Cost Tracking:**
```python
# Langfuse automatically tracks token usage for 100+ models
# View cost breakdown in dashboard per:
# - Model (GPT-4o vs Claude vs Gemini)
# - User
# - Session
# - Tag
# - Time period

# Manual cost annotation if needed:
with langfuse.start_as_current_span(name="custom-llm") as span:
    result = my_custom_llm(prompt)
    span.update(
        usage_details={
            "input": 500,
            "output": 100,
            "total": 600
        },
        cost_details={"total": 0.003}
    )
```

**Self-Hosting with Docker:**
```yaml
# docker-compose.yml
version: "3"
services:
  langfuse:
    image: langfuse/langfuse:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/langfuse
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=http://localhost:3000
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=langfuse
```

**Pros:**
- ✅ Self-hostable (great for enterprise/compliance)
- ✅ Framework-agnostic
- ✅ Strong data privacy controls (PCI DSS, GDPR masking)
- ✅ Free open-source tier with full features
- ✅ Multi-modal support (text, images)

**Cons:**
- ❌ Requires more setup than LangSmith for LangChain users
- ❌ Evaluation UI less polished than LangSmith
- ❌ Real-time streaming traces can be tricky

---

### Arize Phoenix

**What it is:** Open-source observability for LLM/ML models, with strong AI evaluation capabilities.

**Official URLs:**  
- Platform: https://arize.com  
- Open-source Phoenix: https://phoenix.arize.com / https://github.com/Arize-ai/phoenix

**Key Differentiator:** Bridges traditional ML monitoring (data drift, feature importance) with LLM-specific needs. Strong for teams already using Arize for ML model monitoring.

**Architecture:**
```
Your Agent
    │
    ├── OpenTelemetry (OTLP)  ← standard protocol
    ├── LangChain callback
    ├── LlamaIndex callback
    └── OpenInference SDK
              │
              ▼
       Phoenix Collector
              │
              ▼
    ┌──────────────────────────────┐
    │        Phoenix UI             │
    │  ├── Traces & Spans           │
    │  ├── Span Evaluations         │
    │  ├── Dataset Curation         │
    │  └── Embedding Visualization  │
    └──────────────────────────────┘
```

**Quick Setup (Local):**
```python
import phoenix as px
from phoenix.otel import register
from opentelemetry.instrumentation.langchain import LangChainInstrumentor

# Start Phoenix UI locally
session = px.launch_app()

# Register with OpenTelemetry
tracer_provider = register(
    project_name="my-agent-project",
    endpoint="http://localhost:4317"  # Phoenix OTLP endpoint
)

# Auto-instrument LangChain
LangChainInstrumentor().instrument()

# Now all your LangChain code is automatically traced
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o")
result = llm.invoke("What is agentic AI?")

# Open http://localhost:6006 to see traces
```

**LLM Evaluations with Phoenix:**
```python
import phoenix.evals as evals
from phoenix.evals import HallucinationEvaluator, QAEvaluator

# Evaluate traces for hallucinations
hallucination_eval = HallucinationEvaluator(model=eval_llm)
qa_eval = QAEvaluator(model=eval_llm)

# Run evaluations on captured traces
results = px.run_evals(
    dataframe=trace_df,
    evaluators=[hallucination_eval, qa_eval],
    provide_explanation=True
)
```

**Pros:**
- ✅ OpenTelemetry native (framework-agnostic)
- ✅ Free open-source with local deployment
- ✅ Excellent embedding visualization
- ✅ Strong ML + LLM combined monitoring

**Cons:**
- ❌ Enterprise features require Arize paid plan
- ❌ Less opinionated (requires more configuration)
- ❌ Complex for teams without OpenTelemetry background

---

## Comparison Table

| Feature | LangSmith | Langfuse | Arize Phoenix |
|---------|-----------|----------|---------------|
| **Open Source** | ❌ | ✅ (MIT) | ✅ (Apache 2) |
| **Self-hostable** | ❌ | ✅ | ✅ |
| **LangChain integration** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Framework agnostic** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Token cost tracking** | ✅ | ✅ (100+ models) | ✅ |
| **Evaluation suite** | ✅ | ✅ | ✅ |
| **Human feedback** | ✅ | ✅ | ✅ |
| **Real-time streaming** | ✅ | ⚠️ | ✅ |
| **ML model monitoring** | ❌ | ❌ | ✅ |
| **Data privacy controls** | Limited | Strong | Medium |
| **Multi-language SDKs** | Python, JS | Python, JS, Go, Ruby | Python |
| **Free tier** | Yes | Yes (generous) | Yes (local) |

---

## Tracing Agent Runs: Architecture Deep Dive

### Distributed Tracing Concepts for Agents

```
Trace (one agent "run")
├── Root Span: "agent_executor"
│   ├── Child Span: "llm_call_1" (planning)
│   │   ├── Input tokens: 512
│   │   ├── Output tokens: 128
│   │   └── Duration: 1.2s
│   ├── Child Span: "tool_call: web_search"
│   │   ├── Args: {"query": "..."}
│   │   ├── Result: "..."
│   │   └── Duration: 0.8s
│   ├── Child Span: "llm_call_2" (synthesis)
│   │   ├── Input tokens: 1024
│   │   ├── Output tokens: 256
│   │   └── Duration: 2.1s
│   └── Child Span: "tool_call: send_email"
│       ├── Args: {"to": "...", "subject": "..."}
│       └── Duration: 0.3s
└── Total: 4.4s, 1920 tokens, $0.027
```

### OpenTelemetry for Agents (Framework-Agnostic)

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Setup OTEL provider
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://collector:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer("my-agent")

def agent_run(user_query: str):
    with tracer.start_as_current_span("agent_run") as span:
        span.set_attribute("user.query", user_query)
        span.set_attribute("agent.version", "1.2.0")
        
        with tracer.start_as_current_span("llm_planning") as llm_span:
            response = llm.invoke(user_query)
            llm_span.set_attribute("llm.model", "gpt-4o")
            llm_span.set_attribute("llm.tokens.input", response.usage.prompt_tokens)
            llm_span.set_attribute("llm.tokens.output", response.usage.completion_tokens)
        
        if response.tool_calls:
            for tool_call in response.tool_calls:
                with tracer.start_as_current_span(f"tool.{tool_call.name}") as tool_span:
                    tool_span.set_attribute("tool.name", tool_call.name)
                    tool_span.set_attribute("tool.args", str(tool_call.args))
                    result = execute_tool(tool_call)
                    tool_span.set_attribute("tool.result_length", len(str(result)))
```

---

## Debugging Multi-Step Agents

### Common Failure Modes

| Failure Mode | Symptoms | Debug Strategy |
|-------------|----------|----------------|
| **Infinite loops** | Agent keeps calling same tool | Trace: count repeated tool calls |
| **Hallucinated tool calls** | Agent invents non-existent tools | Validate tool names in traces |
| **Context overload** | Quality degrades in long runs | Track token counts per step |
| **Wrong tool selection** | Uses inappropriate tool | Compare intended vs actual tool |
| **Stuck planning** | Agent can't decide what to do | Log intermediate thoughts |
| **Silent failures** | Tool errors not surfaced | Ensure errors are captured in spans |

### Debug Snippet: Verbose Agent Logging

```python
import logging
from langchain.globals import set_verbose, set_debug

# Enable verbose LangChain output
set_verbose(True)  
set_debug(True)  # Even more detailed

# Or use callbacks for custom logging
from langchain.callbacks.base import BaseCallbackHandler

class DebugCallbackHandler(BaseCallbackHandler):
    def on_llm_start(self, serialized, prompts, **kwargs):
        print(f"\n🤖 LLM CALL START")
        print(f"Prompt length: {sum(len(p) for p in prompts)} chars")
    
    def on_llm_end(self, response, **kwargs):
        print(f"✅ LLM CALL END")
        print(f"Response: {response.generations[0][0].text[:100]}...")
        if hasattr(response, 'llm_output'):
            usage = response.llm_output.get('token_usage', {})
            print(f"Tokens: {usage}")
    
    def on_tool_start(self, serialized, input_str, **kwargs):
        print(f"\n🔧 TOOL CALL: {serialized.get('name')}")
        print(f"Input: {input_str[:200]}")
    
    def on_tool_end(self, output, **kwargs):
        print(f"🔧 TOOL RESULT: {str(output)[:200]}")
    
    def on_agent_action(self, action, **kwargs):
        print(f"\n💭 AGENT THOUGHT: {action.log[:300]}")
    
    def on_agent_finish(self, finish, **kwargs):
        print(f"\n🏁 AGENT DONE: {finish.return_values}")

# Use it:
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    callbacks=[DebugCallbackHandler()]
)
```

---

## Token Usage Tracking in Production

### Cost Monitoring Dashboard Setup

```python
# Aggregate token usage across runs
import sqlite3
from datetime import datetime

class TokenTracker:
    def __init__(self, db_path="token_usage.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_db()
    
    def _init_db(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS usage (
                id INTEGER PRIMARY KEY,
                timestamp TEXT,
                model TEXT,
                input_tokens INTEGER,
                output_tokens INTEGER,
                cost_usd REAL,
                trace_id TEXT,
                user_id TEXT,
                tags TEXT
            )
        """)
        self.conn.commit()
    
    def record(self, model, input_tokens, output_tokens, trace_id, user_id="", tags=""):
        cost = self._calculate_cost(model, input_tokens, output_tokens)
        self.conn.execute(
            "INSERT INTO usage VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)",
            (datetime.now().isoformat(), model, input_tokens, output_tokens,
             cost, trace_id, user_id, tags)
        )
        self.conn.commit()
        return cost
    
    def _calculate_cost(self, model, input_tokens, output_tokens) -> float:
        # Per-million token pricing
        pricing = {
            "gpt-4o": {"input": 2.50, "output": 10.00},
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
            "claude-3-haiku": {"input": 0.25, "output": 1.25},
        }
        p = pricing.get(model, {"input": 1.0, "output": 3.0})
        return (input_tokens * p["input"] + output_tokens * p["output"]) / 1_000_000
    
    def daily_summary(self) -> dict:
        today = datetime.now().strftime("%Y-%m-%d")
        cursor = self.conn.execute(
            "SELECT model, SUM(input_tokens), SUM(output_tokens), SUM(cost_usd) "
            "FROM usage WHERE timestamp LIKE ? GROUP BY model",
            (f"{today}%",)
        )
        return {row[0]: {"input": row[1], "output": row[2], "cost": row[3]}
                for row in cursor}
```

---

## Alerting & Anomaly Detection

### Key Metrics to Alert On

```python
# Example alert configuration (pseudo-code for monitoring system)

ALERTS = [
    {
        "name": "High per-run cost",
        "condition": "run_cost_usd > 0.50",
        "severity": "warning",
        "action": "notify + log"
    },
    {
        "name": "Runaway agent (looping)",
        "condition": "tool_calls_in_run > 50",
        "severity": "critical",
        "action": "kill_agent + notify"
    },
    {
        "name": "Repeated tool failures",
        "condition": "tool_error_rate > 0.3 over 5 minutes",
        "severity": "warning",
        "action": "notify"
    },
    {
        "name": "Token spike",
        "condition": "hourly_tokens > 10x baseline",
        "severity": "critical",
        "action": "throttle + notify"
    },
    {
        "name": "Latency degradation",
        "condition": "p95_latency > 30s",
        "severity": "warning",
        "action": "notify"
    }
]
```

---

## Best Practices

1. **Trace everything from day 1** — Retroactive tracing is impossible. Add observability before you need it.

2. **Use sampling in high-volume production** — Don't trace every call; sample at 10-20% and trace 100% of errors.

3. **Enrich traces with business context** — Add user IDs, session IDs, feature flags, and task types to every trace.

4. **Set up cost budgets** — Alert when daily/weekly token spend exceeds thresholds.

5. **Create a "golden dataset"** — Curate 100-200 representative inputs with expected outputs for regression testing.

6. **Separate eval environments** — Don't run production traces and eval runs in the same project.

7. **Store trace IDs in your database** — Link user complaints to specific traces for rapid debugging.

8. **Use LLM-as-judge for quality** — Auto-score traces for hallucination, coherence, and task completion.

---

## Official URLs

- **LangSmith:** https://www.langchain.com/langsmith | Docs: https://docs.smith.langchain.com/
- **Langfuse:** https://langfuse.com | GitHub: https://github.com/langfuse/langfuse
- **Arize Phoenix:** https://phoenix.arize.com | GitHub: https://github.com/Arize-ai/phoenix
- **Maxim AI:** https://www.getmaxim.ai
- **Braintrust:** https://www.braintrustdata.com
- **OpenTelemetry:** https://opentelemetry.io
- **OpenInference (semantic conventions):** https://github.com/Arize-ai/openinference

---

*Research compiled March 2026. Platform capabilities evolve rapidly; verify current feature sets against official documentation.*
