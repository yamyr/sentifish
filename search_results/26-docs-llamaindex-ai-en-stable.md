# https://docs.llamaindex.ai/en/stable/

**Source:** https://docs.llamaindex.ai/en/stable/  
**Latency:** 2061.98s  
**Extraction goal:** Find and extract information about LlamaIndex evaluation modules. Include: retrieval evaluation, response evaluation, and metrics for search quality.  

## Extracted Content

{
  "title": "LlamaIndex Evaluation Modules",
  "content": "Comprehensive suite for assessing RAG systems, divided into Retrieval Evaluation and Response Evaluation.",
  "sections": [
    {
      "heading": "1. Retrieval Evaluation",
      "description": "Focuses on quality of retrieved documents for a query, independent of LLM response.",
      "core_module": {
        "name": "RetrieverEvaluator",
        "functionality": "Compares retriever output against ground-truth document IDs; supports .evaluate() for single queries and .aevaluate_dataset() for batch processing.",
        "usage": "Specify metrics for evaluation."
      }
    },
    {
      "heading": "2. Metrics for Search Quality",
      "metrics": [
        {
          "name": "Hit Rate",
          "description": "Fraction of queries where correct/relevant document is in top-k results; higher indicates better coverage."
        },
        {
          "name": "MRR (Mean Reciprocal Rank)",
          "description": "Average of reciprocal ranks (1/rank) of first relevant document; rewards higher placement."
        }
      ]
    },
    {
      "heading": "3. Response Evaluation",
      "description": "Assesses quality of LLM-generated answer based on retrieved context and query.",
      "core_module": "All implement BaseEvaluator with .evaluate() and .evaluate_response().",
      "key_evaluators": [
        {
          "name": "FaithfulnessEvaluator",
          "description": "Detects hallucinations by checking if answer is based on retrieved context."
        },
        {
          "name": "RelevancyEvaluator",
          "description": "Checks if context and answer are relevant/consistent with query."
        },
        {
          "name": "CorrectnessEvaluator",
          "description": "Assesses factual correctness vs. ground-truth answer."
        },
        {
          "name": "SemanticEvaluator",
          "description": "Uses semantic similarity (embeddings) to compare response to reference."
        }
      ],
      "output": "EvaluationResult with passing (boolean), score (numerical), feedback (qualitative)."
    }
  ],
  "integrations": [
    "DeepEval",
    "UpTrain",
    "Ragas"
  ],
  "purpose": "Advanced/specialized evaluation needs."
}
