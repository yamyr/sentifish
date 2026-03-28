# https://docs.arize.com/phoenix

**Source:** https://docs.arize.com/phoenix  
**Latency:** 275.29s  
**Extraction goal:** Extract information about Arize Phoenix for LLM observability and evaluation. Include: retrieval evaluation, search metrics, and monitoring capabilities.  

## Extracted Content

{
  "Arize Phoenix": {
    "description": "Provides comprehensive tools for LLM observability and evaluation, particularly for Retrieval-Augmented Generation (RAG) systems.",
    "features": {
      "1. Retrieval Evaluation": {
        "evaluators": [
          {
            "name": "Retrieval (RAG) Relevance",
            "description": "A pre-tested evaluator that determines if retrieved documents are relevant to a user's query. It uses classification templates (e.g., RAG_RELEVANCY_PROMPT) to categorize document relevance."
          },
          {
            "name": "Document Relevance",
            "description": "A pre-built metric used to evaluate whether a specific document contains information necessary to answer a given query."
          },
          {
            "name": "Evaluation via Tracing",
            "description": "Users can use SpanQuery to extract retrieved documents and queries directly from traces for evaluation, allowing for automated relevance checks on production or development data."
          }
        ]
      },
      "2. Search Metrics": {
        "metrics": [
          {
            "name": "Precision, Recall, and F-Score",
            "description": "These metrics are available as pre-built evaluators to measure the accuracy and completeness of retrieved information."
          },
          {
            "name": "Relevance Classification",
            "description": "Provides binary or multi-class labels for retrieved documents, which can be aggregated to assess overall search quality."
          }
        ]
      },
      "3. Monitoring Capabilities": {
        "features": [
          {
            "name": "Performance Monitoring",
            "metrics": [
              "latency",
              "throughput",
              "error rates"
            ],
            "description": "Tracks critical operational metrics such as latency, throughput, and error rates across various spans and traces."
          },
          {
            "name": "Usage Analysis",
            "metrics": [
              "token usage",
              "model performance",
              "cost metrics"
            ],
            "description": "Monitors token usage, model performance, and cost metrics, helping developers optimize resource allocation and spend."
          },
          {
            "name": "Request Tracing",
            "description": "Visualizes the control flow of the application to identify bottlenecks, debug issues, and trace request flows from input to output."
          },
          {
            "name": "Quality Monitoring",
            "description": "Facilitates the running of evaluations on LLM outputs in real-time or batch modes to detect quality regressions or drifts."
          }
        ]
      }
    }
  }
}
