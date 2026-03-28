# https://trec.nist.gov/

**Source:** https://trec.nist.gov/  
**Latency:** 1103.09s  
**Extraction goal:** Extract information about TREC evaluation campaigns for information retrieval. Include: tracks related to web search, evaluation methodology, metrics used (NDCG, MAP, etc), and recent tracks.  

## Extracted Content

{
  "TREC": {
    "description": "The Text REtrieval Conference (TREC), co-sponsored by NIST and the U.S. Department of Defense, provides the infrastructure for large-scale evaluation of information retrieval (IR) methodologies.",
    "evaluation_campaigns": {
      "tracks_related_to_web_search": [
        {
          "name": "Web Track",
          "description": "The primary track for web search research, which ran from 1999 to 2014. It evolved from searching small web crawls to multi-billion page collections."
        },
        {
          "name": "Deep Learning Track",
          "description": "A modern successor (2019\u2013present) that uses large-scale web datasets (like MS MARCO) to evaluate neural retrieval and ranking models."
        },
        {
          "name": "Terabyte Track",
          "description": "Focused on efficiency and effectiveness when searching collections of one terabyte or more (2004\u20132006)."
        },
        {
          "name": "Million Query Track",
          "description": "Investigated evaluation methods using very large sets of queries with sparse relevance judgments (2007\u20132009)."
        },
        {
          "name": "Federated Web Search Track",
          "description": "Explored techniques for searching across multiple independent web search engines."
        }
      ],
      "evaluation_methodology": {
        "TREC_Cycle": [
          "Data Distribution: NIST provides a standardized test collection consisting of a document set and a set of \"topics\" (questions or information needs).",
          "Submissions (Runs): Participants run their retrieval systems on the data and submit their top-ranked results (typically the top 1,000 documents per topic) to NIST.",
          "Pooling: To handle the impossibility of judging every document, NIST uses \"pooling,\" where the top-ranked results from all participants are merged into a single pool for assessment.",
          "Relevance Judging: Human assessors (often retired analysts or subject matter experts) judge the documents in the pool. Modern tracks often use graded relevance (e.g., a 0\u20134 scale from \"not relevant\" to \"perfectly relevant\") rather than simple binary judgments.",
          "Scoring: NIST uses the trec_eval software to calculate system effectiveness based on the human judgments."
        ]
      },
      "metrics_used": [
        {
          "name": "MAP (Mean Average Precision)",
          "description": "The standard single-valued measure for overall system effectiveness across all topics."
        },
        {
          "name": "NDCG (Normalized Discounted Cumulative Gain)",
          "description": "Frequently used in modern tracks (like Web and Deep Learning) to reward systems for placing highly relevant documents at the very top of the results."
        },
        {
          "name": "Precision@k (e.g., P@10)",
          "description": "Measures the fraction of relevant documents in the top $k$ results, reflecting a user's typical search experience."
        },
        {
          "name": "MRR (Mean Reciprocal Rank)",
          "description": "Often used for \"known-item\" or navigational tasks where there is a single correct answer."
        },
        {
          "name": "Recall@k",
          "description": "Measures the proportion of all relevant documents that were successfully retrieved in the top $k$."
        },
        {
          "name": "ROUGE and BERTScore",
          "description": "Increasingly used in generative tracks (like RAG) to evaluate the quality of generated text summaries against gold-standard references."
        }
      ],
      "recent_tracks_2024_2025": [
        {
          "name": "Retrieval Augmented Generation (RAG)",
          "description": "Evaluates systems that retrieve information to generate natural language answers."
        },
        {
          "name": "Million LLM Track",
          "description": "Focuses on the challenges of evaluating and using Large Language Models at scale."
        },
        {
          "name": "Interactive Knowledge Assistance Track (IKAT)",
          "description": "Explores conversational search where the system must understand context and clarify user needs."
        },
        {
          "name": "Video Question Answering (VQA)",
          "description": "Moves beyond text to evaluate retrieval and reasoning over video content."
        },
        {
          "name": "Product Search",
          "description": "Focuses on e-commerce retrieval challenges."
        },
        {
          "name": "NeuCLIR",
          "description": "Researching Cross-Language Information Retrieval using neural techniques."
        }
      ]
    }
  }
}
