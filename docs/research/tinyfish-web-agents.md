# TinyFish: Browser Automation API for Agentic Web Research

> Research compiled: March 2026  
> Topics: TinyFish / AgentQL, SSE API, agent goals, structured extraction, research agent use cases, comparison with Playwright/Puppeteer/Stagehand

---

## Overview

TinyFish is an enterprise infrastructure platform for AI web agents. It provides a fully managed, serverless browser automation service accessible via a simple REST API. Rather than requiring developers to manage browser instances, handle bot detection, route through proxies, and manage AI inference costs separately, TinyFish bundles all of this into a single per-task pricing model.

TinyFish operates two distinct but related products:
1. **TinyFish Web Agent** — a high-level goal-based API (`run-sse`) where you describe *what* you want done and the agent figures out *how*
2. **AgentQL** — a lower-level query language and SDK for precise, semantic web scraping and automation built on top of Playwright

Both are developed by the same company (tinyfish-io on GitHub) and share the same infrastructure. AgentQL is open-source; the TinyFish Web Agent platform is a commercial managed service built on top of it.

---

## Company & Product Background

- **GitHub organization**: `tinyfish-io`
- **Main repositories**: `agentql` (open-source), `tinyfish-cookbook` (examples), `agentql-mcp` (MCP server), `agentql-integrations`
- **Target market**: Enterprise teams needing scalable, reliable web data operations for AI pipelines
- **Key differentiator**: All-inclusive pricing (no separate browser, proxy, AI inference bills)
- **Scale**: Up to 1,000 simultaneous web operations across hundreds of sites

From the company's positioning:
> "TinyFish is an agentic web infrastructure platform built for enterprise-scale web data operations. Unlike traditional automation tools or search platforms, TinyFish delivers live data extraction from dynamic sites — including those behind logins, forms, and paywalls."

---

## The TinyFish Web Agent API

### Core Endpoint: `POST /v1/automation/run-sse`

The primary API is a single SSE (Server-Sent Events) streaming endpoint:

```bash
curl --request POST \
  --url https://agent.tinyfish.ai/v1/automation/run-sse \
  --header 'Content-Type: application/json' \
  --header 'X-API-Key: TINYFISH_API_KEY' \
  --data '{
    "url": "https://amazon.com",
    "goal": "Find me the price of airpods pro 3",
    "proxy_config": {
      "enabled": false
    }
  }'
```

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | Starting URL for the agent |
| `goal` | string | Natural language task description |
| `browser_profile` | string | `"lite"` (fast) or `"full"` (more capable) |
| `proxy_config` | object | Proxy settings including country code |
| `api_integration` | string | Integration target: `"dify"`, `"langchain"`, etc. |
| `feature_flags` | object | Feature toggles like `enable_agent_memory` |

### SSE Response Stream

The API streams progress events in real-time:

```
data: {"type":"STARTED","runId":"run_123","timestamp":"2025-01-01T00:00:00Z"}

data: {"type":"STREAMING_URL","runId":"run_123","streamingUrl":"https://...","timestamp":"..."}

data: {"type":"PROGRESS","runId":"run_123","purpose":"Navigating to product page","timestamp":"..."}

data: {"type":"PROGRESS","runId":"run_123","purpose":"Clicking submit button","timestamp":"..."}

data: {"type":"COMPLETE","runId":"run_123","status":"COMPLETED","resultJson":{...},"timestamp":"..."}
```

**Event types:**
- `STARTED` — Agent initialized
- `STREAMING_URL` — Live browser view URL (can watch the agent work in real-time)
- `PROGRESS` — Step-by-step progress updates with human-readable descriptions
- `COMPLETE` — Task finished with structured result JSON
- `ERROR` — Task failed with error details

### Why SSE (Not WebSocket, Not Polling)?

SSE is a good choice for this use case because:
- **One-directional**: Client only needs to receive updates, not send them
- **HTTP/1.1 compatible**: Works through proxies, firewalls, load balancers
- **Simple**: Standard `EventSource` API in browsers, easy in any HTTP client
- **Resumable**: Can reconnect and resume from last event ID
- **No polling overhead**: Pushed events vs. repeated GET requests

---

## AgentQL: The Query Language

AgentQL is TinyFish's open-source library for semantic web element selection. It solves one of the core brittle points in traditional web automation: **selectors break when websites change**.

### Traditional Selector Problems

```python
# CSS selector — brittle
page.click("#buybox-see-all-buying-choices-announce")  # breaks if ID changes

# XPath — brittle  
page.click("//div[@class='a-section a-spacing-none']//input")  # breaks on redesign
```

### AgentQL Semantic Selectors

```python
import agentql
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = agentql.wrap(browser.new_page())
    page.goto("https://amazon.com/product/B09JQMJHXY")
    
    # Natural language query — resilient to UI changes
    response = page.query_elements("""
    {
        add_to_cart_button
        product_price
        product_rating
        review_count
    }
    """)
    
    price = response.product_price.inner_text()
    response.add_to_cart_button.click()
```

**How it works:**
1. AgentQL sends the DOM to its AI service
2. AI maps query keys to actual page elements using semantic understanding
3. Returns Playwright element handles for matched elements
4. Elements can be clicked, read, filled like normal Playwright elements

### Self-Healing Selectors

The key capability: AgentQL selectors **don't break when the website redesigns**, because they're based on *meaning*, not *structure*:
- `add_to_cart_button` works whether the button says "Add to Cart", "Buy Now", or "Purchase"
- `product_price` works regardless of what CSS class wraps the price
- Selectors work across *similar* websites (e.g., multiple e-commerce sites)

### Data Extraction Mode

Beyond element selection, AgentQL can extract structured data:

```python
# Extract structured data from any page
data = page.query_data("""
{
    product {
        name
        price
        description
        specifications[] {
            key
            value
        }
        reviews[] {
            author
            rating
            content
        }
    }
}
""")
# Returns a Python dict matching the query structure
```

This is similar to GraphQL for the web — define the schema you want, get back structured data.

### Natural Language Mode

For even simpler use cases, pure natural language:

```python
# Natural language data extraction
data = page.query_data(
    "Extract all pricing plans with their names, prices, and included features"
)
```

---

## AgentQL MCP Server

TinyFish provides a Model Context Protocol (MCP) server so AI assistants can use AgentQL directly as a tool:

```json
// Claude Desktop config
{
  "mcpServers": {
    "agentql": {
      "command": "npx",
      "args": ["agentql-mcp"],
      "env": {
        "AGENTQL_API_KEY": "your-key-here"
      }
    }
  }
}
```

Once configured, Claude can:
- Navigate to any URL
- Extract structured data using natural language
- Click buttons, fill forms
- Take screenshots of pages

This is how TinyFish integrates with Claude Code, Cursor, and other MCP-compatible agents — effectively giving any LLM a fully managed browser as a tool.

---

## Integrations Ecosystem

TinyFish/AgentQL integrates with the major AI and automation platforms:

### LangChain Integration

```python
from agentql.ext.langchain import AgentQLLoader

loader = AgentQLLoader(
    url="https://example.com/products",
    query="""
    {
        products[] {
            name
            price
            availability
        }
    }
    """
)

documents = loader.load()
# Returns LangChain Document objects ready for RAG pipeline
```

### n8n Integration

TinyFish offers a dedicated n8n node, enabling visual workflow automation:
- Drag TinyFish node into n8n canvas
- Set URL + goal (natural language)
- Connect to downstream nodes for data processing
- No code required for common scraping workflows

### Dify Integration

```json
// TinyFish as a Dify tool
{
  "url": "{{input_url}}",
  "goal": "Extract the main article content and author information",
  "api_integration": "dify",
  "feature_flags": {
    "enable_agent_memory": true
  }
}
```

### Zapier Integration

Available through AgentQL's Zapier connector for no-code workflows:
- Trigger: new item in a list → run AgentQL extraction
- Action: AgentQL result → Google Sheets, Slack, database

### Direct REST API

For custom integrations, the REST API works with any HTTP client:

```python
import requests

def extract_web_data(url: str, query: str) -> dict:
    response = requests.post(
        "https://api.agentql.com/v1/query-data",
        headers={"X-API-Key": AGENTQL_API_KEY},
        json={"url": url, "query": query}
    )
    return response.json()["data"]
```

---

## Use Cases for Research Agents

TinyFish/AgentQL is particularly well-suited for **agentic research workflows** where an agent needs to gather real-time information from the web:

### 1. Competitive Intelligence

```python
goal = """
Navigate to competitor pricing pages and extract:
- All plan names and prices
- Feature comparison for each plan
- Any current promotions or discounts
"""
```

Agent actions:
1. Navigate to competitor's website
2. Find the pricing page (autonomous navigation)
3. Extract structured pricing data
4. Handle authentication if behind a login
5. Return structured JSON

### 2. Research Data Collection

For AI research assistants that need real-time web data:

```python
# In a LangChain research agent
tools = [
    AgentQLTool(
        name="web_extract",
        description="Extract structured data from any web page",
    ),
    # + other research tools
]

agent = initialize_agent(
    tools=tools,
    llm=ChatAnthropic(model="claude-opus-4-5"),
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
)

result = agent.run(
    "Research the top 5 AI coding assistants, extract their pricing and key features"
)
```

### 3. Form Automation for Agents

Coding agents sometimes need to interact with web UIs (GitHub, Jira, Linear):

```python
goal = """
Go to the GitHub repository at https://github.com/org/repo/issues
Create a new issue with:
- Title: "Fix: NullPointerException in auth handler"
- Body: [detailed description]
- Labels: bug, priority:high
"""
```

### 4. Behind-Login Extraction

TinyFish handles authentication flows that traditional scrapers can't:
- OAuth flows (Google, GitHub login)
- Multi-step login with 2FA
- Cookie-based sessions with persistence
- CAPTCHA handling (via browser fingerprinting + proxy rotation)

### 5. Real-Time Price/Stock Monitoring

```python
# Polling product pages for changes
for product_url in product_urls:
    result = tinyfish.run(
        url=product_url,
        goal="Extract current price and availability status"
    )
    check_for_changes(result)
```

---

## Technical Architecture

### Serverless Browser Fleet

TinyFish runs a managed fleet of cloud browsers:
- Each request spins up (or reuses) a browser instance
- Browsers run in isolated sandboxes (one per task)
- Automatic cleanup after task completion
- Geographic distribution for proxy routing

### Anti-Bot Infrastructure

One of TinyFish's core value-adds is bypassing bot detection:

**Browser fingerprinting:**
- Realistic browser fingerprints (screen resolution, fonts, WebGL)
- Consistent fingerprint within a session
- Randomized across sessions to avoid pattern detection

**Proxy rotation:**
- Residential proxies (real IP addresses, not datacenter IPs)
- Country-specific routing for geo-restricted content
- Automatic rotation on detection

**Stealth mode:**
- Removes automation indicators from the browser (`navigator.webdriver = false`)
- Mimics real user behavior patterns (mouse movements, scroll behavior)
- Realistic timing between actions

### Concurrent Execution

A key differentiator vs self-hosted solutions:

> "Run up to 1,000 simultaneous web operations across hundreds of sites, completing tasks in minutes that would otherwise take days manually or hours with traditional automation."

This enables **agent swarm** patterns where a research agent spawns hundreds of parallel web extraction tasks:

```python
import asyncio
from tinyfish import TinyFishClient

async def research_competitors(competitor_list: list[str]):
    client = TinyFishClient(api_key=TINYFISH_API_KEY)
    
    tasks = [
        client.run_async(url=url, goal="Extract pricing and features")
        for url in competitor_list
    ]
    
    results = await asyncio.gather(*tasks)  # All run in parallel
    return results

# Research 50 competitors simultaneously
results = asyncio.run(research_competitors(competitor_urls))
```

---

## Pricing Model

TinyFish uses **all-inclusive per-step pricing**:

- One price covers: browsers, proxies, AI inference, infrastructure
- No separate bills for each component
- Starter plan: ~16,500 steps/month, 50 concurrent agents
- Residential proxy bandwidth included at $0/GB
- LLM inference costs included
- 180-day run history with observability and screenshots

This pricing model is specifically designed for agent teams that would otherwise have:
- Browser cloud bill (BrowserStack, Bright Data, etc.)
- Proxy provider bill
- AI API bill
- Infrastructure/DevOps costs

---

## Comparison with Alternatives

### TinyFish vs Playwright (Self-Hosted)

| Aspect | TinyFish | Playwright (self-hosted) |
|--------|---------|--------------------------|
| Setup time | Minutes (API key) | Hours (install, config, infra) |
| Selector robustness | High (AI-powered, self-healing) | Low (CSS/XPath breaks on redesigns) |
| Anti-bot bypass | Built-in | Manual (complex, unreliable) |
| Concurrency | 1,000+ out of box | Limited by your servers |
| Proxy management | Included | Separate provider needed |
| Cost model | Per task (predictable) | Infrastructure + time cost |
| Customization | Limited | Full control |
| Debugging | SSE stream + screenshots | Local dev tools |

### TinyFish vs Puppeteer

Puppeteer is even lower-level than Playwright — similar comparison applies, with TinyFish winning on operational simplicity but losing on control and customization.

### TinyFish vs Stagehand (Browserbase)

**Stagehand** (from Browserbase) is the closest competitor in the AI-native browser automation space:

| Aspect | TinyFish / AgentQL | Stagehand (Browserbase) |
|--------|-------------------|------------------------|
| Query model | AgentQL query language + NL | Playwright-based, AI for `act()` |
| Infrastructure | Fully managed, all-inclusive | Managed browsers, separate AI costs |
| Open source | AgentQL open-source | Stagehand open-source |
| Integration | MCP, n8n, Dify, LangChain | Playwright-compatible |
| Focus | Data extraction + agentic web ops | Browser automation + LLM actions |

### TinyFish vs Firecrawl

**Firecrawl** focuses on web scraping and content extraction for RAG pipelines:

| Aspect | TinyFish | Firecrawl |
|--------|---------|-----------|
| Use case | Interactive agent web ops | Static content extraction for RAG |
| JavaScript rendering | Full browser execution | Headless rendering |
| Login support | Yes (full auth flows) | Limited |
| Interactive actions | Yes (click, type, navigate) | No |
| Price extraction | Yes | No |
| Scale | 1,000 concurrent | High, API-based |

**When to use TinyFish vs Firecrawl:**
- Firecrawl: Need to scrape article text, docs, blog posts for RAG indexing
- TinyFish: Need to interact with dynamic sites, log in, click buttons, fill forms

### TinyFish vs Selenium Grid

Legacy Selenium Grid setups require:
- Self-hosted infrastructure
- Browser binary management
- Network configuration
- No built-in AI/NL capabilities
- Manual proxy setup

TinyFish replaces all of this with a single API call. The tradeoff is vendor lock-in and less flexibility.

---

## For Research Agents: Recommended Patterns

### Pattern 1: Parallel Research with Summarization

```python
async def research_topic(topic: str, sources: list[str]) -> str:
    """
    Parallel web research agent pattern using TinyFish.
    Gather from multiple sources simultaneously, then synthesize.
    """
    # Parallel extraction from all sources
    tasks = [
        tinyfish.run_async(
            url=url,
            goal=f"Extract key information about: {topic}"
        )
        for url in sources
    ]
    raw_results = await asyncio.gather(*tasks)
    
    # Synthesize with LLM
    combined = "\n\n".join([r["resultJson"]["content"] for r in raw_results])
    synthesis = llm.complete(f"Synthesize this research about {topic}:\n{combined}")
    
    return synthesis
```

### Pattern 2: Agent Memory + Web Research

The `enable_agent_memory` feature flag enables TinyFish to remember context within a multi-step web session:

```python
# Multi-step research with memory
result = tinyfish.run(
    url="https://techcrunch.com",
    goal="""
    1. Find the 3 most recent articles about AI coding agents
    2. For each article, navigate to it and extract the main findings
    3. Return a structured summary of all 3 articles
    """,
    feature_flags={"enable_agent_memory": True}
)
# Agent remembers where it's been across the multi-page session
```

### Pattern 3: MCP Tool for Conversational Research

With the AgentQL MCP server configured, any MCP-compatible AI assistant can do live web research:

```
User: What's the current pricing for GitHub Copilot Enterprise?
Claude: [uses agentql MCP tool]
  → Navigates to github.com/features/copilot/plans
  → Extracts pricing table
  → Returns structured pricing data
Claude: "GitHub Copilot Enterprise is currently priced at $39/user/month..."
```

---

## Limitations and Considerations

### What TinyFish Cannot Do

1. **Real-time streams**: Can't subscribe to live stock tickers, websocket feeds
2. **Native app automation**: Web-only; no iOS/Android apps
3. **Offline/local content**: Must be accessible via URL
4. **Complete anti-detection**: Some sophisticated sites still detect automation
5. **Custom browser extensions**: Managed browsers don't support arbitrary extensions

### Reliability Considerations

- Sites can change structure → goal-based API more resilient than query-based
- Rate limiting from target sites still applies
- Anti-bot measures evolve → may periodically fail on some sites
- SSE stream can disconnect → need reconnection logic for long tasks

### Privacy and Data Handling

- Browsing activity passes through TinyFish infrastructure
- Consider data sensitivity before routing through any third party
- Credentials passed as part of goals/context are handled by TinyFish servers
- Review their data retention and privacy policies for enterprise use

---

## Getting Started

### Quick Start (5 minutes)

```bash
# Install AgentQL Python SDK
pip install agentql

# Set API key
export AGENTQL_API_KEY=your-key-here

# Install Playwright browsers
playwright install chromium
```

```python
import agentql
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = agentql.wrap(browser.new_page())
    page.goto("https://hacker news.ycombinator.com")
    
    # Extract top stories
    data = page.query_data("""
    {
        stories[] {
            title
            url
            points
            comments_count
        }
    }
    """)
    
    print(data)
```

### TinyFish Web Agent (Managed)

```python
import requests

response = requests.post(
    "https://agent.tinyfish.ai/v1/automation/run-sse",
    headers={"X-API-Key": TINYFISH_API_KEY},
    json={
        "url": "https://news.ycombinator.com",
        "goal": "Get the top 10 stories with titles, URLs, and point counts",
        "proxy_config": {"enabled": False}
    },
    stream=True
)

for line in response.iter_lines():
    if line.startswith(b"data: "):
        event = json.loads(line[6:])
        if event["type"] == "COMPLETE":
            print(event["resultJson"])
            break
        elif event["type"] == "PROGRESS":
            print(f"Agent: {event['purpose']}")
```

---

## Sources

- TinyFish main site: https://www.tinyfish.ai/
- TinyFish pricing: https://www.tinyfish.ai/pricing
- TinyFish docs (SSE API): https://docs.tinyfish.ai/api-reference/automation/run-browser-automation-with-sse-streaming
- TinyFish n8n integration: https://docs.tinyfish.ai/integrations/n8n
- AgentQL GitHub: https://github.com/tinyfish-io/agentql
- AgentQL integrations: https://github.com/tinyfish-io/agentql-integrations
- AgentQL MCP server: https://github.com/tinyfish-io/agentql-mcp
- TinyFish cookbook: https://github.com/tinyfish-io/tinyfish-cookbook
- AgentQL MCP docs: https://docs.agentql.com/integrations/mcp
- MOGE product overview: https://moge.ai/product/tinyfish
- Futurepedia pricing: https://www.futurepedia.io/tool/tinyfish
- Playbooks.com skill: https://playbooks.com/skills/tinyfish-io/skills/tinyfish-web-agent
- Firecrawl browser agents comparison: https://www.firecrawl.dev/blog/best-browser-agents
