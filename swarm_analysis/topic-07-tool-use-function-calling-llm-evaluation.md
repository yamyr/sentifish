# Topic 7: tool use function calling LLM evaluation

**Search latency:** 235.5s  
**Results found:** 10  
**Pages analyzed:** 10  
**Successful analyses:** 3  
**Total content:** 7,183 chars  

## Search Results

| Rank | Title | URL |
|------|-------|-----|
| 1 | The Berkeley Function Calling Leaderboard (BFCL): From Tool  | https://openreview.net/forum?id=2GmDdhBdDk |
| 2 | Berkeley Function Calling Leaderboard (BFCL) V4 | https://gorilla.cs.berkeley.edu/leaderboard.html |
| 3 | The Berkeley Function Calling Leaderboard (BFCL): From Tool  | https://proceedings.mlr.press/v267/patil25a.html |
| 4 | Beyond the Leaderboard: Unpacking Function Calling Evaluatio | https://www.databricks.com/blog/unpacking-function-calling-eval |
| 5 | The Anatomy of Tool Calling in LLMs: A Deep Dive | https://martinuke0.github.io/posts/2026-01-07-the-anatomy-of-tool-calling-in-llm |
| 6 | Function calling - OpenAI API | https://developers.openai.com/api/docs/guides/function-calling |
| 7 | LLM Function Calling: Evaluating Tool Calls In LLM Pipelines | https://phoenix.arize.com/llm-function-calling-evaluating-tool-calls-in-llm-pipe |
| 8 | Clarifying Function Calling / Tool Use in LLMs - Medium | https://medium.com/@aevalone/clarifying-function-calling-tool-use-in-llms-6511af |
| 9 | LLM Function Call Performance Evaluation With Synthetic Eval | https://github.com/jplane/llm-function-call-eval |
| 10 | Local LLM Tool Calling: Which LLM Should You Use? - Docker | https://www.docker.com/blog/local-llm-tool-calling-a-practical-evaluation/ |

## Page Analyses

### 1. The Berkeley Function Calling Leaderboard (BFCL): From Tool Use to ...
**URL:** https://openreview.net/forum?id=2GmDdhBdDk  
**Latency:** 1618.4s  

*No content extracted.*

---

### 2. Berkeley Function Calling Leaderboard (BFCL) V4
**URL:** https://gorilla.cs.berkeley.edu/leaderboard.html  
**Latency:** 1618.4s  

*No content extracted.*

---

### 3. The Berkeley Function Calling Leaderboard (BFCL): From Tool Use to ...
**URL:** https://proceedings.mlr.press/v267/patil25a.html  
**Latency:** 1618.4s  

*No content extracted.*

---

### 4. Beyond the Leaderboard: Unpacking Function Calling Evaluation
**URL:** https://www.databricks.com/blog/unpacking-function-calling-eval  
**Latency:** 1618.4s  

*No content extracted.*

---

### 5. The Anatomy of Tool Calling in LLMs: A Deep Dive
**URL:** https://martinuke0.github.io/posts/2026-01-07-the-anatomy-of-tool-calling-in-llms-a-deep-dive/  
**Latency:** 1618.4s  

*No content extracted.*

---

### 6. Function calling - OpenAI API
**URL:** https://developers.openai.com/api/docs/guides/function-calling  
**Latency:** 1618.4s  

*No content extracted.*

---

### 7. LLM Function Calling: Evaluating Tool Calls In LLM Pipelines
**URL:** https://phoenix.arize.com/llm-function-calling-evaluating-tool-calls-in-llm-pipelines/  
**Latency:** 1618.4s  

*No content extracted.*

---

### 8. Clarifying Function Calling / Tool Use in LLMs - Medium
**URL:** https://medium.com/@aevalone/clarifying-function-calling-tool-use-in-llms-6511af510f99  
**Latency:** 730.6s  

{
  "title": "Research Summary: Clarifying Function Calling and Tool Use in LLMs",
  "source_note": "Member-only story on Medium; summary based on preview and metadata",
  "sections": {
    "1. Key Findings": [
      "LLMs do not inherently know how to interface with external tools; tool use is not a \"magic\" capability and requires explicit software implementation.",
      "Structured Output is Essential: The primary mechanism for successful tool use is the enforcement of structured outputs (such as JSON) from the LLM.",
      "Common Misconception: There is a widespread belief that LLMs can automatically interact with databases or APIs if simply \"given\" access. In reality, the LLM only generates the *instruction* or *parameters* for the tool, not the execution itself.",
      "Preparation Work: Significant \"background work\" involving specific prompting and output parsing must occur before an external function can be successfully triggered."
    ],
    "2. Methodologies": [
      "Prompting for Tool Use: Utilizing specific prompts to inform the model about available tools and the required format for calling them.",
      "Output Enforcement: Implementing constraints to ensure the LLM returns data in a machine-readable format that a secondary system can interpret.",
      "Code-Based Invocation: Developing a \"wrapper\" or intermediary code that takes the LLM's structured output, validates it, and then programmatically executes the external API or function call."
    ],
    "3. Metrics": "Not explicitly detailed in the visible portion of the article. The focus is on the qualitative logic of implementation rather than quantitative performance scoring.",
    "4. Tools/Frameworks": [
      "External APIs and Databases: General reference to the types of tools LLMs are typically integrated with.",
      "Open Source LLMs: Mentioned as being capable of tool use provided the correct implementation framework is used.",
      "Note: Specific frameworks like LangChain or specialized evaluation tools were not named in the accessible text."
    ],
    "5. Benchmarks and Datasets": "No specific benchmarks (e.g., ToolBench, Gorilla) or datasets were mentioned in the visible sections of this article.",
    "6. Quantitative Results": "No specific quantitative data points or success rate percentages were provided in the accessible content."
  },
  "overall_note": "The article primarily serves as a conceptual guide to dispel misconceptions about the \"out-of-the-box\" capabilities of LLMs regarding function calling. Full details on metrics or specific benchmarks may be contained within the restricted member-only sections of the post."
}

---

### 9. LLM Function Call Performance Evaluation With Synthetic Eval ... - GitHub
**URL:** https://github.com/jplane/llm-function-call-eval  
**Latency:** 1368.7s  

{
  "llm_function_calling_evaluation": {
    "key_findings_objectives": {
      "production_readiness": "The primary goal is to produce core artifacts required for reliable LLM function calling in production environments.",
      "optimization_targets": [
        "Model Choice (e.g., testing GPT-4o vs. others)",
        "Configuration: Fine-tuning parameters like temperature and top_p",
        "System Prompts: Developing prompts that minimize hallucinations in tool use",
        "API Specs: Refining OpenAPI specifications to be more \"LLM-friendly.\""
      ],
      "scalability": "Demonstrates that synthetic data generation can reliably replace or augment manual test case creation for tool use"
    },
    "methodologies": {
      "phases": [
        {
          "name": "Synthetic Data Generation",
          "steps": [
            {
              "name": "Seeding",
              "description": "Starts with a base list of natural language \"intents\" (e.g., intents.txt)"
            },
            "name"
          ],
          "Expansion": "Uses **GitHub Copilot** to synthetically expand these into hundreds of diverse user scenarios.",
          "ground_truth": "Generates expected function call metadata (method names and arguments) based on the provided api.json (OpenAPI spec)."
        }
      ]
    },
    "name": "Automated Evaluation",
    "description": "Uses the **Azure AI Foundry Evaluation SDK** to run batch inferences where the LLM predicts function calls for the synthetic dataset."
  },
  "name": "Result Handling",
  "description": "Results are logged and visualized in Azure AI Foundry for comparison across different model versions and prompts."
}

---

### 10. Local LLM Tool Calling: Which LLM Should You Use? - Docker
**URL:** https://www.docker.com/blog/local-llm-tool-calling-a-practical-evaluation/  
**Latency:** 856.1s  

{
  "summary": {
    "title": "Practical Evaluation of Local LLM Tool Calling",
    "source": "Docker Blog Post"
  },
  "key_findings_recommendations": {
    "top_performer": {
      "model": "Qwen 3 (14B)",
      "f1_score": 0.971,
      "comparison": "nearly matching GPT-4 (0.974)"
    },
    "efficiency_leader": {
      "model": "Qwen 3 (8B)",
      "f1_score": 0.933,
      "latency": 84
    },
    "latency_tradeoffs": {
      "local_models": "~142s",
      "gpt4": "<5s"
    },
    "quantization_impact": "Q4_K_M vs F16 does not significantly degrade accuracy",
    "recommendations": {
      "maximum_accuracy": [
        "Qwen 3 (14B)",
        "Qwen 3 (8B)"
      ],
      "balance_speed_accuracy": "Qwen 2.5",
      "lightweight_environments": "LLaMA 3 Groq 7B"
    }
  },
  "methodologies": {
    "testing_tool": "model-test",
    "description": "scalable tool simulating multi-round agent conversations (up to 5 rounds)",
    "agent_loop_simulation": "navigate conversation, select tools, handle responses iteratively",
    "manual_baseline": {
      "tool": "chat2cart",
      "description": "shopping assistant to identify failure modes (eager invocation, wrong tool selection)"
    }
  },
  "metrics": {
    "primary": "F1 Score",
    "f1_description": "harmonic mean of precision (valid tool calls) and recall (necessary tool calls)",
    "others": [
      "Tool Invocation & Selection",
      "Parameter Accuracy",
      "Latency (average runtime in seconds per interaction)"
    ]
  },
  "tools_frameworks": [
    "Docker Model Runner",
    "Ollama",
    "Model-test (Docker\u2019s custom open-source framework)",
    "OpenAI API"
  ],
  "benchmarks_datasets": {
    "benchmarks": [
      "GPT-4 (gold standard)",
      "GPT-3.5",
      "Berkeley Function-Calling Leaderboard"
    ],
    "total_tests": 3570,
    "total_models": 21,
    "test_suites": [
      {
        "name": "Simple",
        "description": "Greetings and single-step actions"
      },
      {
        "name": "Complex",
        "description": "Multi-step reasoning and tool chaining"
      }
    ]
  },
  "quantitative_results_top_10": [
    {
      "model": "GPT-4",
      "f1_score": 0.974
    },
    {
      "model": "Qwen 3 (14B-Q4_K_M)",
      "f1_score": 0.971
    },
    {
      "model": "Qwen 3 (14B-Q6_K)",
      "f1_score": 0.943
    },
    {
      "model": "Claude 3 Haiku",
      "f1_score": 0.933
    },
    {
      "model": "Qwen 3 (8B-F16)",
      "f1_score": 0.933
    },
    {
      "model": "Qwen 3 (8B-Q4_K_M)",
      "f1_score": 0.919
    },
    {
      "model": "GPT-3.5 Turbo",
      "f1_score": 0.899
    },
    {
      "model": "GPT-4o",
      "f1_score": 0.857
    },
    {
      "model": "GPT-4o-mini",
      "f1_score": 0.852
    },
    {
      "model": "Claude 3.5 Sonnet",
      "f1_score": 0.851
    }
  ]
}

---
