# Web Search Agent Evals — Research Collection

**Collected by:** TinyFish browser agent swarm (25 parallel agents)
**Total sites targeted:** 65
**Successfully extracted:** 25
**Total content:** ~66,000+ characters of structured research data

## Successfully Extracted Sources

### Benchmarks & Frameworks
| # | Source | Content |
|---|--------|---------|
| 1 | [WebArena](01-webarena-dev.md) | Realistic web environment benchmark, 812 tasks, GPT-4 achieves 14.41% vs 78.24% human |
| 2 | [Mind2Web](02-osu-nlp-group-github-io-mind2web.md) | Web interaction benchmark with real-world websites |
| 3 | [VisualWebArena](03-jykoh-com-vwa.md) | Multimodal web agent evaluation |
| 7 | [WorkArena](07-github-com-servicenow-workarena.md) | Enterprise web agent benchmark by ServiceNow |
| 8 | [WebShop](08-webshop-pnlp-github-io.md) | Interactive web shopping agent benchmark |
| 10 | [SWE-bench](10-www-swebench-com.md) | Software engineering agent evaluation |
| 6 | [AgentBench](06-github-com-thudm-agentbench.md) | Multi-environment LLM agent evaluation |

### Research Papers
| # | Source | Content |
|---|--------|---------|
| 11 | [WebArena Paper (arXiv 2307.13854)](11-arxiv-org-abs-2307-13854.md) | Full abstract, authors, metrics, methodology |
| 12 | [Mind2Web Paper (arXiv 2306.06070)](12-arxiv-org-abs-2306-06070.md) | Full abstract, dataset, evaluation approach |
| 14 | [GAIA Paper (arXiv 2311.12983)](14-arxiv-org-abs-2311-12983.md) | General AI assistant evaluation benchmark |
| 17 | [WebLINX Paper (arXiv 2402.06015)](17-arxiv-org-abs-2402-06015.md) | Conversational web navigation benchmark |
| 20 | [Tool-augmented LLM Paper (arXiv 2312.04474)](20-arxiv-org-abs-2312-04474.md) | Tool use evaluation framework |
| 50 | [Agent Eval Survey (arXiv 2401.01335)](50-arxiv-org-abs-2401-01335.md) | Survey on agent evaluation dimensions |
| 51 | [Web Agent Paper (arXiv 2403.13457)](51-arxiv-org-abs-2403-13457.md) | Web agent evaluation methodology |

### IR Evaluation Standards
| # | Source | Content |
|---|--------|---------|
| 21 | [TREC (trec.nist.gov)](21-trec-nist-gov.md) | Full TREC methodology, metrics (NDCG, MAP, MRR, P@k), recent tracks |
| 23 | [MTEB Leaderboard](23-huggingface-co-spaces-mteb-leaderboard.md) | Text embedding benchmark leaderboard |

### Evaluation Platforms & Tools
| # | Source | Content |
|---|--------|---------|
| 26 | [LlamaIndex Eval](26-docs-llamaindex-ai-en-stable.md) | Retrieval and response evaluation modules |
| 29 | [Arize Phoenix](29-docs-arize-com-phoenix.md) | LLM observability and eval platform |
| 40 | [Patronus AI](40-www-patronus-ai-blog.md) | LLM evaluation and hallucination detection |

### Search APIs & Company Approaches
| # | Source | Content |
|---|--------|---------|
| 34 | [Exa AI](34-docs-exa-ai.md) | Neural search API, capabilities, evaluation |
| 35 | [Brave Search API](35-brave-com-search-api.md) | Independent search API features |

### Blog Posts & Guides
| # | Source | Content |
|---|--------|---------|
| 37 | [OpenAI: Governing Agentic AI](37-openai-com-index-practices-for-governing-agentic-ai-systems.md) | Safety evaluation, benchmarks |
| 39 | [Lilian Weng: LLM Agents](39-lilianweng-github-io-posts-2023-06-23-agent.md) | Agent architectures, eval approaches, benchmarks |

## Key Metrics Covered

From TREC and academic sources, the following evaluation metrics are documented:
- **NDCG** (Normalized Discounted Cumulative Gain)
- **MAP** (Mean Average Precision)
- **MRR** (Mean Reciprocal Rank)
- **Precision@K** and **Recall@K**
- **Success Rate** (task completion)
- **F1 Score** for information extraction
- **ROUGE** and **BERTScore** for generative tasks

## Key Benchmarks Documented

| Benchmark | Domain | Key Metric | Tasks |
|-----------|--------|------------|-------|
| WebArena | Web interaction | Success Rate | 812 |
| Mind2Web | Real websites | Element accuracy | 2000+ |
| VisualWebArena | Multimodal web | Success Rate | 910 |
| SWE-bench | Software eng. | Resolve Rate | 2294 |
| AgentBench | Multi-env | Success Rate | 8 envs |
| WorkArena | Enterprise web | Success Rate | 33 tasks |
| WebShop | E-commerce | Reward/SR | 12k products |
| GAIA | General AI | Success Rate | 3 levels |
| TREC | IR evaluation | NDCG/MAP | Varies |
| BEIR | IR benchmark | NDCG@10 | 18 datasets |
| MTEB | Embeddings | Various | 56 datasets |
