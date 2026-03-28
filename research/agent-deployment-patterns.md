# Deployment Patterns for Production AI Agents

> **Research Date:** March 2026  
> **Focus:** Serverless vs persistent agents, API gateway patterns, rate limiting, multi-tenant architecture, Docker/Kubernetes for agents

---

## Overview

Deploying AI agents to production is fundamentally different from deploying traditional stateless APIs. Agents have unique characteristics that challenge conventional infrastructure:

- **Long-running requests**: Multi-step agents can take 30s–5min per task (Lambda's 15-min limit, Cloud Run's 60-min limit matter)
- **State management**: Conversation history, tool results, and intermediate outputs need persistence
- **Variable compute**: Simple classification vs complex reasoning have wildly different resource needs
- **LLM API dependencies**: Failures in upstream providers need graceful handling
- **Cost at scale**: Token costs make per-request economics critical

This guide covers the major deployment patterns with trade-offs, architecture diagrams, and production-ready code.

---

## Architecture Decision Framework

```
Agent Deployment Decision Tree:

Is the agent stateless?
    ├── YES → Serverless (Lambda / Cloud Run / Fargate)
    │          ├── Short tasks (<30s) → Lambda
    │          └── Longer tasks (30s–60min) → Cloud Run / Fargate
    │
    └── NO (needs memory/state)
               ├── Low concurrency → Single container with Redis
               ├── High concurrency → Kubernetes with state store
               └── Long-lived / ambient → Temporal + K8s

Is the agent multi-tenant (serving multiple customers)?
    ├── YES → API Gateway + per-tenant isolation + rate limiting
    └── NO → Direct deployment, simpler auth

Is the agent conversational (session-based)?
    ├── YES → Session store (Redis/DynamoDB) + sticky sessions
    └── NO → Pure stateless, easiest deployment
```

---

## Part 1: Serverless Agent Deployment

### When to Use Serverless

✅ **Best for:**
- Stateless agents (each request is independent)
- Bursty, unpredictable traffic patterns
- Pay-per-use cost model preferred
- Simple tool execution (no heavy compute)
- Tasks completing within timeout limits

❌ **Avoid for:**
- Long reasoning chains (>15 min for Lambda)
- Agents requiring persistent local state
- High-frequency streaming (WebSocket preferred)
- Cold start latency is unacceptable (<100ms required)

### AWS Lambda Agent

```python
# lambda_handler.py
import json
import os
import anthropic
from typing import Any

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# Tool definitions (loaded once at cold start)
TOOLS = [
    {
        "name": "query_database",
        "description": "Query the business database",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "SQL query to execute"},
            },
            "required": ["query"]
        }
    }
]

def execute_tool(tool_name: str, tool_input: dict) -> str:
    """Execute a tool and return result as string."""
    if tool_name == "query_database":
        # In production: use RDS Proxy or connection pooling
        import boto3
        rds = boto3.client('rds-data')
        result = rds.execute_statement(
            resourceArn=os.environ["DB_ARN"],
            secretArn=os.environ["DB_SECRET_ARN"],
            database="business",
            sql=tool_input["query"]
        )
        return json.dumps(result["records"])
    return f"Unknown tool: {tool_name}"

def run_agent(user_message: str, session_id: str) -> str:
    """Run the agent loop."""
    # Load session history from DynamoDB
    history = load_session(session_id)
    history.append({"role": "user", "content": user_message})
    
    max_iterations = 5
    for _ in range(max_iterations):
        response = client.messages.create(
            model="claude-haiku-3-5",  # Fast + cheap for Lambda
            max_tokens=2048,
            system="You are a data analyst assistant.",
            tools=TOOLS,
            messages=history
        )
        
        history.append({"role": "assistant", "content": response.content})
        
        if response.stop_reason == "end_turn":
            # Extract final text
            text = next((b.text for b in response.content if hasattr(b, 'text')), "")
            save_session(session_id, history)
            return text
        
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })
            history.append({"role": "user", "content": tool_results})
    
    return "Maximum iterations reached"

def load_session(session_id: str) -> list:
    """Load conversation history from DynamoDB."""
    import boto3
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ["SESSIONS_TABLE"])
    
    response = table.get_item(Key={"session_id": session_id})
    if "Item" in response:
        return response["Item"].get("history", [])
    return []

def save_session(session_id: str, history: list):
    """Persist conversation history to DynamoDB."""
    import boto3
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ["SESSIONS_TABLE"])
    table.put_item(Item={
        "session_id": session_id,
        "history": history,
        "ttl": int(__import__("time").time()) + 86400  # 24h TTL
    })

def lambda_handler(event: dict, context: Any) -> dict:
    """AWS Lambda entry point."""
    body = json.loads(event.get("body", "{}"))
    
    user_message = body.get("message", "")
    session_id = body.get("session_id", "default")
    
    if not user_message:
        return {"statusCode": 400, "body": json.dumps({"error": "message required"})}
    
    try:
        result = run_agent(user_message, session_id)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"response": result, "session_id": session_id})
        }
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
```

```yaml
# serverless.yml (Serverless Framework)
service: ai-agent-service

provider:
  name: aws
  runtime: python3.12
  timeout: 900  # 15 minutes max for complex agents
  memorySize: 1024  # LLM processing needs memory
  environment:
    ANTHROPIC_API_KEY: ${ssm:/agents/anthropic-key}
    SESSIONS_TABLE: ${self:service}-sessions-${opt:stage}
    DB_ARN: ${ssm:/agents/db-arn}
    DB_SECRET_ARN: ${ssm:/agents/db-secret-arn}
  iamRoleStatements:
    - Effect: Allow
      Action: [dynamodb:GetItem, dynamodb:PutItem]
      Resource: !GetAtt SessionsTable.Arn

functions:
  agent:
    handler: lambda_handler.lambda_handler
    events:
      - http:
          path: /agent
          method: post
          cors: true

resources:
  Resources:
    SessionsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:service}-sessions-${opt:stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: session_id
            AttributeType: S
        KeySchema:
          - AttributeName: session_id
            KeyType: HASH
        TimeToLiveSpecification:
          AttributeName: ttl
          Enabled: true
```

### Google Cloud Run Agent

Cloud Run is better suited for agents than Lambda — no 15-min limit, better streaming support, faster cold starts:

```python
# app.py (FastAPI on Cloud Run)
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import asyncio
import json

app = FastAPI()
client = anthropic.AsyncAnthropic()

class AgentRequest(BaseModel):
    message: str
    session_id: str = "default"
    stream: bool = False

@app.post("/agent")
async def run_agent(request: AgentRequest):
    if request.stream:
        return StreamingResponse(
            stream_agent(request.message, request.session_id),
            media_type="text/event-stream"
        )
    
    result = await execute_agent(request.message, request.session_id)
    return {"response": result, "session_id": request.session_id}

async def stream_agent(message: str, session_id: str):
    """Stream agent responses via SSE."""
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": message}]
    ) as stream:
        async for text in stream.text_stream:
            yield f"data: {json.dumps({'delta': text})}\n\n"
    yield "data: [DONE]\n\n"
```

```dockerfile
# Dockerfile optimized for AI agents
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run uses PORT env var
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
```

```yaml
# cloud-run deployment
gcloud run deploy ai-agent \
  --image gcr.io/PROJECT/ai-agent:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \         # 60-minute timeout
  --concurrency 80 \       # Requests per instance
  --min-instances 1 \      # Keep warm
  --max-instances 100 \
  --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest
```

---

## Part 2: Persistent Agent Deployment (Kubernetes)

### When to Use Kubernetes

✅ **Best for:**
- Stateful agents needing GPU access
- Long-running ambient agents
- Fine-grained resource control
- Custom autoscaling based on queue depth
- On-premise or hybrid cloud requirements
- Agents managing their own infrastructure

### Production K8s Agent Architecture

```yaml
# agent-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent
  labels:
    app: ai-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-agent
  template:
    metadata:
      labels:
        app: ai-agent
    spec:
      containers:
      - name: agent
        image: your-registry/ai-agent:latest
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: anthropic-api-key
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-agent-service
spec:
  selector:
    app: ai-agent
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-agent
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: External
    external:
      metric:
        name: queue_depth  # Scale on pending agent tasks
      target:
        type: AverageValue
        averageValue: "10"
```

### KEDA for Queue-Based Autoscaling

```yaml
# Scale agent pods based on message queue depth
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: ai-agent-scaler
spec:
  scaleTargetRef:
    name: ai-agent
  minReplicaCount: 1
  maxReplicaCount: 50
  triggers:
  - type: rabbitmq
    metadata:
      queueName: agent-tasks
      mode: QueueLength
      value: "5"  # 1 pod per 5 queued tasks
```

### Real-World Lessons: 11 Agents on K8s

From a production case study deploying 11 specialized AI agents on Kubernetes (AWS):

```yaml
# Multi-agent K8s setup
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-registry
data:
  registry.json: |
    {
      "agents": [
        {"name": "research-agent", "model": "claude-haiku-3-5", "replicas": 3},
        {"name": "analysis-agent", "model": "claude-sonnet-4-6", "replicas": 2},
        {"name": "writer-agent", "model": "gpt-4o-mini", "replicas": 2},
        {"name": "qa-agent", "model": "claude-haiku-3-5", "replicas": 2},
        {"name": "orchestrator", "model": "gpt-4o", "replicas": 1}
      ]
    }
```

**Key findings from production:**
- Model-specific pods (rather than generic) improved cache hit rates by 40%
- Sidecar containers for Redis connection pooling reduced latency by 25%
- Health checks must account for LLM API latency (set `timeoutSeconds: 30`)
- Use `PodDisruptionBudget` to ensure rolling updates don't drop in-flight requests

---

## Part 3: API Gateway Patterns

### LLM Gateway Architecture

A dedicated LLM Gateway sits between your application and LLM providers, handling auth, routing, caching, and observability:

```
Client App
    │
    ▼
┌─────────────────────────────────────────────┐
│              LLM API Gateway                 │
│                                             │
│  Auth & Tenancy  │  Rate Limiting           │
│  ─────────────   │  ────────────            │
│  JWT validation  │  Token bucket            │
│  Tenant routing  │  Per-tenant quotas       │
│  API key mgmt    │  Cost budget limits      │
│                  │                          │
│  Model Routing   │  Observability           │
│  ─────────────   │  ─────────────           │
│  Primary model   │  Request logging         │
│  Fallback chain  │  Cost tracking           │
│  A/B testing     │  Latency metrics         │
│  Cost routing    │  Error rates             │
└─────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    OpenAI API    Anthropic API   Gemini API
```

### Implementation with LiteLLM Proxy

LiteLLM provides an OpenAI-compatible proxy supporting 100+ LLM providers:

```yaml
# litellm-config.yaml
model_list:
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
      
  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-6
      api_key: os.environ/ANTHROPIC_API_KEY
      
  - model_name: claude-haiku
    litellm_params:
      model: anthropic/claude-haiku-3-5
      api_key: os.environ/ANTHROPIC_API_KEY
  
  # Fallback chain: try primary, fall back to alternatives
  - model_name: production-agent-model
    litellm_params:
      model: openai/gpt-4o
    model_info:
      max_tokens: 4096
    fallbacks:
      - anthropic/claude-sonnet-4-6
      - openai/gpt-4o-mini

router_settings:
  routing_strategy: "cost-based-routing"  # Route to cheapest that fits
  fallbacks: [{"gpt-4o": ["claude-sonnet", "claude-haiku"]}]
  context_window_fallbacks: [{"gpt-4o": ["claude-3-haiku-20240307"]}]

general_settings:
  master_key: sk-litellm-master-key
  database_url: postgresql://user:pass@localhost/litellm
```

```bash
# Start LiteLLM proxy
litellm --config litellm-config.yaml --port 4000

# Now use OpenAI SDK with custom base URL
from openai import OpenAI
client = OpenAI(
    api_key="sk-litellm-master-key",
    base_url="http://localhost:4000"
)

response = client.chat.completions.create(
    model="production-agent-model",  # Routes per config
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Kong AI Gateway Configuration

For enterprise deployments, Kong provides plugin-based AI gateway capabilities:

```yaml
# Kong declarative config for AI gateway
_format_version: "3.0"

services:
  - name: openai-proxy
    url: https://api.openai.com/v1
    plugins:
      - name: ai-proxy
        config:
          provider: openai
          model:
            name: gpt-4o
            options:
              max_tokens: 4096
      
      - name: rate-limiting-advanced
        config:
          limit:
            - 1000        # 1000 req/hour per tenant
            - 100000      # 100k tokens/hour per tenant
          window_size:
            - 3600
          identifier: consumer
          strategy: sliding
          
      - name: response-transformer
        config:
          add:
            headers:
              - "X-Tokens-Used: $(response.usage.total_tokens)"
              - "X-Cost-USD: $(response.usage.total_tokens * 0.000003)"
```

---

## Part 4: Rate Limiting Strategies

### Token-Based Rate Limiting

Unlike traditional APIs (requests/sec), LLM APIs need token-aware rate limiting:

```python
# Token bucket rate limiter for LLM APIs
import time
import redis
from dataclasses import dataclass

@dataclass
class TokenBucket:
    capacity: int        # Max tokens
    refill_rate: int     # Tokens per second
    
class LLMRateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def check_and_consume(
        self,
        tenant_id: str,
        tokens_needed: int,
        limit_config: dict
    ) -> tuple[bool, int]:
        """
        Returns (allowed, wait_seconds).
        Uses Redis for distributed rate limiting.
        """
        key = f"ratelimit:{tenant_id}"
        now = time.time()
        
        with self.redis.pipeline() as pipe:
            pipe.hgetall(key)
            result = pipe.execute()[0]
            
            if result:
                current_tokens = float(result[b"tokens"])
                last_refill = float(result[b"last_refill"])
                
                # Refill based on elapsed time
                elapsed = now - last_refill
                refill = elapsed * limit_config["tokens_per_second"]
                current_tokens = min(
                    limit_config["max_tokens"],
                    current_tokens + refill
                )
            else:
                current_tokens = limit_config["max_tokens"]
                last_refill = now
            
            if current_tokens >= tokens_needed:
                # Consume tokens
                new_tokens = current_tokens - tokens_needed
                self.redis.hset(key, mapping={
                    "tokens": new_tokens,
                    "last_refill": now
                })
                self.redis.expire(key, 3600)
                return True, 0
            else:
                # Calculate wait time
                deficit = tokens_needed - current_tokens
                wait = deficit / limit_config["tokens_per_second"]
                return False, int(wait) + 1

# Example tenant limits
TENANT_LIMITS = {
    "free": {"max_tokens": 10_000, "tokens_per_second": 1_000},
    "pro": {"max_tokens": 100_000, "tokens_per_second": 10_000},
    "enterprise": {"max_tokens": 1_000_000, "tokens_per_second": 100_000}
}

# Usage in API middleware
r = redis.Redis()
limiter = LLMRateLimiter(r)

def api_middleware(tenant_id: str, tier: str, estimated_tokens: int):
    config = TENANT_LIMITS[tier]
    allowed, wait = limiter.check_and_consume(tenant_id, estimated_tokens, config)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            headers={"Retry-After": str(wait)},
            detail=f"Rate limit exceeded. Retry after {wait} seconds."
        )
```

### Multi-Level Rate Limiting

```python
# Hierarchical rate limiting: user → tenant → global
RATE_LIMIT_HIERARCHY = [
    {"level": "user", "window": 60, "max_requests": 10, "max_tokens": 50_000},
    {"level": "tenant", "window": 3600, "max_requests": 1_000, "max_tokens": 5_000_000},
    {"level": "global", "window": 60, "max_requests": 10_000, "max_tokens": 50_000_000}
]

async def check_rate_limits(
    user_id: str,
    tenant_id: str,
    request_tokens: int
) -> None:
    """Check all levels — raises 429 if any limit exceeded."""
    for level_config in RATE_LIMIT_HIERARCHY:
        level = level_config["level"]
        key = user_id if level == "user" else (tenant_id if level == "tenant" else "global")
        
        allowed = await check_level(key, level_config, request_tokens)
        if not allowed:
            raise RateLimitError(
                f"Rate limit exceeded at {level} level",
                retry_after=calculate_retry_after(key, level_config)
            )
```

---

## Part 5: Multi-Tenant Agent Services

### Tenant Isolation Patterns

```python
# Tenant-aware agent service
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import jwt

app = FastAPI()

class TenantContext:
    def __init__(self, tenant_id: str, tier: str, settings: dict):
        self.tenant_id = tenant_id
        self.tier = tier
        self.settings = settings
        
        # Per-tenant model selection
        self.llm_model = settings.get("llm_model", {
            "free": "claude-haiku-3-5",
            "pro": "claude-sonnet-4-6",
            "enterprise": "claude-opus-4"
        }.get(tier, "claude-haiku-3-5"))
        
        # Per-tenant system prompt customization
        self.system_prompt = settings.get(
            "system_prompt",
            "You are a helpful AI assistant."
        )

def get_tenant(authorization: str = Header(...)) -> TenantContext:
    """Extract tenant context from JWT."""
    try:
        payload = jwt.decode(authorization.split(" ")[1], SECRET_KEY, algorithms=["HS256"])
        tenant_id = payload["tenant_id"]
        tier = payload["tier"]
        
        # Load tenant settings from DB/cache
        settings = load_tenant_settings(tenant_id)
        return TenantContext(tenant_id, tier, settings)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/agent/chat")
async def chat(
    request: ChatRequest,
    tenant: TenantContext = Depends(get_tenant)
):
    # Rate limiting
    await check_rate_limits(request.user_id, tenant.tenant_id, request.estimated_tokens)
    
    # Tenant-isolated session storage
    session_key = f"{tenant.tenant_id}:{request.user_id}:{request.session_id}"
    history = await load_session(session_key)
    
    # Run agent with tenant-specific configuration
    response = await run_agent_for_tenant(
        message=request.message,
        tenant=tenant,
        history=history
    )
    
    # Per-tenant cost tracking
    await track_cost(
        tenant_id=tenant.tenant_id,
        model=tenant.llm_model,
        tokens_used=response.usage.total_tokens
    )
    
    await save_session(session_key, history + [response])
    return response
```

### Tenant Data Isolation with Vector Stores

```python
# Per-tenant RAG with namespace isolation
import pinecone

def get_tenant_vector_store(tenant_id: str):
    """Each tenant gets isolated namespace in shared vector DB."""
    pc = pinecone.Pinecone()
    index = pc.Index("agents-knowledge")
    
    # Namespace provides logical isolation without physical separation
    return index.namespace(f"tenant-{tenant_id}")

async def search_tenant_knowledge(tenant_id: str, query: str, top_k: int = 5):
    """Search only this tenant's knowledge base."""
    ns = get_tenant_vector_store(tenant_id)
    query_embedding = await embed(query)
    
    results = ns.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )
    return results.matches
```

---

## Part 6: Observability & Monitoring

### OpenTelemetry for AI Agents

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
import anthropic

# Initialize tracing
provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317"))
)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("ai-agent")

async def traced_agent_call(message: str, session_id: str):
    with tracer.start_as_current_span("agent_run") as span:
        span.set_attribute("session.id", session_id)
        span.set_attribute("input.length", len(message))
        
        try:
            result = await run_agent(message, session_id)
            span.set_attribute("output.length", len(result))
            span.set_attribute("status", "success")
            return result
        except Exception as e:
            span.set_attribute("status", "error")
            span.record_exception(e)
            raise

# Key metrics to track
AGENT_METRICS = {
    "agent_requests_total": Counter("Total agent requests"),
    "agent_latency_seconds": Histogram("Agent response time"),
    "agent_tokens_used": Counter("Total tokens consumed"),
    "agent_cost_usd": Counter("Total cost in USD"),
    "agent_tool_calls_total": Counter("Tool calls made"),
    "agent_errors_total": Counter("Agent errors by type"),
    "cache_hit_rate": Gauge("Prompt cache hit rate"),
}
```

---

## Part 7: Production Checklist

### Infrastructure

- [ ] **Timeouts configured** for LLM API calls (min 60s for complex agents)
- [ ] **Circuit breaker** for LLM provider failures (fallback to alternate model)
- [ ] **Retry with backoff** for 429/503 errors
- [ ] **Session storage** externalized (Redis/DynamoDB, not in-memory)
- [ ] **Secret management** via Vault/AWS SSM (never hardcode API keys)
- [ ] **Health checks** include LLM API reachability test
- [ ] **Graceful shutdown** — drain in-flight requests before termination

### Security

- [ ] **Input sanitization** — prevent prompt injection via user inputs
- [ ] **Output validation** — don't blindly execute LLM-generated code
- [ ] **Tenant isolation** — verify no cross-tenant data leakage
- [ ] **PII detection** — scan inputs/outputs before logging
- [ ] **Audit logging** — record all tool executions for compliance
- [ ] **Rate limiting** at both request and token level

### Cost Control

- [ ] **Per-tenant cost budgets** with automatic cutoffs
- [ ] **Token estimation** before calling LLM (reject oversized requests)
- [ ] **Model routing** — cheaper models for simple tasks
- [ ] **Prompt caching** enabled and monitored for hit rate
- [ ] **Daily cost alerts** via CloudWatch/Datadog

---

## Pros and Cons Summary

### Serverless (Lambda / Cloud Run)
✅ Auto-scaling, no capacity planning  
✅ Pay-per-use, cost-efficient for low/bursty traffic  
✅ Minimal ops overhead  
❌ Cold start latency (100ms–2s)  
❌ Timeout limits (Lambda: 15min, Cloud Run: 60min)  
❌ State management complexity (needs external store)  

### Kubernetes
✅ Full control over resources and scaling  
✅ GPU support for self-hosted models  
✅ No timeout limitations  
✅ Stateful with persistent volumes  
❌ Operational complexity (requires K8s expertise)  
❌ Higher baseline costs (always-on nodes)  
❌ Slower deployment cycles  

### API Gateway (LiteLLM / Kong)
✅ Centralized observability and cost tracking  
✅ Fallback routing across providers  
✅ Rate limiting and security in one layer  
✅ Model routing logic centralized  
❌ Additional infrastructure to manage  
❌ Potential latency overhead (5–20ms)  

---

## Official Resources

- **MLM Mastery: Deploying AI Agents to Production**: https://machinelearningmastery.com/deploying-ai-agents-to-production-architecture-infrastructure-and-implementation-roadmap/
- **Building Multi-Agent Systems on K8s**: https://aws.plainenglish.io/building-production-ready-multi-agent-systems-on-kubernetes-real-lessons-from-deploying-11-b01976cd4236
- **kagent (K8s AI agent framework)**: https://kagent.dev/
- **LiteLLM Proxy**: https://docs.litellm.ai/docs/proxy/quick_start
- **Kong AI Gateway**: https://docs.konghq.com/hub/kong-inc/ai-proxy/
- **TrueFoundry Rate Limiting Guide**: https://www.truefoundry.com/blog/rate-limiting-in-llm-gateway
- **AWS API Gateway Multi-Tenant**: https://aws.amazon.com/blogs/architecture/throttling-a-tiered-multi-tenant-rest-api-at-scale-using-api-gateway-part-1/
- **KEDA Autoscaling**: https://keda.sh/docs/latest/scalers/rabbitmq-queue/
- **OpenTelemetry for LLMs**: https://opentelemetry.io/docs/
