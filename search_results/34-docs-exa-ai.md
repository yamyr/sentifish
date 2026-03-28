# https://docs.exa.ai/

**Source:** https://docs.exa.ai/  
**Latency:** 392.41s  
**Extraction goal:** Extract information about Exa AI search API. Include: search capabilities, neural search features, evaluation approach, and result quality.  

## Extracted Content

{
  "Exa_AI_Search_API": {
    "search_capabilities": {
      "search_modes": {
        "Fast": "Median latency <500ms; optimized for speed with high accuracy (~94% on SimpleQA)",
        "Auto": "Median latency ~1s; provides a balance of speed and depth (~95.8% accuracy)",
        "Deep": "Designed for complex queries requiring multi-step reasoning and structured outputs. It takes 5\u201360 seconds but achieves superior accuracy (~97.2% on SimpleQA)"
      },
      "content_extraction": "The `search_and_contents` endpoint allows users to search the web and extract cleaned content in a single request. It supports full markdown text, query-relevant highlights, and LLM-generated summaries.",
      "freshness_crawling": "Exa supports \"Live Crawling\" via the `maxAgeHours` parameter, allowing users to bypass cached results for real-time information. It also features **subpage crawling** to discover and extract content from linked pages within a site."
    },
    "neural_search_features": {
      "next_link_prediction": "The engine uses embedding-based models to predict and rank links based on semantic similarity and conceptual relationships.",
      "thematic_search": "It excels at exploratory and thematic queries where traditional search might fail to find conceptually related but keyword-distinct pages.",
      "token_efficient_highlights": "A core neural feature is the \"Highlights\" mode, which uses models to condense full webpages into query-relevant excerpts. This is **10x more token-efficient** than full-text extraction, significantly reducing LLM costs and improving RAG (Retrieval-Augmented Generation) performance."
    },
    "evaluation_approach": {
      "four_phase_workflow": [
        {
          "phase": 1,
          "name": "Scope Definition",
          "description": "Defining objectives (e.g., factual QA, freshness) and latency requirements."
        },
        {
          "phase": 2,
          "name": "Dataset Selection",
          "description": "Utilizing standardized benchmarks like **SimpleQA** (factual QA), **FRAMES** (multi-hop retrieval), **MultiLoKo** (complex reasoning), and **FreshQA** (freshness)."
        },
        {
          "phase": 3,
          "name": "Run Configurations",
          "description": "Executing a standardized retrieval-synthesis-grading loop where an LLM synthesizes answers from retrieved context and a separate LLM grades the output."
        },
        {
          "phase": 4,
          "name": "Results Analysis",
          "description": "Tracking metrics such as accuracy, retrieval coverage, P50 latency, and cost per query."
        }
      ],
      "fair_benchmarking_principles": "Exa emphasizes using default settings, standardizing queries across systems, and disabling prompt engineering to evaluate the base API's performance."
    },
    "result_quality": {
      "factual_accuracy": "On the SimpleQA benchmark, Exa's accuracy ranges from **94% (Fast)** to **97.2% (Deep)**.",
      "complex_reasoning": "Exa Deep leads on challenging benchmarks, achieving **96% on FRAMES** and **89% on MultiLoKo**.",
      "quality_latency_tradeoff": "The API is designed to provide \"Perfect Search\" profiles, allowing developers to trade latency for higher retrieval quality depending on the use case (e.g., instant chat vs. deep research)."
    }
  }
}
