# TinyFish Web Agent: Browser Automation API for Agentic Workflows

> Comprehensive research note on TinyFish — what it is, how it works (SSE streaming, browser automation), API design, result formats, comparison with alternatives, and integration patterns for coding agents.

---

## 1. What Is TinyFish?

**TinyFish** (tinyfish.ai) is enterprise infrastructure for agentic web automation. It provides a single API that lets AI agents navigate real websites, authenticate, extract data, click buttons, fill forms, and transact — with full JavaScript execution — at scale.

From their homepage:
> "The web wasn't built for agents. We're fixing that. Enterprise infrastructure for web data operations. Run hundreds of sites at once. Navigate, authenticate, extract, transact. Serverless architecture. No browsers to manage. No proxies to configure."

### The Core Problem TinyFish Solves

Traditional approaches to web data fall into a triangle of trade-offs:

| Approach | Speed | Freshness | Scale | Authenticated Sites |
|---------|-------|----------|-------|---------------------|
| Manual human | Slow | ✅ Live | ❌ Low | ✅ Yes |
| Static scraping (requests/bs4) | Fast | ❌ HTML-only | ✅ High | ❌ Hard |
| Search APIs (Brave/Serper/Tavily) | Fast | ❌ Indexed | ✅ High | ❌ No |
| Browser automation (Playwright/Selenium) | Slow to set up | ✅ Live | ❌ Hard to scale | ✅ Yes |
| **TinyFish** | Fast | ✅ Live | ✅ High | ✅ Yes |

**Key insight from TinyFish**: "Traditional automation can navigate authenticated sites but can't scale. Search platforms are fast but return stale data. Manual processes are accurate but slow. TinyFish delivers fresh data at production speed and scale."

---

## 2. Five Architectural Shifts

TinyFish is built on five architectural innovations that enable live execution on dynamic sites at scale:

1. **Serverless browser execution**: No persistent browser instances to manage. Each automation spins up a fresh, isolated browser on demand.
2. **Anti-detection browsers**: Stealth mode with behavioral fingerprinting evasion for bot-protected sites (Cloudflare, DataDome).
3. **Integrated proxy network**: Residential proxies across US, GB, CA, DE, FR, JP, AU included in the platform — no separate proxy configuration.
4. **SSE streaming**: Real-time event stream shows automation progress as it happens, enabling responsive UIs and agent feedback loops.
5. **Natural language goals**: No CSS selectors, XPath, or DOM inspection needed — the agent understands plain English instructions and figures out the DOM itself.

---

## 3. API Design

### Base URL

```
https://agent.tinyfish.ai
```

### Authentication

```bash
X-API-Key: sk-tinyfish-*****
```

API keys are created at `https://agent.tinyfish.ai/api-keys`. They are shown only once — store securely, never commit to version control.

### Execution Modes

TinyFish offers three execution modes:

| Mode | Endpoint | When to Use |
|------|----------|------------|
| **SSE Streaming** | `POST /v1/automation/run-sse` | Interactive UIs, agent feedback loops, observability |
| **Synchronous** | `POST /v1/automation/run` | Simple scripts, when you need one result |
| **Async (queue)** | `POST /v1/automation/run-async` | Batch processing, long-running tasks |
| **Bulk Async** | `POST /v1/automation/run-async-bulk` | Up to 100 runs in one request |

---

## 4. Core API: SSE Streaming Endpoint

```
POST /v1/automation/run-sse
Content-Type: application/json
X-API-Key: YOUR_KEY
```

### Request Schema

```json
{
  "url": "https://example.com",              // Required: target website
  "goal": "Extract all product prices",       // Required: natural language task
  "browser_profile": "lite",                  // Optional: "lite" (default) or "stealth"
  "proxy_config": {
    "enabled": true,
    "country_code": "US"                      // US, GB, CA, DE, FR, JP, AU
  },
  "use_vault": false,                          // Opt-in to credential vault
  "credential_item_ids": ["item_abc123"],      // Scope vault to specific credentials
  "api_integration": "langchain"               // Analytics tracking
}
```

### SSE Event Stream

The response is a `text/event-stream` with these event types:

```
data: {"type":"STARTED","run_id":"run_abc123","timestamp":"2025-01-01T00:00:00Z"}

data: {"type":"STREAMING_URL","run_id":"run_abc123","streaming_url":"https://tf-abc123.fra0-tinyfish.unikraft.app/stream/0","timestamp":"..."}

data: {"type":"PROGRESS","run_id":"run_abc123","purpose":"Visiting the product page","timestamp":"..."}

data: {"type":"PROGRESS","run_id":"run_abc123","purpose":"Scrolling to load all products","timestamp":"..."}

data: {"type":"HEARTBEAT","timestamp":"..."}

data: {"type":"COMPLETE","run_id":"run_abc123","status":"COMPLETED","result":{"products":[...]},"timestamp":"..."}
```

### Event Type Reference

| Event Type | Fields | Meaning |
|-----------|--------|---------|
| `STARTED` | `run_id`, `timestamp` | Automation began |
| `STREAMING_URL` | `run_id`, `streaming_url`, `timestamp` | Live browser view available |
| `PROGRESS` | `run_id`, `purpose`, `timestamp` | Agent took an action |
| `HEARTBEAT` | `timestamp` | Connection keepalive (every ~30s) |
| `COMPLETE` | `run_id`, `status`, `result`, `error`, `timestamp` | Final result |

**COMPLETE status values**: `COMPLETED`, `FAILED`, `CANCELLED`

### Result Format

On success:
```json
{
  "type": "COMPLETE",
  "run_id": "run_abc123",
  "status": "COMPLETED",
  "result": {
    "products": [
      { "name": "Laptop Pro", "price": "$1,299", "inStock": true },
      { "name": "Wireless Mouse", "price": "$29", "inStock": true }
    ]
  },
  "timestamp": "2025-01-01T00:00:15Z"
}
```

On failure:
```json
{
  "type": "COMPLETE",
  "run_id": "run_abc123",
  "status": "FAILED",
  "error": "Navigation timeout after 30 seconds",
  "help_url": "https://docs.tinyfish.ai/error-codes#timeout",
  "help_message": "The page took too long to load. Try using stealth mode.",
  "timestamp": "..."
}
```

---

## 5. SDK Usage

### Python SDK

```python
from tinyfish import TinyFish, EventType, RunStatus, BrowserProfile, ProxyConfig, ProxyCountryCode

client = TinyFish()  # Reads TINYFISH_API_KEY from environment

# Streaming
with client.agent.stream(
    url="https://scrapeme.live/shop",
    goal="Extract the first 2 product names and prices. Return as JSON.",
) as stream:
    for event in stream:
        if event.type == EventType.PROGRESS:
            print(f"  → {event.purpose}")
        elif event.type == EventType.COMPLETE:
            if event.status == RunStatus.COMPLETED:
                print("Result:", event.result_json)
            else:
                print("Failed:", event.error)

# Synchronous (blocking)
run = client.agent.run(
    url="https://example.com",
    goal="Extract pricing information"
)
print(run.result if run.status == RunStatus.COMPLETED else run.error)

# Async / queue
queued = client.agent.queue({
    "url": "https://example.com",
    "goal": "Extract product data"
})
# Poll later
run = client.runs.get(queued.run_id)
```

### TypeScript SDK

```typescript
import { TinyFish, EventType, RunStatus, BrowserProfile, ProxyCountryCode } from "@tiny-fish/sdk";

const client = new TinyFish();  // Reads TINYFISH_API_KEY

// Stream with event handling
const stream = await client.agent.stream({
  url: "https://scrapeme.live/shop",
  goal: "Extract all product names and prices",
  browser_profile: BrowserProfile.LITE,
});

for await (const event of stream) {
  if (event.type === EventType.PROGRESS) {
    console.log(`→ ${event.purpose}`);
  } else if (event.type === EventType.COMPLETE) {
    console.log(event.status === RunStatus.COMPLETED ? event.result : event.error);
  }
}
```

### CLI

```bash
# Install
npm install -g @tinyfish-ai/cli

# Run with pretty output
tinyfish agent run "Extract the first 2 product names and prices" \
  --url https://scrapeme.live/shop --pretty

# Output:
# ▶ Run started
# • Visit the page to extract product information
# • Check for product information on the page
# ✓ Completed
# {"products": [{"name": "Bulbasaur", "price": "$63.00"}, ...]}
```

---

## 6. Browser Profiles

| Profile | Bot Detection Evasion | Speed | Use Case |
|---------|----------------------|-------|---------|
| `lite` | Basic | Fast | Normal sites without bot protection |
| `stealth` | Advanced (fingerprint evasion, behavioral) | Slightly slower | Cloudflare, DataDome, PerimeterX-protected sites |

```python
# Start with lite, fall back to stealth if blocked
result = await client.agent.run(url=url, goal=goal, browser_profile=BrowserProfile.LITE)

if result.status == RunStatus.FAILED and "blocked" in (result.error or ""):
    result = await client.agent.run(
        url=url,
        goal=goal,
        browser_profile=BrowserProfile.STEALTH,
        proxy_config={"enabled": True, "country_code": ProxyCountryCode.US}
    )
```

---

## 7. Batch Processing Pattern

TinyFish supports up to 100 concurrent automations. For bulk operations:

```python
import asyncio
from tinyfish import TinyFish, RunStatus

client = TinyFish(maxRetries=3)

async def process_batch(tasks: list[dict]) -> list[dict]:
    """Submit all tasks at once, poll until complete"""
    
    # Submit all
    queued = await asyncio.gather(*[
        client.agent.queue(task) for task in tasks
    ])
    run_ids = [r.run_id for r in queued if not r.error]
    
    # Poll for completion
    pending = set(run_ids)
    results = {}
    
    while pending:
        # Batch-fetch status
        batch = await client.runs.get_many(list(pending)[:100])
        
        for run in batch:
            if run.status in (RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED):
                results[run.run_id] = run
                pending.discard(run.run_id)
        
        if pending:
            await asyncio.sleep(2)
    
    return list(results.values())

# Process 50 URLs in parallel
tasks = [{"url": url, "goal": "Extract product data"} for url in urls]
results = asyncio.run(process_batch(tasks))
```

---

## 8. AI Agent Integration

### Writing Goals for TinyFish as an AI Tool

When an AI agent calls TinyFish, goal quality determines result quality. TinyFish's AI Integration Guide recommends:

#### Specify Output Schema
```
Extract product data and return as JSON matching this structure:
{
  "product_name": "string",
  "price": number or null,
  "in_stock": boolean
}
```

#### Include Termination Conditions
```
Stop when ANY of these is true:
- You have extracted 20 items
- No more "Load More" button exists
- You have processed 5 pages
- The page shows a login prompt
```

#### Handle Edge Cases
```
If price shows "Contact Us" or "Request Quote":
  Set price to null
  Set price_type to "contact_required"

If a CAPTCHA appears:
  Stop immediately
  Return partial results with an error flag
```

#### Request Structured Errors
```
If extraction fails, return:
{
  "success": false,
  "error_type": "timeout" | "blocked" | "not_found",
  "error_message": "Description of what went wrong",
  "partial_results": [any data captured before failure]
}
```

### Integrating TinyFish as a Tool in Claude

```python
import anthropic
import httpx
import json

def tinyfish_web_agent(url: str, goal: str, stealth: bool = False) -> str:
    """Call TinyFish Web Agent and return result"""
    headers = {"X-API-Key": os.getenv("TINYFISH_API_KEY"), "Content-Type": "application/json"}
    body = {
        "url": url,
        "goal": goal,
        "browser_profile": "stealth" if stealth else "lite",
    }
    
    with httpx.stream("POST", "https://agent.tinyfish.ai/v1/automation/run-sse",
                      headers=headers, json=body, timeout=120) as r:
        for line in r.iter_lines():
            if line.startswith("data: "):
                event = json.loads(line[6:])
                if event["type"] == "COMPLETE":
                    if event["status"] == "COMPLETED":
                        return json.dumps(event.get("result", {}))
                    else:
                        return json.dumps({"error": event.get("error")})
    return json.dumps({"error": "Stream ended unexpectedly"})

# Register as a Claude tool
tools = [
    {
        "name": "web_agent",
        "description": "Execute browser automation on any website. Navigates real browsers, handles JavaScript, can log in and interact with dynamic sites. Use for: extracting live data from any website, filling forms, multi-step web workflows, sites that require JavaScript. Returns structured JSON result.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Target website URL"},
                "goal": {"type": "string", "description": "Natural language task description. Be specific about the data format to return."},
                "stealth": {"type": "boolean", "description": "Use anti-detection browser for bot-protected sites"}
            },
            "required": ["url", "goal"]
        }
    }
]

# Agent loop with TinyFish as a tool
client = anthropic.Anthropic()
messages = [{"role": "user", "content": "Research the top 3 Python AI frameworks and their GitHub star counts"}]

while True:
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        tools=tools,
        messages=messages
    )
    messages.append({"role": "assistant", "content": response.content})
    
    if response.stop_reason != "tool_use":
        break
    
    tool_results = []
    for block in response.content:
        if block.type == "tool_use" and block.name == "web_agent":
            result = tinyfish_web_agent(block.input["url"], block.input["goal"])
            tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": result})
    
    messages.append({"role": "user", "content": tool_results})
```

### MCP Integration

TinyFish exposes a Claude-compatible MCP interface:

```json
{
  "server": {
    "name": "TinyFish Web Agent",
    "version": "1.0.0",
    "transport": "http"
  },
  "capabilities": {
    "tools": {
      "search_tiny_fish_web_agent": {
        "name": "search_tiny_fish_web_agent",
        "description": "Search the TinyFish documentation and knowledge base"
      }
    }
  }
}
```

This allows Claude Code, Cursor, and other MCP-compatible clients to discover and use TinyFish capabilities automatically.

---

## 9. Comparison: TinyFish vs. Other Search/Web APIs

| Dimension | TinyFish | Brave Search | Serper | Tavily | Playwright (DIY) |
|-----------|----------|-------------|--------|--------|-----------------|
| **Fresh live data** | ✅ | ❌ Indexed | ❌ Indexed | ❌ Indexed | ✅ |
| **JavaScript execution** | ✅ Full | ❌ | ❌ | ❌ | ✅ |
| **Authenticated sites** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Bot protection bypass** | ✅ Stealth mode | N/A | N/A | N/A | ❌ (DIY) |
| **Natural language goals** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **No selector knowledge** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **SSE streaming** | ✅ | ❌ | ❌ | ❌ | DIY |
| **Parallel scale** | ✅ 100s | ✅ | ✅ | ✅ | ❌ (expensive) |
| **Proxy included** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cost model** | Usage-based | Per search | Per search | Per search | Infra + ops |
| **Best for** | Live web actions | Fast retrieval | SERP data | Research agents | Full control |

### When to Use TinyFish

✅ **Use TinyFish when**:
- You need live data from a JavaScript-rendered site (SPA, infinite scroll, lazy loading)
- You need to authenticate and access content behind a login
- The site has bot protection (Cloudflare, DataDome)
- You need multi-step workflows (navigate → click → fill form → extract)
- You're running at scale and can't manage browser infrastructure
- You want an agent to be able to "browse the web" naturally

❌ **Use search APIs (Brave/Serper/Tavily) when**:
- You need fast keyword search results (indexed web)
- You're researching topics that don't need the absolute latest data
- Latency is critical and 5-second browser automation is too slow
- Cost-per-query matters more than freshness

---

## 10. Use Cases for Coding Agents

TinyFish is particularly powerful for coding agents that need to:

### 1. Research Competitor APIs and Documentation

```python
goal = """
Visit the OpenAI API documentation page.
Extract all API endpoints listed in the navigation sidebar.
For each endpoint, extract the endpoint path and a one-line description.
Return as a JSON array.
"""
result = client.agent.run(url="https://platform.openai.com/docs/api-reference", goal=goal)
```

### 2. Check GitHub Issues / PR Status

```python
goal = """
Go to the GitHub issues page for the repository.
Find all open issues labeled 'bug' created in the last 7 days.
For each issue, extract: title, issue number, creation date, and number of comments.
Return as JSON array.
"""
result = client.agent.run(url="https://github.com/org/repo/issues?q=is%3Aopen+label%3Abug", goal=goal)
```

### 3. Monitor Dependency Security Advisories

```python
goal = """
Search for security advisories affecting Python packages on PyPI.
Find advisories published in the last 30 days.
Return: package name, advisory ID, severity, affected versions.
"""
result = client.agent.run(url="https://pypi.org/security", goal=goal)
```

### 4. Extract Code Examples from Docs

```python
goal = """
Navigate to the Quick Start section of the documentation.
Extract all code examples (they appear in gray code blocks).
Return: language, description (paragraph before the code block), code content.
Return as JSON array.
"""
result = client.agent.run(url="https://docs.someframework.io/quickstart", goal=goal)
```

### 5. CI/CD Status Monitoring

```python
goal = """
Go to the Actions tab of this repository.
Find the last 5 workflow runs for the 'CI' workflow.
For each: extract run number, status (success/failure/running), triggered by (push/PR/manual), duration.
"""
result = client.agent.run(url="https://github.com/org/repo/actions", goal=goal)
```

---

## 11. Error Handling and Retry Strategy

```python
from tinyfish import TinyFish, RunStatus, BrowserProfile, RateLimitError
import asyncio

client = TinyFish(maxRetries=3)  # SDK auto-retries 429/5xx with exponential backoff

async def robust_extraction(url: str, goal: str) -> dict:
    """Production-grade extraction with fallback strategy"""
    
    # Attempt 1: Fast lite mode
    try:
        result = await client.agent.arun(url=url, goal=goal, browser_profile=BrowserProfile.LITE)
        if result.status == RunStatus.COMPLETED:
            return {"success": True, "data": result.result}
    except RateLimitError:
        await asyncio.sleep(5)
    
    # Attempt 2: Stealth mode
    result = await client.agent.arun(
        url=url,
        goal=f"{goal}\n\nIf you encounter a CAPTCHA or are blocked, return success=false with error_type=blocked",
        browser_profile=BrowserProfile.STEALTH,
        proxy_config={"enabled": True, "country_code": "US"}
    )
    
    if result.status == RunStatus.COMPLETED:
        return {"success": True, "data": result.result}
    
    return {
        "success": False,
        "error": result.error,
        "url": url
    }
```

---

## 12. Pricing Model

TinyFish pricing (as of 2025):
- **Included in every plan**: All LLM costs, remote browser time, residential proxy bandwidth, anti-bot infrastructure
- **Usage-based**: Operations/steps consumed
- **Free tier**: 500 free steps, no credit card required
- **Volume discounts**: Cost per operation decreases as operations become "codified" (presumably as patterns are optimized)

This is notable — unlike many competitors where you pay separately for the LLM, the browser, and the proxy, TinyFish bundles everything.

---

## Sources

- TinyFish Website — https://www.tinyfish.ai/
- TinyFish Docs — https://docs.tinyfish.ai
- TinyFish Quick Start — https://docs.tinyfish.ai/quick-start
- TinyFish SSE API Reference — https://docs.tinyfish.ai/api-reference/automation/run-browser-automation-with-sse-streaming
- TinyFish AI Integration Guide — https://docs.tinyfish.ai/ai-integration.md
- TinyFish Common Patterns — https://docs.tinyfish.ai/common-patterns.md
- TinyFish Web Scraping Examples — https://docs.tinyfish.ai/examples/scraping
- TinyFish llms.txt (full API index) — https://docs.tinyfish.ai/llms.txt
