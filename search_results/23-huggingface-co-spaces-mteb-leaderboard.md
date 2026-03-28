# https://huggingface.co/spaces/mteb/leaderboard

**Source:** https://huggingface.co/spaces/mteb/leaderboard  
**Latency:** 1676.65s  
**Extraction goal:** Extract information about the MTEB leaderboard for text embedding benchmarks. Include: evaluation tasks, metrics, top models, and retrieval-specific benchmarks.  

## Extracted Content

{
  "MTEB_Leaderboard": {
    "Evaluation_Tasks": [
      "Retrieval (e.g., BEIR)",
      "Reranking",
      "STS (Semantic Textual Similarity)",
      "Classification",
      "Clustering",
      "Bitext Mining",
      "Pair Classification",
      "Instruction Reranking & Instruction Following"
    ],
    "Metrics": {
      "Overall": [
        "Rank (Borda)",
        "Mean (Task)",
        "Mean (TaskType)"
      ],
      "Retrieval": [
        "NDCG@10",
        "MAP@1000"
      ],
      "STS": "Spearman correlation based on cosine similarity",
      "Classification": "Accuracy",
      "Clustering": "V-Measure"
    },
    "Top_Models": [
      "KaLM-Embedding-Gemma3-12B-2511",
      "llama-embed-nemotron-8b",
      "Qwen3-Embedding-8B",
      "gemini-embedding-001",
      "Qwen3-Embedding-4B"
    ],
    "Retrieval_Benchmarks": [
      "RTEB (Multilingual, English, domain-specific: Finance, Legal, Code, Healthcare)",
      "ViDoRe (V1, V2, V3, Jina Visual Document Retrieval)",
      "BEIR (and NanoBEIR)",
      "BEIR-NL (Dutch)",
      "Long-context Retrieval",
      "Reasoning Retrieval (e.g., BRIGHT)",
      "Instruction-Following Retrieval",
      "Code Information Retrieval",
      "Language-Specific: RTEB French, German, Japanese, and others"
    ]
  }
}
