# https://www.patronus.ai/blog

**Source:** https://www.patronus.ai/blog  
**Latency:** 459.8s  
**Extraction goal:** Extract information about Patronus AI's approach to LLM evaluation. Include: evaluation metrics, hallucination detection, and search-related evaluation.  

## Extracted Content

{
  "Patronus AI LLM Evaluation": {
    "1 Evaluation Metrics": {
      "Patronus Evaluators": [
        "Glider",
        "Judge",
        "Judge MM"
      ],
      "Performance Metrics": [
        "Relevance (how well the prompt is addressed)",
        "instruction following",
        "factual/structural completeness"
      ],
      "Safety & Compliance": [
        "Detection of Enterprise PII (usernames, emails, SSNs, business-sensitive data)",
        "Toxicity (threats, insults, profanity)",
        "regulatory violations"
      ],
      "Style & Quality": [
        "Tone assessment (matching a specific persona)",
        "standard NLP metrics like BLEU and ROUGE"
      ],
      "Customization": [
        "Support for rubric-based evaluations",
        "binary (pass/fail) scoring for specific business rules"
      ]
    },
    "2 Hallucination Detection": {
      "Lynx": {
        "Flag Fabrications": "Identify when a model generates information not present in the provided context.",
        "Ensure Grounding": "Verify that every claim in an LLM's response is directly supported by the source data.",
        "Combat Misrepresentation": "Detect instances where a model misinterprets or distorts facts from the input documents."
      }
    },
    "3 Search-Related Evaluation (RAG)": {
      "groundedness stages": [
        "Context Relevance: Evaluates if the search/retrieval engine surfaced information relevant to the user's query.",
        "Context Sufficiency: Determines if the retrieved context actually contains enough information to answer the question.",
        "Answer Relevance: Measures if the final answer is accurately derived from the retrieved search results."
      ],
      "FinanceBench": "They developed this comprehensive benchmark specifically to test RAG performance on complex financial documents, requiring high precision in both retrieval and reasoning."
    }
  }
}
