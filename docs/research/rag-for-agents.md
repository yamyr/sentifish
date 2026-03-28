# RAG (Retrieval-Augmented Generation) in Agentic Systems: Comprehensive Research Guide

> **Last Updated:** March 2025  
> **Key Frameworks:** LlamaIndex, LangChain, LangGraph  
> **Focus:** How agents use vector search, agentic RAG patterns, production architectures

---

## Table of Contents

1. [Overview](#overview)
2. [RAG Fundamentals](#rag-fundamentals)
3. [The Evolution: Naive → Advanced → Agentic RAG](#the-evolution-naive--advanced--agentic-rag)
4. [Agentic RAG Architecture Patterns](#agentic-rag-architecture-patterns)
5. [Vector Databases for Agents](#vector-databases-for-agents)
6. [LlamaIndex RAG for Agents](#llamaindex-rag-for-agents)
7. [LangChain RAG for Agents](#langchain-rag-for-agents)
8. [Advanced Retrieval Techniques](#advanced-retrieval-techniques)
9. [Self-RAG and Corrective RAG](#self-rag-and-corrective-rag)
10. [GraphRAG](#graphrag)
11. [Knowledge Bases and Agent Memory](#knowledge-bases-and-agent-memory)
12. [Code Examples](#code-examples)
13. [LlamaIndex vs LangChain RAG Comparison](#llamaindex-vs-langchain-rag-comparison)
14. [Benchmarks and Evaluation](#benchmarks-and-evaluation)
15. [Production RAG Architecture](#production-rag-architecture)
16. [Pros and Cons](#pros-and-cons)
17. [References](#references)

---

## Overview

Retrieval-Augmented Generation (RAG) is the foundational technique that enables AI agents to access **external, up-to-date knowledge** beyond their training data. In agentic systems, RAG has evolved far beyond its original "retrieve-then-generate" pattern into a rich family of architectures where agents dynamically plan, execute, and evaluate retrieval as part of multi-step reasoning.

The core value proposition:
- LLMs have a knowledge cutoff and limited context window
- RAG allows agents to query vast external corpora at inference time
- Agents with RAG can answer questions about private, recent, or domain-specific data
- Agentic RAG extends this by making retrieval itself an intelligent, multi-step process

```
Naive RAG:
  User Query → Retrieve Docs → Stuff into Context → LLM Response

Agentic RAG:
  User Query → Agent Plans Retrieval Strategy
                 ├── Decides which knowledge bases to query
                 ├── Reformulates queries if needed
                 ├── Evaluates retrieved content quality
                 ├── Retrieves more if insufficient
                 └── Synthesizes from multiple sources
```

---

## RAG Fundamentals

### The Classic RAG Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                        RAG Pipeline                               │
│                                                                  │
│  Documents ──► Chunking ──► Embedding ──► Vector Store           │
│                                                                  │
│  Query ──► Query Embedding ──► Similarity Search                 │
│                    │                      │                       │
│                    │              Retrieved Chunks                │
│                    │                      │                       │
│                    └──────────────────────┘                       │
│                              │                                    │
│                    Prompt = Query + Chunks                        │
│                              │                                    │
│                         LLM Generation                           │
│                              │                                    │
│                           Response                               │
└──────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Role | Examples |
|-----------|------|---------|
| **Document Loader** | Ingest raw documents | PDFs, HTML, Markdown, APIs |
| **Text Splitter** | Chunk documents | Fixed-size, semantic, recursive |
| **Embedding Model** | Vectorize text | OpenAI, BGE, Cohere |
| **Vector Store** | Store + search embeddings | Pinecone, Weaviate, pgvector |
| **Retriever** | Find relevant chunks | k-NN, hybrid, MMR |
| **Reranker** | Re-score retrieved chunks | Cohere, Jina, BM25 |
| **LLM** | Generate response | GPT-4, Claude, Llama |

### Embedding Similarity Search

```python
# How vector search works
query = "What is the company's refund policy?"
query_vector = embed(query)  # [0.12, -0.45, 0.67, ...]

# Cosine similarity comparison
results = vector_store.search(
    vector=query_vector,
    top_k=5,
    metric="cosine"
)

# Returns chunks with highest semantic similarity
```

---

## The Evolution: Naive → Advanced → Agentic RAG

### Stage 1: Naive RAG (2022-2023)

Simple retrieve-and-generate. Fixed retrieval, no feedback loop.

**Problems:**
- Wrong chunks retrieved (low precision)
- Missing important information (low recall)
- Hallucinations when retrieval fails
- Can't handle multi-hop questions

### Stage 2: Advanced RAG (2023-2024)

Added pre-retrieval and post-retrieval improvements:

**Pre-retrieval:**
- Query rewriting / expansion
- HyDE (Hypothetical Document Embeddings)
- Query decomposition

**During retrieval:**
- Hybrid search (BM25 + dense vectors)
- Multiple retrievers

**Post-retrieval:**
- Reranking (cross-encoders, Cohere)
- Context compression
- Relevance filtering

### Stage 3: Agentic RAG (2024-2025)

RAG becomes **a tool the agent invokes strategically**:

**Key differences:**
- Agent decides WHEN to retrieve (vs always retrieving)
- Agent decides WHERE to retrieve from (multiple knowledge bases)
- Agent evaluates retrieved content quality
- Agent reformulates queries if retrieval fails
- Agent can retrieve iteratively across multiple steps

---

## Agentic RAG Architecture Patterns

### Pattern 1: Single-Agent RAG

The simplest pattern — one agent with RAG as a tool:

```python
agent = FunctionAgent(
    tools=[rag_query_tool, web_search_tool],
    llm=llm,
    system_prompt="Use RAG for internal docs, web search for external info.",
)
```

### Pattern 2: Router RAG

Agent routes queries to the right knowledge base:

```
User Query
    │
    ▼
Router Agent
    ├── Internal docs? → Company Knowledge Base
    ├── Recent news? → Web Search
    ├── Legal? → Legal Document Store
    └── Code? → Code Repository Index
```

```python
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector

router = RouterQueryEngine(
    selector=LLMSingleSelector.from_defaults(),
    query_engine_tools=[
        QueryEngineTool.from_defaults(
            internal_docs_engine,
            description="For questions about internal policies and procedures"
        ),
        QueryEngineTool.from_defaults(
            external_web_engine,
            description="For recent news and external information"
        ),
    ],
)
```

### Pattern 3: Iterative/Adaptive RAG

Agent retrieves, evaluates, and re-retrieves if needed:

```
Query
  │
  ▼
Initial Retrieval (k=5 docs)
  │
  ▼
Evaluate relevance of retrieved docs
  │
  ├── Sufficient? → Generate response
  │
  └── Insufficient?
          │
          ▼
      Reformulate query
          │
          ▼
      Retrieve again (different k, different query)
          │
          └── (repeat up to N times)
```

### Pattern 4: Multi-Document Agentic RAG

Sub-agents specialized per document/corpus:

```python
# LlamaIndex multi-doc pattern
doc_agents = {
    "finance": build_agent("./financial_reports/"),
    "legal": build_agent("./legal_documents/"),
    "technical": build_agent("./technical_docs/"),
}

# Object index for dynamic agent selection
object_index = ObjectIndex.from_objects(
    [QueryEngineTool.from_defaults(agent, name=name)
     for name, agent in doc_agents.items()],
    index_cls=VectorStoreIndex,
)

# Top-level agent retrieves the right sub-agent
orchestrator = FunctionAgent(
    tool_retriever=object_index.as_retriever(similarity_top_k=2),
    llm=llm,
)
```

### Pattern 5: Plan-Then-Retrieve

Agent plans before retrieving — decides what information it needs:

```
Complex Question
    │
    ▼
Planning step (LLM):
  "To answer this, I need:
   1. Current quarterly revenue figures
   2. Prior year comparison
   3. Market context"
    │
    ▼
Execute retrievals in parallel:
  1. → revenue_index.query("Q4 2024 revenue")
  2. → revenue_index.query("Q4 2023 revenue")
  3. → news_index.query("market conditions Q4 2024")
    │
    ▼
Synthesize retrieved information
    │
    ▼
Final Response
```

### Pattern 6: Corrective/Self-Reflective RAG

Agent evaluates its own retrieved content and corrects:

```
Query → Retrieve → Evaluate Retrieved Docs
                       │
                       ├── CORRECT (relevant, accurate) → Generate
                       │
                       ├── AMBIGUOUS → Web search supplement
                       │
                       └── INCORRECT → Discard, reformulate, retrieve
```

---

## Vector Databases for Agents

### Overview of Options (2024-2025)

| Database | Type | Best For | GitHub Stars |
|---------|------|---------|-------------|
| **Pinecone** | Managed cloud | Ease of use, production | N/A |
| **Milvus** | Open-source | Billions of vectors, scale | ~25k |
| **Weaviate** | Open-source | Hybrid search, GraphQL | ~8k |
| **Qdrant** | Open-source | High performance, Rust | ~9k |
| **Chroma** | Open-source | Local dev, prototyping | ~6k |
| **pgvector** | PostgreSQL ext. | Already using Postgres | ~4k |
| **FAISS** | Library (Facebook) | Research, in-memory | — |
| **LanceDB** | Open-source | Multimodal, embeddings | — |

### Choosing a Vector Database

```
Decision Matrix:

Scale > 100M vectors?
  └── Yes → Pinecone / Milvus
  └── No →
        Existing PostgreSQL?
          └── Yes → pgvector
          └── No →
                Need hybrid search?
                  └── Yes → Weaviate / Qdrant
                  └── No (prototyping) → Chroma / FAISS
```

### pgvector (Production Default for Many Teams)

```sql
-- Enable pgvector
CREATE EXTENSION vector;

-- Create table with vector column
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding vector(1536)  -- OpenAI ada-002 dimension
);

-- Create HNSW index for fast search
CREATE INDEX ON documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Similarity search
SELECT id, content, 1 - (embedding <=> $1) as similarity
FROM documents
ORDER BY embedding <=> $1
LIMIT 5;
```

### Pinecone (Managed, Production)

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="YOUR_API_KEY")

# Create index
pc.create_index(
    name="agent-knowledge-base",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

index = pc.Index("agent-knowledge-base")

# Upsert vectors
index.upsert(vectors=[
    {
        "id": "doc_001",
        "values": embedding_vector,
        "metadata": {"text": "chunk text", "source": "report.pdf", "page": 5}
    }
])

# Query
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={"source": {"$eq": "report.pdf"}}  # Metadata filtering
)
```

### Chroma (Local Development)

```python
import chromadb
from chromadb.utils import embedding_functions

# Persistent local storage
client = chromadb.PersistentClient(path="./chroma_db")

# Create collection with embedding function
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="YOUR_API_KEY",
    model_name="text-embedding-3-small",
)

collection = client.get_or_create_collection(
    name="company_docs",
    embedding_function=openai_ef,
    metadata={"hnsw:space": "cosine"},
)

# Add documents (embedding handled automatically)
collection.add(
    documents=["Our refund policy allows...", "Customer support hours..."],
    metadatas=[{"source": "policy.pdf"}, {"source": "faq.html"}],
    ids=["doc1", "doc2"],
)

# Query
results = collection.query(
    query_texts=["What is the refund policy?"],
    n_results=3,
)
```

---

## LlamaIndex RAG for Agents

LlamaIndex was purpose-built for RAG and offers the richest set of primitives:

### Indexing Types

| Index | Best For |
|-------|---------|
| `VectorStoreIndex` | Semantic similarity search |
| `SummaryIndex` | Summarization queries |
| `KeywordTableIndex` | Exact keyword matching |
| `KnowledgeGraphIndex` | Entity relationships |
| `TreeIndex` | Hierarchical summarization |
| `DocumentSummaryIndex` | Per-document summaries |

### Complete RAG Agent (LlamaIndex)

```python
import asyncio
from llama_index.core import (
    VectorStoreIndex, 
    SummaryIndex,
    SimpleDirectoryReader, 
    Settings,
    StorageContext,
)
from llama_index.core.tools import QueryEngineTool
from llama_index.core.agent.workflow import FunctionAgent
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.pinecone import PineconeVectorStore
from pinecone import Pinecone

# Configure LlamaIndex settings
Settings.llm = OpenAI(model="gpt-4o")
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

# Connect to Pinecone
pc = Pinecone(api_key="YOUR_API_KEY")
pinecone_index = pc.Index("my-index")
vector_store = PineconeVectorStore(pinecone_index=pinecone_index)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# Load and index documents
documents = SimpleDirectoryReader("./knowledge_base/").load_data()

# Create two indexes over same documents
vector_index = VectorStoreIndex.from_documents(
    documents,
    storage_context=storage_context,
)
summary_index = SummaryIndex.from_documents(documents)

# Create two query engines
vector_engine = vector_index.as_query_engine(similarity_top_k=5)
summary_engine = summary_index.as_query_engine(response_mode="tree_summarize")

# Wrap as tools
tools = [
    QueryEngineTool.from_defaults(
        query_engine=vector_engine,
        name="specific_facts",
        description=(
            "Useful for retrieving specific facts, data, and details. "
            "Use for precise questions about specific topics."
        ),
    ),
    QueryEngineTool.from_defaults(
        query_engine=summary_engine,
        name="document_summaries",
        description=(
            "Useful for understanding the overall content and summaries. "
            "Use for high-level questions about what documents cover."
        ),
    ),
]

# Build RAG agent
agent = FunctionAgent(
    tools=tools,
    llm=Settings.llm,
    system_prompt="""You are a knowledge assistant with access to company documentation.
    Always cite your sources when answering questions.
    Use the specific_facts tool for detailed questions and document_summaries for overview questions.""",
    verbose=True,
)

async def main():
    response = await agent.run("What are the key features described in our product documentation?")
    print(response)

asyncio.run(main())
```

### Hybrid Retrieval with LlamaIndex

```python
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.retrievers.bm25 import BM25Retriever

# Vector retriever
vector_retriever = index.as_retriever(similarity_top_k=5)

# BM25 retriever for keyword matching
bm25_retriever = BM25Retriever.from_defaults(
    docstore=index.docstore,
    similarity_top_k=5,
)

# Fuse results with Reciprocal Rank Fusion
fusion_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    similarity_top_k=3,
    num_queries=4,  # Generate multiple query variations
    mode="reciprocal_rerank",
    use_async=True,
    verbose=True,
)

query_engine = RetrieverQueryEngine(retriever=fusion_retriever)
```

### Reranking Pipeline

```python
from llama_index.postprocessor.cohere_rerank import CohereRerank
from llama_index.core.postprocessor import SimilarityPostprocessor

# Retrieve more, then rerank down to top
query_engine = index.as_query_engine(
    similarity_top_k=15,  # Retrieve 15
    node_postprocessors=[
        SimilarityPostprocessor(similarity_cutoff=0.5),  # Filter low-quality
        CohereRerank(api_key="YOUR_KEY", top_n=3),       # Rerank to top 3
    ],
)
```

---

## LangChain RAG for Agents

LangChain's LCEL (LangChain Expression Language) makes RAG pipelines composable:

### Basic RAG Chain

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# 1. Load documents
loader = DirectoryLoader("./docs/", glob="**/*.pdf")
documents = loader.load()

# 2. Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)
chunks = splitter.split_documents(documents)

# 3. Embed and store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(chunks, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# 4. RAG prompt
prompt = ChatPromptTemplate.from_template("""
Answer the question based only on the following context:
{context}

Question: {question}

Provide a clear, accurate answer citing specific information from the context.
If the context doesn't contain relevant information, say so.
""")

# 5. Assemble LCEL chain
llm = ChatOpenAI(model="gpt-4o")

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 6. Run
response = rag_chain.invoke("What is our return policy?")
```

### LangChain RAG as Agent Tool

```python
from langchain.tools.retriever import create_retriever_tool
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate

# Create retriever tool
rag_tool = create_retriever_tool(
    retriever=vectorstore.as_retriever(),
    name="company_knowledge_base",
    description=(
        "Search and retrieve information from the company knowledge base. "
        "Use this for questions about company policies, products, or procedures."
    ),
)

# Create agent with RAG tool
llm = ChatOpenAI(model="gpt-4o")

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant with access to company documentation."),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, [rag_tool], prompt)
executor = AgentExecutor(agent=agent, tools=[rag_tool], verbose=True)

response = executor.invoke({"input": "What are our office hours?"})
```

### Corrective RAG with LangGraph

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, List
from langchain_openai import ChatOpenAI

class RAGState(TypedDict):
    question: str
    documents: List[str]
    generation: str
    web_search_needed: bool

def retrieve(state: RAGState):
    """Retrieve documents from vector store."""
    docs = retriever.invoke(state["question"])
    return {"documents": docs}

def grade_documents(state: RAGState):
    """Assess if retrieved documents are relevant."""
    llm = ChatOpenAI(model="gpt-4o-mini")
    graded_docs = []
    web_search = False
    
    for doc in state["documents"]:
        result = llm.invoke(f"""
        Is this document relevant to: '{state['question']}'?
        Document: {doc.page_content}
        Answer only YES or NO.
        """)
        if "YES" in result.content:
            graded_docs.append(doc)
        else:
            web_search = True
    
    return {"documents": graded_docs, "web_search_needed": web_search}

def web_search(state: RAGState):
    """Supplement with web search if docs were insufficient."""
    if state["web_search_needed"]:
        web_results = web_search_tool.invoke(state["question"])
        return {"documents": state["documents"] + [web_results]}
    return state

def generate(state: RAGState):
    """Generate answer from retrieved docs."""
    context = "\n\n".join([d.page_content for d in state["documents"]])
    llm = ChatOpenAI(model="gpt-4o")
    answer = llm.invoke(f"Context: {context}\n\nQuestion: {state['question']}")
    return {"generation": answer.content}

# Build CRAG graph
workflow = StateGraph(RAGState)
workflow.add_node("retrieve", retrieve)
workflow.add_node("grade", grade_documents)
workflow.add_node("web_search", web_search)
workflow.add_node("generate", generate)

workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", "grade")
workflow.add_edge("grade", "web_search")
workflow.add_edge("web_search", "generate")
workflow.add_edge("generate", END)

crag = workflow.compile()
result = crag.invoke({"question": "What are the latest AI agent benchmarks?"})
```

---

## Advanced Retrieval Techniques

### HyDE (Hypothetical Document Embeddings)

Instead of embedding the query directly, generate a hypothetical document that would answer it, then embed that:

```python
from llama_index.core.indices.query.query_transform.base import (
    HyDEQueryTransform,
)
from llama_index.core.query_engine import TransformQueryEngine

# HyDE: generate hypothetical answer, embed it
hyde = HyDEQueryTransform(include_original=True)
hyde_query_engine = TransformQueryEngine(base_query_engine, hyde)

# Works better for sparse queries where the question text
# doesn't match document language well
```

**Why it works:**  
If asked "How does photosynthesis work?", the embedding of "Photosynthesis is a process where plants convert sunlight..." matches document text much better than embedding the question itself.

### Multi-Query Retrieval

Generate multiple query variations and merge results:

```python
from llama_index.core.retrievers import QueryFusionRetriever

retriever = QueryFusionRetriever(
    retrievers=[vector_retriever],
    num_queries=4,          # Generate 4 query variants
    mode="reciprocal_rerank",
    use_async=True,
    verbose=True,
)
# LLM generates: original + 3 paraphrased versions
# Results merged via Reciprocal Rank Fusion
```

### Hybrid Search (BM25 + Dense)

Combines keyword matching with semantic similarity:

```python
# BM25 for exact token matching
# Dense for semantic similarity
# RRF merges the two ranked lists

def reciprocal_rank_fusion(result_sets, k=60):
    """Merge multiple ranked lists."""
    scores = {}
    for result_set in result_sets:
        for rank, doc_id in enumerate(result_set):
            scores[doc_id] = scores.get(doc_id, 0) + 1/(rank + k)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
```

### Contextual Compression

Compress retrieved chunks to only the relevant portion:

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

base_retriever = vectorstore.as_retriever()
compressor = LLMChainExtractor.from_llm(llm)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever,
)
# Returns only the relevant sentences from each chunk
```

### Parent-Child Chunking

Retrieve small chunks for precision, but return their parent chunks for context:

```python
from llama_index.core.node_parser import HierarchicalNodeParser

# Create hierarchical nodes: large parents, small children
parser = HierarchicalNodeParser.from_defaults(
    chunk_sizes=[2048, 512, 128]  # Parent, child, grandchild
)
nodes = parser.get_nodes_from_documents(documents)

# Index children for retrieval, return parents for context
# AutoMergingRetriever combines small-hit results
```

---

## Self-RAG and Corrective RAG

### Self-RAG (ICLR 2024)

**Paper:** "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection"  
**ArXiv:** https://arxiv.org/abs/2310.11511

Self-RAG trains an LM to use **special reflection tokens** to decide:
1. Whether to retrieve at all (`[Retrieve]` or `[No Retrieve]`)
2. Whether retrieved docs are relevant (`[IsRel]`, `[IsNotRel]`)
3. Whether the generated response is supported (`[IsSup]`, `[IsNotSup]`)
4. Whether the response is useful (`[IsUseful]`, `[IsNotUseful]`)

```
Input → Should I retrieve? [Retrieve]
         │
         ▼ Yes
Retrieve docs
         │
         ▼
Are docs relevant? [Relevant] / [Irrelevant]
         │
         ▼ Relevant
Generate answer
         │
         ▼
Is answer supported by docs? [FullySup] / [PartSup] / [NoSup]
         │
         ▼
Is answer useful? [Utility:1-5]
         │
         ▼
Best answer (highest utility + support)
```

### CRAG (Corrective RAG, Jan 2024)

**Paper:** "Corrective Retrieval Augmented Generation"  
**ArXiv:** https://arxiv.org/abs/2401.15884

CRAG adds a **retrieval evaluator** that scores retrieved documents and triggers corrective actions:

- **Score > threshold:** Use retrieved docs → generate
- **Score < threshold:** Discard docs → web search → generate  
- **Ambiguous score:** Use both retrieved docs + web search

```python
# CRAG logic
relevance_score = evaluate_retrieval(query, retrieved_docs)

if relevance_score > HIGH_THRESHOLD:
    context = retrieved_docs
elif relevance_score < LOW_THRESHOLD:
    context = web_search(query)
else:
    context = retrieved_docs + web_search(query)

response = generate(query, context)
```

---

## GraphRAG

### Microsoft GraphRAG (2024)

**GitHub:** https://github.com/microsoft/graphrag  
**Paper:** "From Local to Global: A Graph RAG Approach to Query-Focused Summarization"

GraphRAG extracts a **knowledge graph** from documents, then uses graph traversal for retrieval — dramatically better for global/analytical questions.

### Architecture

```
Documents
    │
    ▼
Entity Extraction (LLM)
    │
    ▼
Relationship Extraction (LLM)
    │
    ▼
Knowledge Graph (entities + relationships)
    │
    ├── Community Detection (hierarchical)
    │
    └── Community Summaries
            │
            ▼
Query → Graph Search → Relevant subgraphs → Response
```

### When to Use GraphRAG

| Query Type | Standard RAG | GraphRAG |
|-----------|-------------|---------|
| "What is X?" | ✅ Good | Overkill |
| "How do X and Y relate?" | ❌ Poor | ✅ Excellent |
| "Summarize all themes in corpus" | ❌ Poor | ✅ Excellent |
| "Trend analysis across docs" | ❌ Poor | ✅ Excellent |

```python
# Using Microsoft GraphRAG
from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.query.llm.oai.chat_openai import ChatOpenAI
from graphrag.query.structured_search.global_search.search import GlobalSearch

# GraphRAG supports global search (whole-corpus) and local search
search_engine = GlobalSearch(
    llm=llm,
    context_builder=context_builder,
    response_type="Multiple Paragraphs",
)

result = await search_engine.asearch("What are the main themes in these documents?")
```

---

## Knowledge Bases and Agent Memory

### Types of Memory in Agentic RAG

| Memory Type | Description | Implementation |
|------------|-------------|----------------|
| **Working memory** | Current task context | Chat history / context window |
| **Episodic memory** | Past interactions | Vector store of conversations |
| **Semantic memory** | Domain knowledge | RAG knowledge base |
| **Procedural memory** | How to do tasks | System prompt, tool definitions |

### Long-Term Memory with Vector Stores

```python
from llama_index.core.memory import VectorMemory
from llama_index.core import VectorStoreIndex

# Episodic memory: remember past conversations
vector_memory = VectorMemory.from_defaults(
    vector_store=None,
    embed_model=embed_model,
    retriever_kwargs={"similarity_top_k": 2},
)

# Composable memory: buffer + vector
from llama_index.core.memory import SimpleComposableMemory, ChatMemoryBuffer

composable_memory = SimpleComposableMemory.from_defaults(
    primary_memory=ChatMemoryBuffer.from_defaults(token_limit=3000),
    secondary_memory_sources=[vector_memory],
)
```

### Mem0 Integration

```python
# Mem0: persistent user memory for agents
from mem0 import MemoryClient
from llama_index.llms.openai import OpenAI

m = MemoryClient(api_key="YOUR_MEM0_KEY")

# Store important facts about user
m.add(
    messages=[{"role": "user", "content": "I prefer Python over JavaScript"}],
    user_id="user_123",
)

# Retrieve relevant memories for context
memories = m.search("programming preferences", user_id="user_123")

# Inject into agent system prompt
agent_with_memory = FunctionAgent(
    tools=tools,
    llm=OpenAI(model="gpt-4o"),
    system_prompt=f"User preferences: {memories}",
)
```

---

## LlamaIndex vs LangChain RAG Comparison

| Feature | LlamaIndex | LangChain |
|---------|-----------|-----------|
| **RAG primitives** | Very rich (10+ index types) | Good (vectorstore + retriever) |
| **Document loaders** | 50+ built-in | 100+ built-in |
| **Chunking strategies** | Many (semantic, hierarchical) | Recursive, character-based |
| **Vector stores** | 35+ integrations | 60+ integrations |
| **Query engine types** | Router, sub-question, flare | LCEL chains, LangGraph |
| **Agentic RAG** | Native (QueryEngineTool) | Via LangGraph + tools |
| **Multi-doc agents** | First-class support | Via custom chains |
| **Observability** | LlamaTrace, Arize | LangSmith |
| **Learning curve** | Moderate | Moderate-High |
| **Production usage** | LlamaCloud | LangSmith + LangServe |
| **Community** | Large | Larger |

**When to choose LlamaIndex:**
- RAG is primary use case
- Need multi-document agent patterns
- Want clean, readable RAG code
- Python-first team

**When to choose LangChain:**
- General agent with tools (RAG is one of many tools)
- Complex stateful workflows → LangGraph
- Need widest ecosystem of integrations
- JavaScript/TypeScript team

---

## Benchmarks and Evaluation

### RAGAS — RAG Evaluation Framework

```python
from ragas import evaluate
from ragas.metrics import (
    answer_relevancy,     # How relevant is the answer?
    faithfulness,         # Is answer grounded in retrieved docs?
    context_recall,       # Were all necessary docs retrieved?
    context_precision,    # Were retrieved docs actually useful?
)
from datasets import Dataset

# Create evaluation dataset
eval_data = {
    "question": ["What is the refund policy?"],
    "answer": ["Refunds within 30 days"],
    "contexts": [["Our policy allows returns within 30 days of purchase"]],
    "ground_truth": ["We accept returns within 30 days"],
}

dataset = Dataset.from_dict(eval_data)
result = evaluate(dataset, metrics=[
    context_precision,
    context_recall,
    faithfulness,
    answer_relevancy,
])
print(result)
```

### Key RAG Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Context Precision** | Relevant chunks / Retrieved chunks | > 0.8 |
| **Context Recall** | Relevant chunks retrieved / All relevant chunks | > 0.8 |
| **Faithfulness** | Claims supported by context / Total claims | > 0.9 |
| **Answer Relevancy** | Semantic similarity(answer, question) | > 0.8 |

### FRAMES Benchmark Results

FRAMES (Google) tests multi-hop RAG specifically:

| System | Accuracy |
|--------|---------|
| Human | ~92% |
| GPT-4 + Naive RAG | ~30% |
| GPT-4 + Advanced RAG | ~62% |
| Agentic RAG (multi-hop) | ~70%+ |

---

## Production RAG Architecture

### Enterprise-Grade RAG Stack (2024-2025)

```
┌─────────────────────────────────────────────────────────────┐
│                  Production RAG Architecture                 │
│                                                             │
│  Ingestion Pipeline:                                        │
│  Documents → LlamaParse → Chunking → Embedding → Storage   │
│                                                             │
│  Storage Layer:                                             │
│  Vector DB (Pinecone/pgvector) + Relational DB + Doc Store  │
│                                                             │
│  Retrieval Layer:                                           │
│  Hybrid Search (BM25 + Dense) → Reranking (Cohere/Jina)    │
│                                                             │
│  Agent Layer:                                               │
│  Router → Sub-agents per domain → Synthesis                 │
│                                                             │
│  Observability:                                             │
│  LangSmith / LlamaTrace → Metrics → Alerts                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Production Patterns

**1. Chunking strategy:**
- Parent-child chunks (512 byte children, 2048 byte parents)
- Semantic splitting (split on topic boundaries, not fixed length)
- Metadata enrichment (file, date, author, section headers)

**2. Index freshness:**
- Incremental indexing on document changes
- Embeddings cached and versioned
- Index rebuild triggers on major updates

**3. Query routing:**
- Router classifies query → routes to right index
- Temporal queries → freshest sources
- Domain queries → specialized sub-indexes

**4. Retrieval hardening:**
- Retrieve k=15, rerank to n=3
- Minimum relevance score threshold
- Fallback to web search if below threshold

**5. Monitoring:**
- Track retrieval quality per query type
- Alert on faithfulness degradation
- A/B test different retrieval strategies

---

## Pros and Cons

### ✅ Pros of RAG in Agentic Systems

1. **Fresh knowledge:** Access up-to-date information beyond training cutoff
2. **Domain specificity:** Index private/domain knowledge not in LLM training
3. **Source attribution:** Can cite specific documents for answers
4. **Reduced hallucination:** Grounding in retrieved facts reduces confabulation
5. **Cost efficiency:** Cheaper than fine-tuning for knowledge updates
6. **Composability:** RAG as an agent tool is modular and replaceable
7. **Scale:** Can index millions of documents, far beyond context window

### ❌ Cons of RAG in Agentic Systems

1. **Latency:** Each retrieval adds 100-500ms to response time
2. **Retrieval failures:** Poorly chunked or embedded docs give wrong results
3. **Context window pressure:** Retrieved chunks consume precious context
4. **Complex to evaluate:** Multiple failure modes (retrieval vs generation)
5. **Infrastructure cost:** Vector DB + embedding API + reranker costs add up
6. **Chunking sensitivity:** Wrong chunk size = missing context or irrelevant chunks
7. **Cold start:** Building a quality index requires significant engineering

---

## References

- **LlamaIndex Agentic RAG Blog:** https://www.llamaindex.ai/blog/agentic-rag-with-llamaindex-2721b8a49ff6
- **LlamaIndex Agentic Retrieval (Beyond Naive RAG):** https://www.llamaindex.ai/blog/rag-is-dead-long-live-agentic-retrieval
- **RAGAS Evaluation:** https://docs.ragas.io/
- **Self-RAG Paper (ICLR 2024):** https://arxiv.org/abs/2310.11511
- **CRAG Paper:** https://arxiv.org/abs/2401.15884
- **CRAG LangGraph Tutorial:** https://www.datacamp.com/tutorial/corrective-rag-crag
- **Microsoft GraphRAG:** https://github.com/microsoft/graphrag
- **FRAMES Benchmark (Google):** https://github.com/google/frames-benchmark
- **RAG Survey 2025 (ArXiv):** https://arxiv.org/html/2506.00054v1
- **Advanced RAG Techniques (Neo4j):** https://neo4j.com/blog/genai/advanced-rag-techniques/
- **LangChain vs LlamaIndex 2025:** https://latenode.com/blog/platform-comparisons-alternatives/automation-platform-comparisons/langchain-vs-llamaindex-2025-complete-rag-framework-comparison
- **RAG Frameworks Comparison:** https://research.aimultiple.com/rag-frameworks/
- **Enterprise RAG Guide:** https://www.applied-ai.com/briefings/enterprise-rag-architecture/
- **Best Vector Databases 2025 (Firecrawl):** https://www.firecrawl.dev/blog/best-vector-databases
- **Vector DB Comparison (LiquidMetal):** https://liquidmetal.ai/casesAndBlogs/vector-comparison/
- **Agentic RAG with LangChain/Elasticsearch:** https://www.elastic.co/search-labs/blog/agentic-rag-news-assistant-langchain-elasticsearch
