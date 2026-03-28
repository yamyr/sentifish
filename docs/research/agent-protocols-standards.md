# Agent Protocols & Standards: Comprehensive Research Guide

> **Last Updated:** March 2025  
> **Key Protocols:** MCP, A2A, ACP, OpenAI Swarm  
> **Status:** Rapidly evolving field — multiple competing and converging standards

---

## Table of Contents

1. [Overview](#overview)
2. [Why Standardized Agent Protocols Matter](#why-standardized-agent-protocols-matter)
3. [Model Context Protocol (MCP) — Anthropic](#model-context-protocol-mcp--anthropic)
4. [Agent-to-Agent Protocol (A2A) — Google](#agent-to-agent-protocol-a2a--google)
5. [Agent Communication Protocol (ACP) — IBM](#agent-communication-protocol-acp--ibm)
6. [OpenAI Agent Handoffs & Swarm](#openai-agent-handoffs--swarm)
7. [Protocol Comparison Matrix](#protocol-comparison-matrix)
8. [How the Protocols Complement Each Other](#how-the-protocols-complement-each-other)
9. [Industry Adoption & Governance](#industry-adoption--governance)
10. [Code Examples](#code-examples)
11. [Interoperability Challenges](#interoperability-challenges)
12. [Future Directions](#future-directions)
13. [References](#references)

---

## Overview

The AI agent ecosystem in 2024–2025 faced a critical challenge: every framework, vendor, and platform built proprietary ways for agents to communicate with tools and other agents. This created an "N×M integration problem" — N agents needing custom connectors for each of M tools or services.

Three major protocols emerged to solve different aspects of this problem:

| Protocol | Origin | Year | Focus |
|----------|--------|------|-------|
| **MCP** (Model Context Protocol) | Anthropic | Nov 2024 | Agent ↔ Tools/Resources |
| **A2A** (Agent-to-Agent) | Google | Apr 2025 | Agent ↔ Agent |
| **ACP** (Agent Communication Protocol) | IBM Research | 2025 | Agent ↔ Agent (REST-based) |

These protocols are **complementary, not competing** — they solve different layers of the agent communication stack:

```
┌─────────────────────────────────────────────────┐
│              Agent Ecosystem                     │
│                                                  │
│  Agent A ←────── A2A / ACP ──────→ Agent B       │
│     │                                   │        │
│    MCP                                 MCP       │
│     │                                   │        │
│  Tools &                            Tools &      │
│  Resources                          Resources    │
└─────────────────────────────────────────────────┘
```

---

## Why Standardized Agent Protocols Matter

### The Problem Before Standards

Before MCP and A2A, developers faced:

1. **Vendor lock-in:** Each AI provider (OpenAI, Anthropic, etc.) had different APIs for tool calling
2. **Custom glue code:** Every agent-to-tool connection required bespoke integration
3. **No agent discovery:** Agents couldn't find or delegate to other agents dynamically
4. **No lifecycle management:** No standard way to track task status, cancel tasks, or handle errors
5. **Security fragmentation:** Each integration had its own auth/security model

### The "N×M" Problem

```
Without standards:
  5 agents × 10 tools = 50 custom integrations needed
  
With MCP:
  5 agents × 10 tools = 5 agent MCP clients + 10 tool MCP servers = 15 implementations
  
With A2A + MCP:
  Multi-vendor agents can collaborate without custom connectors
```

---

## Model Context Protocol (MCP) — Anthropic

### Background

**Launched:** November 2024  
**Donated to Linux Foundation:** December 2025 (via Agentic AI Foundation / AAIF)  
**GitHub:** https://github.com/modelcontextprotocol  
**Spec:** https://modelcontextprotocol.io/specification/2025-11-25

MCP was created by Anthropic developer David Soria Parra, born from frustration with constantly writing custom connectors for Claude to access different data sources. It was inspired by the **Language Server Protocol (LSP)** from the IDE world.

### Architecture

MCP uses a **client-server architecture** with:
- **MCP Host:** The AI application (e.g., Claude Desktop, cursor.sh)
- **MCP Client:** Runs inside the host, manages connections to servers
- **MCP Server:** Exposes capabilities (tools, resources, prompts)

```
┌─────────────────────────────────────┐
│  MCP Host (Claude Desktop, etc.)    │
│                                     │
│  ┌───────────┐   ┌──────────────┐   │
│  │ AI Model  │   │  MCP Client  │   │
│  └─────┬─────┘   └──────┬───────┘   │
│        │                │           │
└────────┼────────────────┼───────────┘
         │                │
         │         JSON-RPC 2.0
         │                │
         │     ┌──────────▼──────────┐
         │     │    MCP Server       │
         │     │  - Tools (APIs)     │
         │     │  - Resources (data) │
         │     │  - Prompts          │
         │     └─────────────────────┘
```

### Transport Mechanisms

1. **stdio** — Local processes communicate via standard I/O (most common)
2. **HTTP + SSE** — Remote servers via HTTP with Server-Sent Events for streaming
3. **WebSockets** — Bidirectional streaming (newer)

### Core Primitives

| Primitive | Description | Example |
|-----------|-------------|---------|
| **Tools** | Functions the LLM can invoke | `search_database`, `run_query` |
| **Resources** | Data sources the LLM can read | File contents, API responses |
| **Prompts** | Reusable prompt templates | Slash commands in Claude |
| **Sampling** | LLM can request completions from host | Agent-in-agent |

### MCP Transport: JSON-RPC 2.0

```json
// Request: Tool call
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_database",
    "arguments": {
      "query": "sales in Q4 2024",
      "limit": 10
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 47 records matching 'sales in Q4 2024'..."
      }
    ]
  }
}
```

### Building an MCP Server (Python)

```python
from mcp.server import Server
from mcp.server.models import InitializationOptions
import mcp.types as types

app = Server("my-database-server")

@app.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="search_records",
            description="Search database records",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "description": "Max results"}
                },
                "required": ["query"]
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "search_records":
        results = await database.search(
            query=arguments["query"],
            limit=arguments.get("limit", 10)
        )
        return [types.TextContent(type="text", text=str(results))]

# Run server
if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server() as (read_stream, write_stream):
            await app.run(read_stream, write_stream, InitializationOptions())
    
    asyncio.run(main())
```

### MCP Adoption

Within one year of launch, MCP achieved remarkable adoption:
- **1000+** community-built MCP servers
- Integrated into: Claude Desktop, VS Code (via Copilot), Cursor, Windsurf, Continue.dev
- Supported by: Anthropic, OpenAI, Google, Microsoft, Block, Amazon
- Official servers for: GitHub, Slack, Google Drive, PostgreSQL, Filesystem, Brave Search

---

## Agent-to-Agent Protocol (A2A) — Google

### Background

**Announced:** April 9, 2025  
**Contributed to Linux Foundation:** June 2025  
**GitHub:** https://github.com/a2aproject/A2A  
**Docs:** https://a2a.dev

Google launched A2A to address the **agent-to-agent communication gap** that MCP left open. While MCP handles agent-to-tool connections, A2A handles agent-to-agent collaboration — allowing agents from different vendors to discover, communicate, and coordinate.

### Core Concepts

**1. Agent Card**  
Every A2A-compatible agent publishes a "card" describing its capabilities (like a business card):

```json
{
  "name": "Financial Analyst Agent",
  "description": "Analyzes financial data and generates reports",
  "url": "https://agents.example.com/finance",
  "version": "1.0.0",
  "skills": [
    {
      "id": "analyze_portfolio",
      "name": "Analyze Portfolio",
      "description": "Analyzes investment portfolio performance",
      "inputModes": ["text"],
      "outputModes": ["text", "application/json"]
    }
  ],
  "authentication": {
    "schemes": ["Bearer"]
  }
}
```

**2. Tasks**  
A2A organizes work around `Task` objects with lifecycle states:

```
submitted → working → [input-required] → completed / failed / canceled
```

**3. Streaming**  
A2A supports **Server-Sent Events (SSE)** for long-running tasks with streaming updates.

### A2A Architecture

```
Client Agent                          Remote Agent
    │                                      │
    │── POST /tasks/send ─────────────────►│
    │   { message: "Analyze portfolio" }   │
    │                                      │
    │◄─ SSE Stream ────────────────────────│
    │   { status: "working" }              │
    │   { artifact: "interim_report" }     │
    │   { status: "completed" }            │
    │                                      │
    │── GET /.well-known/agent.json ──────►│
    │◄─ Agent Card ────────────────────────│
```

### A2A Technical Stack

- **Transport:** HTTP/HTTPS
- **Messaging:** JSON-RPC 2.0
- **Streaming:** Server-Sent Events (SSE)
- **Discovery:** `/.well-known/agent.json` endpoint
- **Auth:** OAuth 2.0, API keys, Bearer tokens

### A2A Code Example (Python)

```python
# Client: Calling a remote A2A agent
import httpx
import json

async def call_remote_agent(agent_url: str, message: str):
    async with httpx.AsyncClient() as client:
        # Send task
        response = await client.post(
            f"{agent_url}/tasks/send",
            json={
                "id": "task-123",
                "message": {
                    "role": "user",
                    "parts": [{"type": "text", "text": message}]
                }
            },
            headers={"Authorization": "Bearer YOUR_TOKEN"}
        )
        
        task = response.json()
        task_id = task["id"]
        
        # Poll or stream for results
        async with client.stream("GET", f"{agent_url}/tasks/{task_id}/events") as stream:
            async for line in stream.aiter_lines():
                if line.startswith("data:"):
                    event = json.loads(line[5:])
                    print(f"Status: {event.get('status')}")
                    if event.get("status") == "completed":
                        return event.get("artifacts", [])

# Discover agents
async def discover_agent(agent_url: str):
    async with httpx.AsyncClient() as client:
        card_response = await client.get(f"{agent_url}/.well-known/agent.json")
        return card_response.json()
```

### A2A Ecosystem Partners (April 2025 Launch)

More than **50 technology partners** at launch:
- Atlassian, Box, Cohere, Deloitte, Elastic, LangChain, LlamaIndex
- MongoDB, PayPal, Salesforce, SAP, ServiceNow, UKG
- Cloud providers: Google Cloud (Vertex AI, Agentspace)

---

## Agent Communication Protocol (ACP) — IBM

### Background

**Origin:** IBM Research  
**Governance:** Linux Foundation (LF AI & Data)  
**Status:** ACP merged into A2A in August 2025, with IBM joining A2A's Technical Steering Committee  
**Framework:** BeeAI (IBM's agent framework)  
**GitHub:** https://github.com/i-am-bee/acp

ACP was IBM Research's answer to agent interoperability, built as a **RESTful** alternative to MCP and A2A. While technically distinct, it was unified with A2A in mid-2025 — IBM's agents can now use `A2AServer` adapters to become A2A-compliant.

### ACP Design Principles

1. **REST-native:** Standard HTTP verbs, no special SDKs required
2. **Stateless design:** Easy horizontal scaling
3. **Multipart messages:** Supports mixed text/file/data payloads
4. **Framework-agnostic:** Works with any agent implementation
5. **BeeAI integration:** Native support in IBM's BeeAI framework

### ACP vs MCP Comparison

| Aspect | ACP | MCP |
|--------|-----|-----|
| Scope | Agent-to-agent | Agent-to-tool/resource |
| Transport | REST/HTTP | stdio or HTTP+SSE |
| Message format | Multipart | JSON-RPC |
| State model | Stateless | Session-based |
| Auth | Standard HTTP auth | Various |
| SDK required | No | Recommended |

---

## OpenAI Agent Handoffs & Swarm

### OpenAI Swarm (October 2024)

**GitHub:** https://github.com/openai/swarm  
**Status:** Experimental/educational — not for production

OpenAI released Swarm as a **lightweight, educational framework** for exploring multi-agent patterns. It's intentionally minimal and not meant as a production solution.

**Core Primitives:**
1. **Agents:** Named entities with instructions and tools
2. **Handoffs:** Transfer control from one agent to another (implemented as a special tool call)
3. **Context Variables:** Shared state passed between agents (not persisted across turns)

```python
from swarm import Swarm, Agent

client = Swarm()

def transfer_to_billing():
    """Transfer the customer to the billing agent."""
    return billing_agent

def transfer_to_support():
    """Transfer the customer to technical support."""
    return support_agent

triage_agent = Agent(
    name="Triage Agent",
    instructions="Determine if the customer has a billing issue or technical issue.",
    functions=[transfer_to_billing, transfer_to_support],
)

billing_agent = Agent(
    name="Billing Agent",
    instructions="Handle billing questions and refunds.",
    functions=[],
)

support_agent = Agent(
    name="Support Agent",
    instructions="Help customers with technical problems.",
    functions=[],
)

# Run
response = client.run(
    agent=triage_agent,
    messages=[{"role": "user", "content": "I was charged twice!"}]
)
print(response.messages[-1]["content"])
```

### Handoff Mechanism

A handoff in Swarm works by **returning an Agent object** from a tool function. The Swarm loop detects this and routes subsequent turns to the returned agent.

```
Turn 1: User message → Triage Agent
Triage Agent thinks → calls transfer_to_billing()
→ Returns: billing_agent object

Turn 2: User message → Billing Agent (handoff complete)
```

### OpenAI Agents SDK (2025)

The production evolution of Swarm is the **OpenAI Agents SDK**, which adds:
- Persistent context and state
- Async support
- Streaming
- Built-in tracing/observability
- Production-ready guardrails

```python
from agents import Agent, Runner, handoff

billing_agent = Agent(
    name="Billing",
    instructions="Handle billing inquiries",
)

triage_agent = Agent(
    name="Triage",
    instructions="Route to billing or support based on issue type",
    handoffs=[handoff(billing_agent)]
)

runner = Runner()
result = await runner.run(triage_agent, "I need a refund")
```

---

## Protocol Comparison Matrix

| Feature | MCP | A2A | ACP (IBM) | OpenAI Swarm |
|---------|-----|-----|-----------|--------------|
| **Focus** | Agent↔Tool | Agent↔Agent | Agent↔Agent | Multi-agent routing |
| **Transport** | stdio/HTTP | HTTP+SSE | REST/HTTP | In-process |
| **Standardization** | Linux Foundation | Linux Foundation | Merged into A2A | Experimental |
| **Discovery** | No | Agent Cards | Service registry | Manual |
| **Task lifecycle** | No | Full (states) | Basic | No |
| **Streaming** | SSE | SSE | Yes | No |
| **Auth** | Per-server | OAuth 2.0 | HTTP auth | None |
| **Cross-vendor** | Yes | Yes | Yes | OpenAI only |
| **Production ready** | Yes | Yes | Merging | No |
| **SDK** | Python, TS | Multiple | Python | Python |

---

## How the Protocols Complement Each Other

The key insight (per DigitalOcean and Clarifai analysis) is:

```
Vertical stack (MCP):   Agent → Tool
Horizontal layer (A2A): Agent ↔ Agent

Combined:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Agent A ──────────── A2A ──────────── Agent B     │
│      │                                     │        │
│     MCP                                   MCP       │
│      │                                     │        │
│  [Database]  [APIs]              [Files]  [APIs]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**When to use MCP:**
- Connecting an agent to databases, APIs, file systems
- Tool standardization across different AI models
- Single-agent tool access patterns

**When to use A2A:**
- Multiple specialized agents collaborating
- Cross-vendor agent orchestration
- Long-running tasks with async streaming
- Dynamic agent discovery

**When to use both:**
- Enterprise systems where Agent A (using MCP for tools) delegates subtasks to Agent B (via A2A)

---

## Industry Adoption & Governance

### Linux Foundation Centralization

Both MCP and A2A ended up under the Linux Foundation umbrella by late 2025:

```
Linux Foundation
├── LF AI & Data Foundation
│   └── A2A Protocol (merged with ACP Aug 2025)
│
└── Agentic AI Foundation (AAIF) 
    └── MCP (donated by Anthropic, Dec 2025)
```

**AAIF Co-founders:** Anthropic, Block, OpenAI

### Technical Steering Committee (A2A)

- Google, Microsoft, AWS, Cisco, Salesforce, ServiceNow, SAP, IBM

### MCP Server Ecosystem (late 2025)

Community has built 1000+ servers including:
- **Development:** GitHub, GitLab, Jira, Linear
- **Data:** PostgreSQL, MySQL, SQLite, BigQuery, Snowflake
- **Communication:** Slack, Gmail, Outlook
- **Cloud:** AWS S3, GCP, Azure Blob
- **Search:** Brave Search, Tavily, Perplexity
- **Productivity:** Notion, Google Calendar, Obsidian

---

## Code Examples

### Full MCP + A2A Integration

```python
# Scenario: An orchestrator agent uses MCP for its own tools,
# and A2A to delegate to a specialist agent

from mcp.client import ClientSession
from mcp.client.stdio import stdio_client
import httpx

class OrchestratorAgent:
    def __init__(self):
        self.mcp_session = None
        self.specialist_url = "https://specialist-agent.example.com"
    
    async def setup_mcp(self):
        """Connect to local MCP tools."""
        server_params = {"command": "python", "args": ["./my_tools_server.py"]}
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                self.mcp_session = session
                tools = await session.list_tools()
                return tools
    
    async def call_local_tool(self, tool_name: str, args: dict):
        """Use MCP to call a local tool."""
        result = await self.mcp_session.call_tool(tool_name, args)
        return result.content[0].text
    
    async def delegate_to_specialist(self, task: str) -> str:
        """Use A2A to delegate to a specialist agent."""
        async with httpx.AsyncClient() as client:
            # Send task via A2A
            response = await client.post(
                f"{self.specialist_url}/tasks/send",
                json={
                    "id": "delegated-task-001",
                    "message": {
                        "role": "user",
                        "parts": [{"type": "text", "text": task}]
                    }
                }
            )
            task_data = response.json()
            return task_data.get("result", "")
    
    async def handle_request(self, user_query: str) -> str:
        """Main handler: use local tools or delegate as needed."""
        # Use local MCP tool for data retrieval
        data = await self.call_local_tool("search_database", {"query": user_query})
        
        # Delegate complex analysis to specialist via A2A
        analysis = await self.delegate_to_specialist(
            f"Analyze this data and provide insights: {data}"
        )
        
        return analysis
```

### OpenAI Agents SDK with Handoffs

```python
from agents import Agent, Runner, handoff, RunContext

# Define specialist agents
data_agent = Agent(
    name="DataAnalyst",
    instructions="Retrieve and analyze data from databases",
    tools=[query_database, run_analysis],
)

writer_agent = Agent(
    name="ReportWriter",
    instructions="Write clear, professional reports based on data analysis",
    tools=[format_report, save_to_file],
)

# Orchestrator with handoffs
orchestrator = Agent(
    name="Orchestrator",
    instructions="""You coordinate data analysis and report writing.
    1. First hand off to DataAnalyst for data retrieval
    2. Then hand off to ReportWriter for formatting
    3. Return the final report""",
    handoffs=[
        handoff(data_agent, tool_name="analyze_data"),
        handoff(writer_agent, tool_name="write_report"),
    ]
)

runner = Runner()
result = await runner.run(
    orchestrator, 
    "Generate a Q4 2024 sales performance report"
)
```

---

## Interoperability Challenges

Despite progress, challenges remain:

1. **Auth fragmentation:** Different auth schemes across A2A servers
2. **Semantic incompatibility:** Agent "skills" described in natural language — hard to match programmatically
3. **Trust and verification:** How does Agent A verify Agent B is trustworthy?
4. **Error propagation:** When a delegated task fails, how is error context preserved?
5. **Rate limiting and cost attribution:** Who pays for compute in multi-agent chains?
6. **Versioning:** No formal spec for agent capability versioning

---

## Future Directions

1. **Convergence:** A2A + ACP already merged; MCP and A2A may align further
2. **Agent marketplaces:** Commercial platforms for discovering and monetizing A2A agents
3. **Standardized security:** Shared identity/auth frameworks for agent ecosystems
4. **Agent orchestration clouds:** Managed platforms (Google Agentspace, Vertex AI Agent Engine)
5. **Inter-framework compatibility:** LlamaIndex, LangChain, AutoGen all adding A2A support

---

## References

- **MCP Official Site:** https://modelcontextprotocol.io
- **MCP GitHub:** https://github.com/modelcontextprotocol
- **Anthropic MCP Announcement:** https://www.anthropic.com/news/model-context-protocol
- **A2A Protocol GitHub:** https://github.com/a2aproject/A2A
- **Google A2A Blog:** https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
- **A2A Linux Foundation:** https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade
- **ACP IBM Research:** https://research.ibm.com/projects/agent-communication-protocol
- **ACP + A2A Merger:** https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/
- **OpenAI Swarm:** https://github.com/openai/swarm
- **MCP vs A2A Comparison (Auth0):** https://auth0.com/blog/mcp-vs-a2a/
- **IBM ACP Overview:** https://www.ibm.com/think/topics/agent-communication-protocol
- **A2A What Is (IBM):** https://www.ibm.com/think/topics/agent2agent-protocol
- **MCP Wikipedia:** https://en.wikipedia.org/wiki/Model_Context_Protocol
