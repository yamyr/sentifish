# Knowledge Graphs in Agentic Systems

## Neo4j with Agents, GraphRAG, Microsoft GraphRAG, and Graph-Structured Reasoning

---

## Overview

Knowledge graphs represent information as a network of entities and relationships — nodes and edges that capture not just facts but the connections between them. When integrated with AI agents, knowledge graphs provide a structured memory substrate that fundamentally changes how agents reason over complex, interconnected domains. This file covers the architecture and applications of knowledge graphs in agentic AI systems as of 2025.

---

## 1. What is a Knowledge Graph?

A knowledge graph (KG) stores information as **triples**: (subject, predicate, object), forming a directed labeled graph.

**Example:**
```
(Albert Einstein) --[bornIn]--> (Ulm, Germany)
(Albert Einstein) --[developed]--> (Theory of Relativity)
(Theory of Relativity) --[publishedIn]--> (1915)
(Albert Einstein) --[workedAt]--> (Princeton University)
(Princeton University) --[locatedIn]--> (New Jersey)
```

This structure allows **multi-hop reasoning** that's impossible with flat documents:
- "Where did the person who developed the Theory of Relativity work?"
- "Which institutions in New Jersey have Nobel laureates?"

### Graph vs. Vector Store

| Feature | Vector Store | Knowledge Graph |
|---------|--------------|-----------------|
| Lookup type | Semantic similarity | Explicit relationship traversal |
| Multi-hop | Indirect (cosine chains) | Direct (graph traversal) |
| Structure | Dense numerical vectors | Sparse labeled triples |
| Updates | Re-embed to update | Add/modify nodes/edges |
| Explainability | Low (black box embeddings) | High (traversable paths) |
| Query language | ANN search | Cypher, SPARQL, Gremlin |
| Best for | Semantic search | Structured relational queries |

The key insight: **vector stores are great for "find similar text," but knowledge graphs excel at "trace the path between entities."**

---

## 2. Neo4j in Agentic Systems

### Neo4j Overview

Neo4j is the dominant graph database, used in production at companies like Airbnb, UBS, and eBay. Key features:
- **Cypher** — declarative graph query language
- **ACID transactions** — data consistency guarantees
- **Vector index** — native embedding search alongside graph traversal
- **GraphQL API** — developer-friendly data access
- **Cloud offering** — Neo4j AuraDB (managed, serverless)

### Neo4j as Agent Memory

Agents can use Neo4j as a structured long-term memory:

```python
from neo4j import GraphDatabase

class AgentMemory:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def store_entity(self, entity_type: str, properties: dict):
        with self.driver.session() as session:
            session.run(
                f"MERGE (e:{entity_type} {{name: $name}}) "
                "SET e += $props",
                name=properties['name'], props=properties
            )
    
    def store_relationship(self, from_name: str, rel_type: str, to_name: str):
        with self.driver.session() as session:
            session.run(
                "MATCH (a {name: $from_name}), (b {name: $to_name}) "
                f"MERGE (a)-[:{rel_type}]->(b)",
                from_name=from_name, to_name=to_name
            )
    
    def query_neighbors(self, entity_name: str, depth: int = 2) -> list:
        with self.driver.session() as session:
            result = session.run(
                "MATCH (e {name: $name})-[*1..$depth]-(neighbor) "
                "RETURN neighbor.name, labels(neighbor)",
                name=entity_name, depth=depth
            )
            return [record.data() for record in result]
```

### Neo4j LangChain Integration

LangChain provides native Neo4j integration for building graph-aware agents:

```python
from langchain_community.graphs import Neo4jGraph
from langchain.chains import GraphCypherQAChain
from langchain_openai import ChatOpenAI

# Connect to Neo4j
graph = Neo4jGraph(
    url="bolt://localhost:7687",
    username="neo4j",
    password="password"
)

# Get schema for the LLM
print(graph.schema)
# Output: Node properties: Person {name: STRING, born: INTEGER}
#         Relationship properties: ACTED_IN {roles: STRING[]}
#         Relationships: (:Person)-[:ACTED_IN]->(:Movie)

# Create Cypher-generating agent
chain = GraphCypherQAChain.from_llm(
    ChatOpenAI(model="gpt-4"),
    graph=graph,
    verbose=True
)

result = chain.invoke("Who acted in The Matrix?")
# Agent generates: MATCH (p:Person)-[:ACTED_IN]->(m:Movie {title:"The Matrix"}) 
#                  RETURN p.name
# Returns: Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss
```

### Neo4j for Enterprise Knowledge Management

Real-world enterprise use cases for graph + agents:

**Pharmaceutical research:**
```
(Drug A) -[inhibits]-> (Enzyme X) -[produces]-> (Compound Y) -[causes]-> (Side Effect Z)
"Which drugs inhibit enzymes that produce compounds linked to liver toxicity?"
```

**Financial compliance:**
```
(Person A) -[owns]-> (Company B) -[subsidiary_of]-> (Company C) -[registered_in]-> (Tax Haven)
"Find beneficial ownership chains that pass through tax havens"
```

**IT operations:**
```
(Service A) -[depends_on]-> (Service B) -[runs_on]-> (Server X) -[in_datacenter]-> (DC1)
"Which customer-facing services would be affected if DC1 went down?"
```

---

## 3. GraphRAG: Combining Graphs with Retrieval

### Standard RAG Limitations

Standard RAG (Retrieval-Augmented Generation) retrieves text chunks based on semantic similarity. This works poorly for questions that require:
- **Multi-hop reasoning** — "What is the relationship between X and Y?"
- **Global summaries** — "What are the main themes across all documents?"
- **Relational queries** — "Who else worked with the person who founded Z?"
- **Structural queries** — "What are all the subsidiaries of Company A?"

### GraphRAG Architecture

GraphRAG enhances RAG by building a knowledge graph from source documents during indexing:

**Indexing phase:**
```
Documents
    ↓
Text Chunking
    ↓
Entity Extraction (LLM identifies entities + relationships)
    ↓
Community Detection (clustering related entities)
    ↓
Summary Generation (LLM summarizes each community)
    ↓
Knowledge Graph + Vector Index
```

**Query phase:**
```
User Query
    ↓
[Local Search] Vector similarity on entities + text chunks
        OR
[Global Search] Traverse community summaries → aggregate answer
    ↓
Context Assembly (relevant subgraph + text chunks)
    ↓
LLM generates grounded answer
```

### Local vs. Global Search

**Local search** — for specific, entity-focused questions:
```
"What are the financial results of Apple Q3 2024?"
→ Find Apple node → retrieve related financial metrics → answer
```

**Global search** — for thematic, dataset-wide questions:
```
"What are the major trends in this collection of earnings reports?"
→ Traverse community summaries across all companies → aggregate themes
```

Standard RAG only supports local search. GraphRAG enables both.

---

## 4. Microsoft GraphRAG (2024)

### Overview

Microsoft Research released GraphRAG in July 2024 as an open-source system, accompanied by a technical paper. It became one of the most-discussed RAG advances of 2024.

**GitHub:** `microsoft/graphrag`  
**Paper:** "From Local to Global: A Graph RAG Approach to Query-Focused Summarization"  
**Tech stack:** Python, LLM for extraction, optionally Neo4j or NetworkX for storage

### Microsoft GraphRAG Pipeline

```python
# Installation
pip install graphrag

# Initialize workspace
python -m graphrag.index --init --root ./my_project

# Configure (settings.yaml)
# - LLM: OpenAI GPT-4
# - Embedding: OpenAI text-embedding-3-small
# - Input: data/*.txt

# Build the graph (can take hours for large corpora)
python -m graphrag.index --root ./my_project

# Query
python -m graphrag.query \
  --root ./my_project \
  --method global \
  "What are the main themes in these documents?"
```

### What GraphRAG Builds

After indexing, Microsoft GraphRAG produces:
- **Entity graph** — nodes for people, organizations, places, concepts
- **Relationship graph** — labeled edges between entities
- **Community hierarchy** — hierarchical clustering of related entities
- **Community summaries** — LLM-generated summaries at each hierarchical level
- **Text units** — original text chunks linked to extracted entities

### Benchmark Results

Microsoft's research showed GraphRAG significantly outperformed standard RAG on:
- **Comprehensiveness** — more complete answers covering multiple aspects
- **Diversity** — answers covering more distinct perspectives
- **Empowerment** — providing information that helps users draw their own conclusions

Trade-off: GraphRAG is substantially more expensive (more LLM calls during indexing) and slower for simple factual queries.

### When to Use Microsoft GraphRAG

**Use GraphRAG when:**
- Questions require reasoning across an entire corpus
- Users ask "what are the main themes" or "compare X to Y" type questions
- Source material has rich entity relationships (research papers, news, legal docs)
- You need explainable, source-traceable answers

**Stick with standard RAG when:**
- Questions are simple and specific ("What did document X say about Y?")
- Budget is constrained (GraphRAG costs 3-10x more to index)
- Speed is critical (standard RAG queries are faster)
- Documents don't have rich entity structure (raw data tables, logs)

---

## 5. How Graph Structure Enables Better Agent Reasoning

### Multi-Hop Question Answering

Agents with graph memory can traverse multiple hops to answer complex questions:

**Example: Customer support agent**
```
User: "Why is our checkout API slow?"
        
Graph traversal:
checkout_api -[depends_on]-> payment_gateway
payment_gateway -[calls]-> stripe_api
stripe_api -[has_status]-> degraded (updated: 2 hours ago)
stripe_api -[affects]-> payment_gateway_latency (current: 850ms, normal: 120ms)

Agent answer: "Stripe's API is experiencing degraded performance (started ~2 hours ago), 
              which is causing elevated latency in the payment gateway, 
              which your checkout API depends on."
```

Without the graph, the agent would need to search multiple disconnected documents to piece this together.

### Relationship-Aware Context

Graphs capture *how* entities relate, enabling nuanced reasoning:

```
(Employee: Jane Smith)
  -[reportsTo]-> (Manager: Bob Jones)
  -[hasSkill]-> (Python), (Machine Learning), (Neo4j)
  -[workedOn]-> (Project: Atlas), (Project: Beta)
  -[locatedIn]-> (Office: Singapore)
  
(Project: Atlas)
  -[uses]-> (Technology: Kubernetes), (Technology: PostgreSQL)
  -[ownedBy]-> (Team: Platform Engineering)
  -[status]-> (Active)
```

An agent can now answer: "Find someone in Singapore with Python and Kubernetes experience who isn't on an active project" — a query that's trivial in graph traversal but complex with document search.

### Temporal Graphs

Adding time dimension to graphs enables trend analysis:

```
(Revenue: Q1-2024) -[value]-> 1.2M
(Revenue: Q2-2024) -[value]-> 1.4M
(Revenue: Q3-2024) -[value]-> 1.1M  ← anomaly

(Q3-2024) -[coincidesWith]-> (ProductLaunch: Failed-Feature)
(ProductLaunch: Failed-Feature) -[causedBy]-> (Bug: Auth-Regression)
(Bug: Auth-Regression) -[introducedBy]-> (Commit: abc123)
```

Agent can trace the chain: Q3 revenue dip → failed product launch → auth bug → specific commit.

---

## 6. Agentic Knowledge Graph Construction

### LLM-Based Entity Extraction

Modern approaches use LLMs to build knowledge graphs from unstructured text:

```python
from langchain_openai import ChatOpenAI
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_community.graphs import Neo4jGraph
from langchain_core.documents import Document

llm = ChatOpenAI(model="gpt-4", temperature=0)
transformer = LLMGraphTransformer(llm=llm)

# Text to process
documents = [
    Document(page_content="""
        Apple Inc. was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne 
        in April 1976 in Cupertino, California. The company developed the 
        Apple I personal computer, which Steve Wozniak designed.
    """)
]

# Extract graph structure
graph_documents = transformer.convert_to_graph_documents(documents)

# graph_documents contains:
# Nodes: Apple Inc., Steve Jobs, Steve Wozniak, Ronald Wayne, Apple I
# Edges: (Steve Jobs)-[founded]->(Apple Inc.)
#        (Apple Inc.)-[founded_in]->(Cupertino, California)
#        (Steve Wozniak)-[designed]->(Apple I)
#        (Apple Inc.)-[developed]->(Apple I)

# Store in Neo4j
graph = Neo4jGraph(url="bolt://localhost:7687", username="neo4j", password="password")
graph.add_graph_documents(graph_documents)
```

### Incremental Graph Updates

Agents can continuously expand the knowledge graph as they encounter new information:

```python
class KnowledgeGraphAgent:
    def __init__(self, graph: Neo4jGraph, llm: ChatOpenAI):
        self.graph = graph
        self.transformer = LLMGraphTransformer(llm=llm)
        self.llm = llm
    
    def learn_from_document(self, text: str):
        """Extract and store new knowledge"""
        docs = [Document(page_content=text)]
        graph_docs = self.transformer.convert_to_graph_documents(docs)
        self.graph.add_graph_documents(graph_docs, include_source=True)
    
    def query(self, question: str) -> str:
        """Answer question using graph + LLM"""
        # Retrieve relevant subgraph
        cypher = self._generate_cypher(question)
        results = self.graph.query(cypher)
        
        # Generate answer from graph context
        return self.llm.invoke(
            f"Based on this graph data: {results}\n\nAnswer: {question}"
        ).content
    
    def _generate_cypher(self, question: str) -> str:
        """Generate Cypher query from natural language"""
        prompt = f"""
        Graph schema: {self.graph.schema}
        
        Generate a Cypher query to answer: {question}
        Return only the Cypher query, no explanation.
        """
        return self.llm.invoke(prompt).content
```

---

## 7. GraphRAG in Production Systems

### Hybrid Retrieval Architecture

Production GraphRAG systems combine vector search with graph traversal:

```
User Query
    ↓
Dual Retrieval:
├── Vector Search → Top-K semantically similar chunks
└── Graph Traversal → Connected entities and relationships
    ↓
Context Fusion (merge, deduplicate, rank)
    ↓
LLM Generation with full context
    ↓
Response with citations
```

**Implementation example:**
```python
from langchain_community.vectorstores import Neo4jVector
from langchain.retrievers import EnsembleRetriever

# Vector retriever
vector_index = Neo4jVector.from_existing_index(
    embedding=OpenAIEmbeddings(),
    url="bolt://localhost:7687",
    username="neo4j",
    password="password",
    index_name="document_index"
)
vector_retriever = vector_index.as_retriever(search_kwargs={"k": 5})

# Graph retriever
graph_retriever = GraphRetriever(
    graph=neo4j_graph,
    max_hops=2,
    relationship_types=["RELATED_TO", "PART_OF", "AUTHORED_BY"]
)

# Hybrid
ensemble_retriever = EnsembleRetriever(
    retrievers=[vector_retriever, graph_retriever],
    weights=[0.6, 0.4]
)
```

### Performance Considerations

**Indexing cost:**
- Microsoft GraphRAG on 1M tokens: ~$10-50 in LLM API costs
- Community detection: O(n log n) complexity
- Can be parallelized across document batches

**Query cost:**
- Local search: ~same as standard RAG
- Global search: 2-5x more LLM calls (traversing summaries)

**Optimization strategies:**
- Cache community summaries
- Use smaller LLMs for extraction, larger for synthesis
- Prune low-confidence edges from the graph
- Build incremental indices for new documents

---

## 8. Knowledge Graphs for Agent Long-Term Memory

### The Agent Memory Problem

Agents without structured memory suffer from:
- **Context window limits** — can't hold all past interactions in context
- **Semantic drift** — important facts get "forgotten" as conversations age
- **Unstructured recall** — vector search returns chunks, not organized knowledge

### GraphMemory Architecture

A knowledge graph serves as agent long-term memory with structure:

```python
class GraphMemoryAgent:
    """Agent with knowledge graph long-term memory"""
    
    def __init__(self):
        self.graph = Neo4jGraph(...)
        self.llm = ChatOpenAI(model="gpt-4")
        self.transformer = LLMGraphTransformer(llm=self.llm)
    
    def remember(self, conversation: str):
        """Extract and store knowledge from conversation"""
        docs = [Document(page_content=conversation)]
        graph_docs = self.transformer.convert_to_graph_documents(docs)
        self.graph.add_graph_documents(graph_docs)
    
    def recall(self, query: str) -> str:
        """Retrieve relevant memories from graph"""
        # Entity-focused recall
        entities = self._extract_entities(query)
        subgraph = self._get_neighborhood(entities, depth=2)
        return self._format_context(subgraph)
    
    def reason(self, question: str) -> str:
        """Answer question using graph memory"""
        context = self.recall(question)
        return self.llm.invoke(
            f"Known context from memory:\n{context}\n\nQuestion: {question}"
        ).content
```

### Memory Categories in Graph

```
(Memory Graph)
├── (People) — names, roles, preferences, interactions
├── (Projects) — status, tasks, dependencies, deadlines
├── (Concepts) — domain knowledge, definitions, relationships
├── (Events) — what happened, when, who was involved
├── (Preferences) — user likes/dislikes, communication style
└── (Procedures) — how to do things, learned workflows
```

---

## 9. Domain-Specific Applications

### Legal Knowledge Graphs

```
(Case: Brown v. Board)
  -[decided_by]-> (Supreme Court)
  -[decided_in]-> (1954)
  -[overruled]-> (Case: Plessy v. Ferguson)
  -[cited_by]-> [hundreds of subsequent cases]
  -[legal_principle]-> "Separate but equal is unconstitutional"
```

Agent capability: "What cases cite Brown v. Board in the context of education policy?"

### Medical Knowledge Graphs

```
(Drug: Warfarin)
  -[treats]-> (Condition: Atrial Fibrillation)
  -[interacts_with]-> (Drug: Aspirin)  {severity: HIGH}
  -[metabolized_by]-> (Enzyme: CYP2C9)
  -[contraindicated_in]-> (Condition: Active Bleeding)
```

Agent capability: "What drugs interact with Warfarin that are also CYP2C9 inhibitors?"

### Cybersecurity Threat Intelligence

```
(APT Group: Fancy Bear)
  -[uses_malware]-> (Malware: X-Agent)
  -[targets_sector]-> (Sector: Government), (Sector: Defense)
  -[attributed_to]-> (Country: Russia)
  -[used_in_attack]-> (Incident: DNC-2016)
```

Agent capability: "Which threat actors have targeted energy infrastructure using phishing campaigns?"

---

## 10. Tools and Frameworks (2025)

| Tool | Type | Use Case |
|------|------|----------|
| Neo4j | Graph database | Production graph storage + querying |
| Microsoft GraphRAG | Framework | Document corpus indexing + querying |
| LangChain Neo4j | Integration | Agent-graph bridge |
| LlamaIndex KG | Integration | KG construction + querying |
| Amazon Neptune | Managed graph | AWS-native graph database |
| TigerGraph | Graph database | Large-scale analytics |
| Nebula Graph | Graph database | High-performance open source |
| FalkorDB | Graph database | Redis-compatible, fast |
| Cognee | Memory library | Agent memory using knowledge graphs |
| Zep | Memory platform | Long-term agent memory with graph |

---

## 11. The Emerging Pattern: Agentic Knowledge Graphs

The latest research (2025) shows agents that both *use* and *build* knowledge graphs:

1. **Agent reads** from KG to answer queries (standard use)
2. **Agent writes** to KG as it learns (continuous learning)
3. **Agent restructures** the KG when inconsistencies are found
4. **Agent spawns sub-agents** for deep-dive exploration of subgraphs
5. **Agent triggers alerts** when new graph patterns match watchlist criteria

This creates **self-organizing knowledge networks** (Buehler 2025) where the graph becomes an emergent representation of everything the agent has learned.

---

## Conclusion

Knowledge graphs are evolving from static data stores to dynamic reasoning substrates for AI agents. The combination of graph structure (explicit relationships), vector search (semantic similarity), and LLM reasoning (natural language understanding) creates systems that can answer questions no single technology could handle alone.

Microsoft GraphRAG's 2024 release democratized graph-enhanced RAG, while Neo4j's LangChain integrations made production deployment accessible. In 2025, the frontier is agentic knowledge graph construction — agents that learn, update, and reason over graphs in real-time, creating persistent structured memory that survives across sessions and grows more capable over time.

---

*Research compiled for Sentifish/Ajentik research archive, March 2025*
