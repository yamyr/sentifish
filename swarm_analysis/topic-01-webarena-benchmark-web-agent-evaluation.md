# Topic 1: WebArena benchmark web agent evaluation

**Search latency:** 435.9s  
**Results found:** 10  
**Pages analyzed:** 10  
**Successful analyses:** 9  
**Total content:** 33,476 chars  

## Search Results

| Rank | Title | URL |
|------|-------|-----|
| 1 | WebArena Verified: Reliable Evaluation for Web Agents | https://openreview.net/forum?id=94tlGxmqkN |
| 2 | GitHub - ServiceNow/webarena-verified: A verified version of | https://github.com/ServiceNow/webarena-verified |
| 3 | Evaluator - WebArena-Verified | https://servicenow.github.io/webarena-verified/getting_started/usage/ |
| 4 | WebChoreArena: Evaluating Web Browsing Agents on Realistic T | https://arxiv.org/pdf/2506.01952 |
| 5 | WebArena-x | https://webarena.dev/ |
| 6 | VAB-WebArena-Lite Benchmark | weizhepei/WebAgent-R1 | DeepWi | https://deepwiki.com/weizhepei/WebAgent-R1/3.1-vab-webarena-lite-benchmark |
| 7 | WebArena Benchmark - Web & Desktop Agents | CodeSOTA | https://www.codesota.com/browse/agentic/web-agents/webarena |
| 8 | WebArena Benchmark and the State of Agentic AI - Medium | https://medium.com/@adnanmasood/webarena-benchmark-and-the-state-of-agentic-ai-c |
| 9 | AdaRubric: Task-Adaptive Rubrics for LLM Agent Evaluation | https://arxiv.org/pdf/2603.21362 |
| 10 | Environment Maps: Structured Environmental Representations f | https://arxiv.org/html/2603.23610v2 |

## Page Analyses

### 1. WebArena Verified: Reliable Evaluation for Web Agents
**URL:** https://openreview.net/forum?id=94tlGxmqkN  
**Latency:** 808.8s  

{
  "paper_title": "WebArena Verified: Reliable Evaluation for Web Agents",
  "description": "introduces a more robust and reproducible version of the WebArena benchmark to address the limitations of existing web agent evaluations.",
  "structured_summary": {
    "key_findings": [
      "Widely used web agent benchmarks (like the original WebArena) often misestimate agent performance due to underspecified goals and brittle checkers (e.g., substring matching).",
      "WebArena Verified reduces false negatives by approximately 11% compared to the original benchmark by fixing misaligned evaluations and clarifying instructions.",
      "The \"WebArena Verified Hard\" subset (137 tasks) reduces evaluation costs by 83% while retaining high difficulty.",
      "Knowledge-only baselines (e.g., GPT-5, Claude Sonnet 4) show non-negligible success on certain tasks, indicating potential contamination or \"vulnerable\" task designs that can be solved without actual web interaction."
    ],
    "methodologies": [
      "Comprehensive Audit: Audited all 812 original WebArena tasks.",
      "Evaluation Repair: Replaced brittle substring matching with type- and normalization-aware comparators.",
      "State Verification: Verified backend state changes for tasks that modify the environment (e.g., database or server state).",
      "Structured Scoring: Adopted a JSON schema with explicit status codes for deterministic scoring.",
      "Instruction Clarification: Repaired ambiguous or misaligned task instructions to ensure agents have well-defined goals."
    ],
    "metrics": [
      "Template-level Macro Averages: Reporting results grouped by task templates to avoid bias from similar tasks.",
      "95% Confidence Intervals (t-CIs): Providing statistical significance for reported success rates.",
      "Failure-mode Breakdowns: Detailed categorization of why agents fail (e.g., navigation errors vs. incorrect extraction)."
    ],
    "tools_frameworks": [
      "Containerized Environments: Preserves the original WebArena\u2019s isolated, reproducible environments (CMS, e-commerce, GitLab, etc.).",
      "Public Repository: Code, data, and evaluation tools are released for the community.",
      "Evaluation Engine: A structured JSON-based system for reporting and scoring."
    ],
    "benchmarks_datasets": [
      "WebArena Verified (Full): The complete set of 812 audited and repaired tasks.",
      "WebArena Verified Hard: A curated 137-task subset focused on the most difficult and reliable cases."
    ]
  },
  "quantitative_results": {
    "table": [
      {
        "Agent": "OpenAI Operator",
        "WebArena (Original) Full": "41.0%",
        "WebArena Verified (Full)": "49.0% \u00b1 4.8%",
        "WebArena Verified (Hard)": "33.2% \u00b1 6.7%"
      },
      {
        "Agent": "Naive Baseline Ensemble",
        "WebArena (Original) Full": "13.8%",
        "WebArena Verified (Full)": "0.0% \u00b1 0.0%",
        "WebArena Verified (Hard)": "0.0% \u00b1 0.0%"
      },
      {
        "Agent": "GPT-5 (Knowledge-only)",
        "WebArena (Original) Full": "-",
        "WebArena Verified (Full)": "4.9% (22.7% on vuln tasks)",
        "WebArena Verified (Hard)": "-"
      },
      {
        "Agent": "Claude Sonnet 4 (K-only)",
        "WebArena (Original) Full": "-",
        "WebArena Verified (Full)": "1.1% (5.1% on vuln tasks)",
        "WebArena Verified (Hard)": "-"
      }
    ],
    "note": "Success Rates for Verified results include 95% t-Confidence Intervals."
  }
}

---

### 2. GitHub - ServiceNow/webarena-verified: A verified version of the ...
**URL:** https://github.com/ServiceNow/webarena-verified  
**Latency:** 272.7s  

{
  "overview_key_findings": {
    "description": "WebArena-Verified is a fully audited and reproducible release of the original WebArena benchmark addressing flaws like brittle string matching and non-deterministic scoring.",
    "features": [
      "Full Manual Audit: Every task (812 total), reference answer, and evaluator manually reviewed and corrected.",
      "Reliability Improvements: Original LLM-as-a-judge and substring matching led to inconsistencies due to prompt drift and ambiguous criteria.",
      "Offline Reproducibility: Uses network trace (HAR) replay for offline evaluation without live web environments.",
      "Agent Capability: Modern LLMs can follow complex JSON schemas for structured evaluation"
    ]
  },
  "methodologies": [
    "Deterministic Scoring: Type-aware normalization and structural comparison replacing LLM judgments.",
    "Explicit Format Specification: Strict JSON requirements (task_type, status, retrieved_data) for objective verification.",
    "Verifiable Intent: Open-ended tasks rephrased to objective retrieval (e.g., extract specific fields).",
    "Network Event-Based Evaluation: Inspects network traces for actions like downloads or API calls."
  ],
  "metrics": {
    "success_rate": "Primary metric: ratio of successfully completed tasks.",
    "deterministic_score": "Value 0.0-1.0 based on exact/structural matching.",
    "status_codes": [
      "SUCCESS",
      "FAILURE",
      "ERROR (system/environment issues)"
    ]
  },
  "tools_frameworks": {
    "webarena_verified_cli": "CLI for managing environments, running agents, batch evaluations.",
    "docker": "Hosts six containerized web environments (Shopping, Reddit, GitLab, etc.).",
    "uv_pip": "Package management for Python evaluation library.",
    "playwright": "Framework for agent-browser interaction and network trace capture."
  },
  "benchmarks_datasets": {
    "webarena_verified_dataset": "812 verified tasks across 6 sites: Shopping, Shopping Admin, Reddit, GitLab, Wikipedia, Map.",
    "webarena_verified_hard_subset": "258 difficulty-prioritized tasks for cost-effective challenging evaluation.",
    "network_trace_replay_har": "Dataset of captured network events for re-evaluation."
  },
  "quantitative_results": {
    "audit_rate": "100% for all 812 tasks.",
    "subset_efficiency": "Hard subset reduces costs by ~68% (812 to 258 tasks).",
    "error_rate_reduction": "Reduces false positives (correct navigation, failed retrieval) and false negatives (found answer, formatting fail).",
    "leaderboards": "Specific model leaderboards (e.g., GPT-4 vs. Claude 3.5) not hosted on main documentation."
  }
}

---

### 3. Evaluator - WebArena-Verified
**URL:** https://servicenow.github.io/webarena-verified/getting_started/usage/  
**Latency:** 1199.0s  

{
  "project_overview": "WebArena-Verified is a reproducible, deterministic, and fully audited release of the original WebArena benchmark. It was developed to address issues of unreliability, cost, and lack of determinism in web agent evaluation by providing a \"gold standard\" for testing autonomous agents in realistic web environments.",
  "key_methodologies": [
    {
      "method": "Full Benchmark Auditing",
      "description": "Every task, reference answer, and evaluator in the 812-task benchmark was manually reviewed and corrected."
    },
    {
      "method": "Offline Evaluation (HAR Replay)",
      "description": "Agents are evaluated using network trace replay (HTTP Archive files). This enables deterministic, offline evaluation that is identical across different runs without needing live, stateful environments."
    },
    {
      "method": "Deterministic Scoring",
      "description": "Replaces subjective LLM-as-a-judge and brittle substring matching with: Type-aware normalization (Ensuring data types (dates, prices, lists) are compared correctly), Structural comparison (Matching agent outputs against structured reference data)."
    },
    {
      "method": "Network Event-Based Evaluation",
      "description": "Instead of relying only on DOM elements (which can be brittle), the framework monitors network events (e.g., specific API calls or form submissions) to verify state-changing actions like \"purchase\" or \"delete.\""
    }
  ],
  "tools_frameworks": {
    "cli_tools": [
      "agent-input-get (to export task data)",
      "eval-tasks (to score agent logs)"
    ],
    "programmatic_api": "A Python-based API for seamless integration into agent development workflows.",
    "infrastructure": [
      "Built on Playwright for web interaction",
      "Docker for containerized environments"
    ],
    "environment_sites": [
      "Shopping",
      "Shopping Admin",
      "Reddit",
      "GitLab",
      "Wikipedia",
      "Map"
    ]
  },
  "benchmarks_datasets": {
    "full": "WebArena-Verified (Full): The complete, audited set of 812 tasks.",
    "hard": {
      "name": "WebArena-Verified Hard",
      "tasks": 258,
      "description": "A curated subset of 258 challenging tasks prioritized by difficulty.",
      "selection_criteria": "Uses a survival-style Generalized Linear Mixed Model (GLMM) to quantify task hardness based on multi-agent trajectories.",
      "balance": "Balances task categories and site coverage while excluding contaminated tasks (e.g., specific Map tasks)."
    }
  },
  "metrics": [
    {
      "name": "Success Rate (Score)",
      "description": "A binary or normalized score indicating if the task was completed correctly based on audited evaluators."
    },
    {
      "name": "Task Status",
      "description": "Categorizes outcomes (e.g., Success, Failure) with detailed evaluator logs."
    },
    {
      "name": "Unachievable Task Handling",
      "description": "Explicitly handles cases where agents must recognize a task is impossible (e.g., \"Product not found\" or \"Permission denied\") rather than guessing."
    }
  ],
  "quantitative_findings_results": {
    "task_difficulty": {
      "hard_subset": "In the Hard subset, 48.1% of tasks have a predicted success rate of \u2264 0.20",
      "additional": "16.7% have a \u2265 0.90 probability of being classified as \"hard.\""
    },
    "category_performance": "Findings indicate that multi-step state-changing interactions (Mutate tasks) are significantly harder for agents than read-only (Browse) tasks.",
    "reliability": "By removing LLM-based evaluation, the benchmark eliminates variance caused by \"prompt drift\" or sampling randomness, leading to 100% deterministic scoring for a given agent trajectory."
  }
}

---

### 4. WebChoreArena: Evaluating Web Browsing Agents on Realistic Tedious Web ...
**URL:** https://arxiv.org/pdf/2506.01952  
**Latency:** 1438.0s  

{
  "paper": {
    "title": "WebChoreArena: Evaluating Web Browsing Agents on Realistic Tedious Web Tasks",
    "arxiv": "2506.01952"
  },
  "summary": {
    "key_findings": [
      {
        "Performance Gap": "Current state-of-the-art LLMs (e.g., GPT-4o, Claude 3.7, Gemini 2.5) show significant performance improvements over older models but still have substantial room for improvement compared to human performance on \"tedious\" tasks."
      },
      {
        "Challenge Complexity": "WebChoreArena is significantly more difficult than the original WebArena benchmark, particularly in tasks requiring precise calculation and long-term memory."
      },
      {
        "Model Sensitivity": "Performance is highly dependent on the agent framework used (e.g., Gemini 2.5 Pro performs better via BrowserGym than AgentOccam)."
      }
    ],
    "methodologies": {
      "task_extension": "Builds upon the four WebArena simulation environments (Shopping, Shopping Admin, Reddit, and GitLab) to ensure reproducibility.",
      "curation_process": "Over 300 hours of human effort to curate 532 tasks across five domains.",
      "consistency_checks": "Three annotators assigned to each site, with one overseeing all sites to maintain consistency.",
      "challenge_pillars": [
        "Massive Memory: Accurate retrieval from large datasets.",
        "Calculation: Precise mathematical reasoning within web workflows.",
        "Long-Term Memory: Maintaining context across multiple webpages and long interaction sequences."
      ]
    },
    "metrics": {
      "primary": "Success Rate (%) on completed tasks.",
      "categorical": "Performance broken down by domain (Shopping, Admin, etc.) and by challenge type (Memory, Calculation, etc.)."
    },
    "tools_and_frameworks": {
      "simulation_environments": "Based on WebArena (Shopping, GitLab, Reddit, etc.).",
      "agent_modules": "Integrates with AgentOccam and BrowserGym.",
      "infrastructure": "Uses Playwright for web interaction and APIs from OpenAI (Azure), Anthropic, and Google."
    },
    "benchmarks_and_datasets": {
      "dataset": {
        "total": 532,
        "Shopping": 117,
        "Shopping Admin": 132,
        "Reddit": 91,
        "GitLab": 127,
        "Cross-site": 65
      },
      "baseline": "WebArena"
    },
    "quantitative_results": [
      {
        "model": "Gemini 2.5 Pro",
        "framework": "BrowserGym",
        "overall": 44.9,
        "Shopping": 47.9,
        "Admin": 50,
        "Reddit": 44,
        "GitLab": 40.2,
        "Cross": 40
      },
      {
        "model": "Claude 3.7 Sonnet",
        "framework": "BrowserGym",
        "overall": 23.1,
        "Shopping": 16.2,
        "Admin": 26.5,
        "Reddit": 18.7,
        "GitLab": 25.2,
        "Cross": 30.8
      },
      {
        "model": "GPT-4o (2024-05)",
        "framework": "BrowserGym",
        "overall": 2.6,
        "Shopping": 0.9,
        "Admin": 2.3,
        "Reddit": 5.5,
        "GitLab": 3.9,
        "Cross": 0
      },
      {
        "model": "Gemini 2.5 Pro",
        "framework": "AgentOccam",
        "overall": 37.8,
        "Shopping": 41.9,
        "Admin": 42.4,
        "Reddit": 44,
        "GitLab": 38.6,
        "Cross": 10.8
      },
      {
        "model": "Claude 3.7 Sonnet",
        "framework": "AgentOccam",
        "overall": 23.5,
        "Shopping": 27.4,
        "Admin": 28.8,
        "Reddit": 23.1,
        "GitLab": 22.8,
        "Cross": 7.7
      },
      {
        "model": "GPT-4o (2024-05)",
        "framework": "AgentOccam",
        "overall": 6.8,
        "Shopping": 10.3,
        "Admin": 4.5,
        "Reddit": 9.9,
        "GitLab": 7.1,
        "Cross": 0
      }
    ],
    "note": "Results indicate that even the highest-performing model (Gemini 2.5 Pro at ~45%) struggles with nearly half of the \"tedious\" tasks presented in the benchmark."
  }
}

---

### 5. WebArena-x
**URL:** https://webarena.dev/  
**Latency:** 1482.1s  

{
  "WebArena Benchmark": {
    "Key Findings": [
      {
        "Significant Human-Agent Gap": "There is a massive performance disparity between humans (78.24% success rate) and the best-performing LLM agents (e.g., GPT-4 at ~14.41%)"
      },
      {
        "Reasoning Limitations": "While Chain-of-Thought (CoT) reasoning slightly improves performance, it does not resolve the fundamental challenges of long-horizon web tasks"
      },
      {
        "Achievability Misjudgment": "Agents frequently fail to correctly identify whether a task is achievable, often labeling feasible tasks as \"impossible\" or vice-versa"
      },
      {
        "Generalization Issues": "Models show inconsistent performance even across tasks derived from similar templates, indicating a lack of robust generalization in web environments"
      }
    ],
    "Methodologies": [
      {
        "Realistic Environment": "A self-hostable, standalone environment (via Docker) containing functional clones of popular websites (Shopping, Social Forum, GitLab, etc.)"
      },
      {
        "End-to-End Interaction": "Agents interact with the web environment using natural language commands, requiring they navigate, extract information, and modify states (e.g., posting a comment or placing an order)"
      },
      {
        "Programmatic Validation": "Unlike benchmarks that rely solely on string matching, WebArena uses annotated programs to verify the functional correctness of a task by checking the final system state and intermediate properties"
      }
    ],
    "Metrics": [
      {
        "Success Rate (SR)": "The primary metric measuring the percentage of tasks successfully completed according to the ground-truth validation scripts"
      },
      {
        "Functional Correctness": "A measure of whether the agent's actions resulted in the intended state changes in the web environment"
      }
    ],
    "Tools & Frameworks": [
      {
        "Environment": "Docker-based infrastructure for hosting local instances of GitLab, Magento (Shopping), Postmill (Forum), and various Wikis/Maps"
      },
      {
        "Execution": "The benchmark is typically navigated using automation tools like Playwright to interface between the LLM and the browser"
      }
    ],
    "Benchmarks & Datasets": {
      "Total Tasks": 812,
      "Categories": [
        "Online Shopping (Magento)",
        "Social Forum (Postmill)",
        "Collaborative Software Development (GitLab)",
        "Content Management (CMS)",
        "Information Tools: Maps (OpenStreetMap), Wiki (Wikipedia), Calculator, and Scratchpad"
      ]
    },
    "Quantitative Results": {
      "table": [
        {
          "Agent / Participant": "Human Performance",
          "Success Rate (%)": "78.24%"
        },
        {
          "Agent / Participant": "GPT-4 (Best Configuration)",
          "Success Rate (%)": "14.41%"
        },
        {
          "Agent / Participant": "GPT-4 (with CoT)",
          "Success Rate (%)": "11.70%"
        },
        {
          "Agent / Participant": "GPT-4o (Leaderboard approx.)",
          "Success Rate (%)": "~5.7%"
        },
        {
          "Agent / Participant": "GPT-3.5 / Text-Bison",
          "Success Rate (%)": "< 10% (Varies by category)"
        }
      ],
      "note": "The low success rates even for advanced models like GPT-4o highlight the extreme difficulty and realism of the WebArena benchmark compared to simpler web-navigation datasets."
    },
    "source": "Based on the research from WebArena.dev (https://webarena.dev/) and its associated paper"
  }
}

---

### 6. VAB-WebArena-Lite Benchmark | weizhepei/WebAgent-R1 | DeepWiki
**URL:** https://deepwiki.com/weizhepei/WebAgent-R1/3.1-vab-webarena-lite-benchmark  
**Latency:** 2946.4s  
**Error:** peer closed connection without sending complete message body (incomplete chunked read)  

*No content extracted.*

---

### 7. WebArena Benchmark - Web & Desktop Agents | CodeSOTA
**URL:** https://www.codesota.com/browse/agentic/web-agents/webarena  
**Latency:** 2356.8s  

{
  "WebArena_Benchmark": {
    "key_findings": {
      "rapid_advancement": "389.9% improvement in success rates over a single year with two major technical breakthroughs",
      "state_of_the_art": "Agent-E (GPT-4o) by Emergence AI, 73% success rate (July 2024)",
      "high_complexity": "Top models like Claude Opus 4 and Agent Q lag behind SOTA"
    },
    "methodologies": {
      "environment": "Realistic self-hosted web environment: e-commerce, social media, code repositories, CMS",
      "task_design": "812 long-horizon tasks requiring real-world browser actions (purchases, database queries, posting content)",
      "agent_architecture": "Hierarchical agents and DOM distillation (e.g., Agent-E)"
    },
    "metrics": {
      "primary": "Success Rate (task completion from start to finish)"
    },
    "tools_frameworks": {
      "underlying_llms": [
        "GPT-4o",
        "Claude 3.7 Sonnet",
        "Claude Opus 4",
        "GPT-4 Turbo"
      ],
      "agent_frameworks": [
        "Agent-E (Emergence AI)",
        "Agent Q"
      ]
    },
    "benchmarks_datasets": {
      "dataset_size": "812 annotated samples/tasks",
      "category": "Web & Desktop Agents",
      "related_benchmarks": [
        "OSWorld"
      ]
    },
    "quantitative_results": [
      {
        "model": "Agent-E (GPT-4o)",
        "success_rate": "73.0%",
        "date": "July 2024"
      },
      {
        "model": "Claude Opus 4",
        "success_rate": "55.0%",
        "date": "April 2025"
      },
      {
        "model": "Agent Q (GPT-4o)",
        "success_rate": "50.5%",
        "date": "July 2023"
      },
      {
        "model": "Claude 3.7 Sonnet",
        "success_rate": "35.1%",
        "date": "February 2025"
      },
      {
        "model": "GPT-4 Turbo (2024)",
        "success_rate": "14.9%",
        "date": "July 2023"
      }
    ],
    "additional_notes": "Shift from ~15% to ~73% success rates in short timeframe"
  }
}

---

### 8. WebArena Benchmark and the State of Agentic AI - Medium
**URL:** https://medium.com/@adnanmasood/webarena-benchmark-and-the-state-of-agentic-ai-c22697e8e192  
**Latency:** 1583.5s  

{
  "WebArena Benchmark and Agentic AI Summary": {
    "1. Key Findings": [
      {
        "Rapid Progress": "AI agent performance on the WebArena benchmark has jumped from a 14% success rate to approximately 60% in just two years."
      },
      {
        "Architectural Convergence": "Improvement is largely attributed to a \"standard model\" modular architecture consisting of a high-level Planner, a specialized Executor, and a structured Memory."
      },
      {
        "Data Over Model Size": "Specialized training data is the most critical performance booster, often allowing smaller, fine-tuned models (e.g., 7B\u20138B parameters) to outperform larger generic models like GPT-4."
      },
      {
        "The Human Gap": "A significant gap remains between the current state-of-the-art (~62%) and human performance (78.24%). Closing this requires solving \"frontier\" problems: deep visual understanding, common-sense reasoning, and long-horizon error recovery."
      },
      {
        "Evaluation Shift": "WebArena moves away from simple sequence-matching to outcome-based evaluation (functional correctness), testing agents in reproducible environments like e-commerce, GitLab, and CMS."
      }
    ],
    "2. Methodologies": [
      "Modular Architecture: Use of Planner-Executor-Memory frameworks.",
      "Agentic Workflows: Implementation of self-correction/verification loops (Sense-Plan-Verify-Act) and hierarchical planning.",
      "Search and Reasoning: Use of Monte Carlo Tree Search (MCTS) for pathfinding in complex web environments (e.g., WebPilot).",
      "Training Techniques: Specialized fine-tuning on web workflows using RLHF (Reinforcement Learning from Human Feedback), synthetic trajectory generation, and LoRA (Low-Rank Adaptation).",
      "Hybrid Interaction: Combining GUI-based actions (DOM manipulation, screenshots) with API-based interactions for efficiency."
    ],
    "3. Metrics": {
      "Success Rate (SR)": "The primary metric, defined by the percentage of tasks completed successfully based on functional correctness and programmatic state checks (e.g., database verification).",
      "Baselines": {
        "Human Baseline": "78.24%",
        "Initial GPT-4 Baseline": "14.41%"
      }
    },
    "4. Tools & Frameworks": {
      "Foundational Models": "GPT-4, GPT-4o, GPT-4V, Claude-1.3, o3, Qwen, and LLaMA.",
      "Specialized Agents": {
        "OpenAI Operator": "(58.1% SR) - High-performance closed-source agent.",
        "IBM CUGA": "(61.7% SR) - Current leaderboard leader (closed).",
        "ScribeAgent": "Uses 7B/32B models optimized for web workflows.",
        "Jace.AI (AWA-1)": "An action-oriented assistant."
      },
      "Technical Tools": "Headless browsers, DOM interaction tools, and function-calling interfaces."
    },
    "5. Benchmarks & Datasets": {
      "Primary Benchmark": "WebArena (realistic, reproducible web tasks).",
      "Supplementary Benchmarks": "MiniWoB, Mind2Web, and ST-WebAgentBench.",
      "Datasets": {
        "Scribe Dataset": "6B tokens of specialized web workflows.",
        "Synthetic Data": "Trajectories generated from enterprise logs and interaction traces."
      }
    },
    "6. Quantitative Results": {
      "Leaderboard Rankings": [
        {
          "1. IBM CUGA": "61.7%"
        },
        {
          "2. OpenAI Operator": "58.1%"
        },
        {
          "3. Jace.AI": "57.1%"
        },
        {
          "4. ScribeAgent + GPT-4o": "53.0%"
        },
        {
          "5. AgentSymbiotic": "52.1% (Open Source)"
        }
      ],
      "Performance Boosts": [
        {
          "ScribeAgent (7B)": "Performance increased by 14% (from 37.2% to 51.3%) through specialized data."
        },
        {
          "Learn-by-Interact": "Achieved a 19.5% improvement through interaction-based training."
        }
      ]
    }
  }
}

---

### 9. AdaRubric: Task-Adaptive Rubrics for LLM Agent Evaluation
**URL:** https://arxiv.org/pdf/2603.21362  
**Latency:** 2119.6s  

{
  "paper": {
    "title": "AdaRubric: Task-Adaptive Rubrics for LLM Agent Evaluation",
    "arXiv": "2603.21362",
    "date": "March 2026"
  },
  "benchmark": "WebArena web agent evaluation",
  "sections": {
    "1": {
      "title": "Key Findings",
      "items": [
        {
          "name": "Superior Human Alignment",
          "description": "AdaRubric achieves a Pearson correlation of 0.79 with expert human judgment on WebArena, significantly outperforming the best static baseline (Prometheus at 0.61) and direct GPT-4 prompts (0.64)."
        },
        {
          "name": "Enhanced Reliability",
          "description": "The framework demonstrates \"deployment-grade\" reliability with a Krippendorff\u2019s alpha (\u03b1) of 0.83\u20130.85, indicating high consistency across evaluation runs compared to G-Eval (0.64)."
        },
        {
          "name": "Effective Training Signal",
          "description": "DPO agents trained on AdaRubric preference pairs show a +6.8 to +8.5 percentage point (pp) gain in task success rate over those trained using Prometheus."
        },
        {
          "name": "Accelerated RL Convergence",
          "description": "In online PPO training, AdaRubric rewards accelerated convergence, reaching a 30.2% success rate at 5,000 steps, compared to 23.6% for Prometheus and 21.3% for GPT-4 Scalar rewards."
        }
      ]
    },
    "2": {
      "title": "Methodologies",
      "items": [
        {
          "name": "Adaptive Rubric Generation",
          "description": "Unlike static rubrics, AdaRubric generates task-specific evaluation dimensions on the fly (e.g., for a hotel booking task, it might generate: Search Precision, Form Completion, Error Recovery, Confirmation Verification, and Minimal Action)."
        },
        {
          "name": "Confidence-Weighted Trajectory Evaluation",
          "description": "Evaluates trajectories step-by-step. Each step is scored per dimension with a confidence weight, and scores are aggregated using a Weighted Mean (WM) or Geometric Mean (GM)."
        },
        {
          "name": "DimensionAwareFilter (DAF)",
          "description": "A novel filtering mechanism for preference pairs that prevents \"dimension-level failures\" (where an agent fails a critical step but maintains a high overall score) from polluting training data."
        },
        {
          "name": "Reward Signal Synthesis",
          "description": "Filtered evaluations are synthesized into preference pairs for Direct Preference Optimization (DPO) or scalar rewards for Proximal Policy Optimization (PPO)."
        }
      ]
    },
    "3": {
      "title": "Metrics",
      "items": [
        {
          "name": "Pearson r",
          "description": "Measures the correlation between the LLM-as-Judge scores and expert human rankings."
        },
        {
          "name": "Krippendorff\u2019s alpha (\u03b1)",
          "description": "Quantifies the reliability and consistency of the evaluator across multiple runs."
        },
        {
          "name": "Success Rate (SR%)",
          "description": "The primary downstream performance metric for agents on the WebArena tasks."
        }
      ]
    },
    "4": {
      "title": "Tools & Frameworks",
      "items": [
        {
          "name": "AdaRubric",
          "description": "The proposed framework for task-adaptive evaluation."
        },
        {
          "name": "WebArena",
          "description": "The realistic web environment used for benchmarking."
        },
        {
          "name": "Backbone Models",
          "description": "Qwen2.5-7B-Instruct and Llama-3.1-8B-Instruct (used for both agents and the evaluator)."
        },
        {
          "name": "LoRA & vLLM",
          "description": "Used for efficient fine-tuning and high-throughput serving of the agents."
        }
      ]
    },
    "5": {
      "title": "Benchmarks & Datasets",
      "items": [
        {
          "name": "WebArena",
          "description": "812 web-automation tasks across five domains (Shopping, Reddit, GitLab, Map, and OpenStax)."
        },
        {
          "name": "ToolBench",
          "description": "500 API-chaining tasks used for cross-benchmark validation."
        },
        {
          "name": "SWE-bench",
          "description": "Used to demonstrate that the performance gains from AdaRubric-based training transfer to complex software engineering tasks (+4.9 pp improvement)."
        }
      ]
    },
    "6": {
      "title": "Quantitative Results (WebArena)",
      "table": {
        "headers": [
          "Metric",
          "Base (Zero-shot)",
          "Prometheus (DPO)",
          "GPT-4 Direct",
          "AdaRubric-DA"
        ],
        "rows": [
          [
            "Human Correlation (Pearson r)",
            "-",
            "0.61",
            "0.64",
            "0.79"
          ],
          [
            "Reliability (\u03b1)",
            "-",
            "0.71",
            "0.69",
            "0.85"
          ],
          [
            "Task Success Rate (SR%)",
            "12.3%",
            "21.0%",
            "-",
            "27.8%"
          ],
          [
            "PPO SR% (at 5K steps)",
            "-",
            "23.6%",
            "21.3%",
            "30.2%"
          ]
        ]
      }
    }
  }
}

---

### 10. Environment Maps: Structured Environmental Representations for Long ...
**URL:** https://arxiv.org/html/2603.23610v2  
**Latency:** 2862.5s  

{
  "paper": {
    "title": "Environment Maps: Structured Environmental Representations for Long-Horizon Agents",
    "arXiv": "2603.23610v2"
  },
  "summary": {
    "key_findings": [
      {
        "Superiority of Structured Knowledge: Environment Maps (EMs) provide a more effective, agent-agnostic substrate for web automation than raw trajectory data or \"no prior knowledge\" baselines.": {
          "Superiority of Structured Knowledge": true
        }
      },
      {
        "Significant Success Gains: Access to EMs improved overall task success rates by 99.1% relative to the baseline (increasing from 14.2% to 28.2%) without requiring model retraining.": {
          "relative_improvement": 99.1,
          "baseline": 14.2,
          "em": 28.2
        }
      },
      {
        "Complexity Resilience: The largest performance leaps occurred in high-branching, complex environments (e.g., GitLab and CMS) where explicit navigation schemas are critical.": {
          "examples": [
            "GitLab",
            "CMS"
          ]
        }
      },
      {
        "Enhanced Efficiency: EMs led to more targeted tool use, fewer total network requests, and a reduction in the mean number of steps required to complete tasks.": {}
      },
      {
        "Generalization: EMs improved performance even on tasks that were not explicitly demonstrated in the initial trajectory data.": {}
      }
    ],
    "methodologies": {
      "environment_map_framework": {
        "components": [
          "Contexts: Abstracted page locations and view types.",
          "Actions: Parameterized interaction affordances.",
          "Workflows: Sequences of steps representing successful trajectories.",
          "Tacit Knowledge: Domain-specific definitions and reusable procedural logic."
        ]
      },
      "creation_pipeline": [
        "1. Unified Step Sequence: Parsing DOM snapshots and screenshots into a step workflow.",
        "2. Action Extraction: Identifying raw actions taken during navigation.",
        "3. Action Generalization: Using LLMs to abstract specific actions into reusable patterns.",
        "4. Context & Knowledge Extraction: Identifying distinct site sections and procedural rules.",
        "5. Integration & Merging: Deterministically assembling and deduplicating data into a final JSON map."
      ]
    },
    "metrics": [
      "Task Success Rate: Binary completion score verified through environment state.",
      "Mean Steps: Average actions taken per task.",
      "Tool Calls per Task: Frequency of the agent querying the Environment Map.",
      "Backtracking Rate: Derived from HTTP Archive (HAR) traces to measure navigation efficiency.",
      "Network Request Volume: Total data requests made during task execution."
    ],
    "tools_and_frameworks": {
      "claude_agent_sdk": "powered by claude-sonnet-4-5",
      "playwright": "Used for capturing accessibility trees and recording human trace data.",
      "har": "Utilized for deterministic, reproducible evaluation via trace inspection.",
      "file_query_tools": [
        "Read",
        "Grep",
        "Glob"
      ]
    },
    "benchmarks_and_datasets": {
      "webarena": "A realistic web environment featuring 812 tasks across five domains (E-commerce, Reddit-like Forum, GitLab, CMS/Admin, and Maps).",
      "webarena_verified": "A specialized evaluation framework that uses trace-based verification for higher reliability.",
      "human_trajectory_dataset": "A set of 179 task recordings released with WebArena, used as the raw input for building the Environment Maps."
    },
    "quantitative_results": {
      "table": [
        {
          "Metric": "Overall Success Rate",
          "Baseline (No Map)": "14.2%",
          "Trajectory Access": "23.3%",
          "Environment Map (EM)": "28.2%"
        },
        {
          "Metric": "GitLab Success",
          "Baseline (No Map)": "8.3%",
          "Trajectory Access": "11.7%",
          "Environment Map (EM)": "22.8%"
        },
        {
          "Metric": "CMS Success",
          "Baseline (No Map)": "11.5%",
          "Trajectory Access": "15.4%",
          "Environment Map (EM)": "22.5%"
        },
        {
          "Metric": "Mean Steps",
          "Baseline (No Map)": 20,
          "Trajectory Access": 19.5,
          "Environment Map (EM)": 18.5
        },
        {
          "Metric": "Network Requests",
          "Baseline (No Map)": 892,
          "Trajectory Access": "-",
          "Environment Map (EM)": 707
        }
      ]
    },
    "implementation_details": {
      "construction_cost": {
        "tokens": "$1\u2013$4",
        "time": "13\u201331 minutes per environment"
      },
      "interpretability": "Unlike neural memory, EMs are human-readable JSON files that can be manually edited or audited to correct agent behavior."
    }
  }
}

---
