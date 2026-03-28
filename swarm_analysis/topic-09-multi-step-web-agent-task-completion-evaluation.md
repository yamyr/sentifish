# Topic 9: multi-step web agent task completion evaluation

**Search latency:** 219.4s  
**Results found:** 10  
**Pages analyzed:** 10  
**Successful analyses:** 6  
**Total content:** 25,171 chars  

## Search Results

| Rank | Title | URL |
|------|-------|-----|
| 1 | What is agent evaluation? How to test agents with tasks, sim | https://www.braintrust.dev/articles/agent-evaluation |
| 2 | Agent Evaluation: How to Test and Measure Agentic AI Perform | https://machinelearningmastery.com/agent-evaluation-how-to-test-and-measure-agen |
| 3 | LLM Agent Evaluation: Assessing Tool Use, Task Completion, A | https://www.confident-ai.com/blog/llm-agent-evaluation-complete-guide |
| 4 | A Hitchhiker's Guide to Agent Evaluation | ICLR Blogposts 20 | https://iclr-blogposts.github.io/2026/blog/2026/agent-evaluation/ |
| 5 | Agent Factory Recap: A Deep Dive into Agent Evaluation, Prac | https://cloud.google.com/blog/topics/developers-practitioners/agent-factory-reca |
| 6 | Multi-Step AI Agent Evaluation: Metrics, Best Practices - al | https://www.alecor.net/content/2026/02/08/multi-step-ai-agent-evaluation.html |
| 7 | Demystifying evals for AI agents \ Anthropic | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents |
| 8 | Evaluating AI agents: Real-world lessons from building agent | https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-le |
| 9 | AI Agent Evaluation: Key Methods & Insights | Galileo | https://galileo.ai/blog/ai-agent-evaluation |
| 10 | MultiAgentBench: Evaluating the Collaboration and Competitio | https://arxiv.org/abs/2503.01935 |

## Page Analyses

### 1. What is agent evaluation? How to test agents with tasks, simulations ...
**URL:** https://www.braintrust.dev/articles/agent-evaluation  
**Latency:** 277.0s  

{
  "summary": {
    "title": "Multi-Step Web Agent Task Completion Evaluation from Braintrust Article",
    "sections": [
      {
        "heading": "1. Key Findings",
        "points": [
          "Process vs. Outcome: Evaluating agents requires looking beyond the final answer to the sequence of decisions, including tool selection, parameter accuracy, and intermediate transitions.",
          "Workflow Execution: Unlike standard LLM evals, agent evaluation measures the ability to execute across an entire multi-step workflow.",
          "Non-Determinism: Agents are inherently non-deterministic; evaluation must account for this by running multiple trials per task to ensure reliability.",
          "Integration: Evaluation should be a continuous loop from development (offline evals) to production (online monitoring and tracing)."
        ]
      },
      {
        "heading": "2. Methodologies",
        "points": [
          "Task-Based Evaluation: Using fixed test cases with specific inputs and clear success criteria (unit tests for agents vs. end-to-end workflows).",
          "Simulations:",
          "LLM-Driven User Personas: Using a separate LLM to simulate a user interacting with the agent.",
          "Sandboxed Environments: Running agents in replicas of production infrastructure to safely test tool execution.",
          "Fault Injection: Deliberately introducing API failures or incorrect data to test the agent\u2019s resilience and recovery.",
          "Human-in-the-Loop: Using human graders for calibrating model-based scorers, spot-checking high-risk scenarios, and providing a \"gold standard\" for quality."
        ]
      },
      {
        "heading": "3. Metrics for Agent Evaluation",
        "points": [
          "Effectiveness: Task success rate (goal achievement) and tool selection accuracy.",
          "Efficiency: Step efficiency (minimizing redundant actions), cost (tokens/API calls per task), and end-to-end latency.",
          "Technical Precision: Parameter correctness (validity of tool arguments).",
          "Robustness: Recovery and resilience (handling tool failures or errors).",
          "Safety: Compliance with policy boundaries and unauthorized data access prevention."
        ]
      },
      {
        "heading": "4. Tools & Frameworks",
        "points": [
          "Braintrust: An integrated platform for managing the evaluation lifecycle:",
          "Dataset Management: Creating \"golden datasets\" from real scenarios.",
          "Evaluation Harness: Running agents against datasets and applying scores.",
          "Scorers: Utilizing code-based (regex, binary) and model-based (LLM-as-a-judge) grading.",
          "Observability: Tracing, playgrounds for iteration, and monitoring dashboards for production traffic.",
          "CI/CD: Integration via GitHub Actions to block regressions during deployment."
        ]
      },
      {
        "heading": "5. Benchmarks & Datasets",
        "points": [
          "Golden Datasets: Curated sets of real-world scenarios with expected outcomes.",
          "Production Snapshots: Using anonymized production data to create realistic simulation environments.",
          "Task Datasets: Collections of clear inputs paired with verifiable success criteria."
        ]
      },
      {
        "heading": "6. Success Criteria Definition",
        "points": [
          "Measurable Terms: Success is defined by specific database updates, verified tool call sequences, or correct final outputs.",
          "Grader Types:",
          "Code-based: For objective, binary checks (e.g., string matching).",
          "Model-based: For subjective or open-ended outputs using rubrics or natural language assertions.",
          "Human: For high-stakes calibration."
        ]
      },
      {
        "heading": "7. Quantitative Examples",
        "points": [
          "While the article does not provide specific performance benchmarks for a particular model, it illustrates how to measure:",
          "Cost: e.g., \"$0.03 per successful resolution.\"",
          "Latency: e.g., \"8 seconds end-to-end.\"",
          "Success: Binary pass/fail or weighted scoring across multiple criteria."
        ]
      }
    ]
  }
}

---

### 2. Agent Evaluation: How to Test and Measure Agentic AI Performance
**URL:** https://machinelearningmastery.com/agent-evaluation-how-to-test-and-measure-agentic-ai-performance/  
**Latency:** 1634.6s  

*No content extracted.*

---

### 3. LLM Agent Evaluation: Assessing Tool Use, Task Completion, Agentic ...
**URL:** https://www.confident-ai.com/blog/llm-agent-evaluation-complete-guide  
**Latency:** 1634.6s  

*No content extracted.*

---

### 4. A Hitchhiker's Guide to Agent Evaluation | ICLR Blogposts 2026
**URL:** https://iclr-blogposts.github.io/2026/blog/2026/agent-evaluation/  
**Latency:** 1634.6s  

*No content extracted.*

---

### 5. Agent Factory Recap: A Deep Dive into Agent Evaluation, Practical ...
**URL:** https://cloud.google.com/blog/topics/developers-practitioners/agent-factory-recap-a-deep-dive-into-agent-evaluation-practical-tooling-and-multi-agent-systems  
**Latency:** 628.3s  

{
  "multi_step_web_agent_task_completion_evaluation": {
    "key_findings": [
      {
        "Systemic Evaluation": "Agent evaluation must shift from assessing static LLM outputs to evaluating dynamic system behavior, including autonomy, reasoning, tool utilization, and resilience in unpredictable environments."
      },
      {
        "Non-Deterministic Nature": "Traditional software testing is insufficient due to the non-deterministic nature of agents; evaluation requires a \"full-stack\" measurement approach across multiple layers."
      },
      {
        "The Calibration Loop": "The most effective strategy involves a feedback loop where human expertise creates a \"golden dataset\" to calibrate LLM-as-a-judge models, which then scale the evaluation process."
      }
    ],
    "methodologies": {
      "four_layer_measurement_approach": [
        {
          "layer": "Final Outcome",
          "description": "Accuracy, safety, and coherence of the goal achieved."
        },
        {
          "layer": "Chain of Thought (Reasoning)",
          "description": "Verifying the logical steps taken to ensure the correct answer wasn't reached by chance."
        },
        {
          "layer": "Tool Utilization",
          "description": "Correct selection, parameter passing, and efficiency (avoiding redundant calls)."
        },
        {
          "layer": "Memory & Context",
          "description": "Retention of information across steps and resolution of knowledge conflicts."
        }
      ],
      "three_tier_testing_framework": [
        {
          "tier": "Tier 1 (Unit Tests)",
          "description": "Isolated component testing (e.g., individual tool functions)."
        },
        {
          "tier": "Tier 2 (Integration Tests)",
          "description": "Evaluating the entire multi-step journey of a single agent."
        },
        {
          "tier": "Tier 3 (End-to-End/Human Review)",
          "description": "High-level judgment on complex tasks and multi-agent system (MAS) interactions."
        }
      ],
      "synthetic_data_generation_recipe": "A 4-step process to solve the \"cold start\" problem: 1. Generate Tasks, 2. Create Perfect Solutions, 3. Generate Imperfect Attempts, 4. Score Automatically."
    },
    "metrics": {
      "quality_metrics": "Coherence of plans, factual accuracy, and safety/absence of hallucinations.",
      "operational_metrics": "Tool selection correctness, parameter accuracy, API call efficiency, and context recall consistency.",
      "process_metrics": "Logical consistency in reasoning steps (Chain of Thought)."
    },
    "tools_frameworks": [
      {
        "name": "Agent Development Kit (ADK)",
        "description": "A practical toolkit used for interactive testing, defining \"Golden Paths,\" and debugging during development."
      },
      {
        "name": "Vertex AI Gen AI Evaluation",
        "description": "Used for the \"outer loop\" to run large-scale evaluations in production with rich metrics and monitoring dashboards."
      },
      {
        "name": "Trace View",
        "description": "A diagnostic tool within the ADK to identify the root cause of failures in the agent's reasoning or tool use."
      }
    ],
    "benchmarks_datasets": {
      "benchmarks": "Mentions AgentBench as a relevant benchmark for agent performance. The post also highlights challenges with benchmark integrity (data leakage).",
      "golden_dataset": "A set of expert-verified \"perfect\" agent trajectories used as a ground truth for calibrating automated evaluators.",
      "golden_path": "A specific methodology where developers define the ideal sequence of steps for a task to serve as a test case."
    },
    "quantitative_results": "The post focuses primarily on the methodological frameworks and tooling architectures rather than providing specific performance percentages or leaderboard scores for particular models. It emphasizes that evaluation is a continuous process of narrowing the gap between automated scores and human judgment."
  }
}

---

### 6. Multi-Step AI Agent Evaluation: Metrics, Best Practices - alecor.net
**URL:** https://www.alecor.net/content/2026/02/08/multi-step-ai-agent-evaluation.html  
**Latency:** 537.9s  

{
  "title": "Multi-Step AI Agent Evaluation: Metrics, Best Practices",
  "summary": {
    "key_findings": [
      {
        "Evaluation as a Core Requirement": "Robust evaluation is essential for tuning multi-step agents, optimizing reasoning chains, and ensuring reliability, safety, and real-world utility."
      },
      {
        "Success vs. Fidelity Trade-off": "High plan correctness reduces error propagation, while high task success ensures goal completion. A combination of both metrics is necessary to guide deployment trade-offs."
      },
      {
        "Complexity of Multi-step Tasks": "Agents require a layered evaluation approach because errors can compound over multiple steps, requiring assessment at both the individual step level and the overall trajectory level."
      }
    ],
    "methodologies": [
      "Layered Evaluation Framework:\n    *   Plan/Reasoning Quality: Assessing logical coherence, step validity, and goal alignment.\n    *   Execution Quality: Measuring final task success, adherence to constraints, and robustness.\n    *   Operational Metrics: Evaluating performance in production (latency, throughput, cost).",
      "Step-Level Evaluation: Analyzing per-step accuracy, action relevance, and reasoning consistency to identify exactly where a chain of thought might break.",
      "Trajectory and Plan Evaluation: Comparing agent-generated paths to reference or \"gold-standard\" trajectories using similarity and alignment measures.",
      "Continuous/Online Evaluation: Implementing A/B testing, canary deployments, and drift detection to monitor performance after deployment.",
      "Safety and Alignment: Testing for hallucinations, faithfulness to facts, and adherence to safety guidelines."
    ],
    "metrics": {
      "task_success": [
        "Completion rate, error rate, and reward achievement."
      ],
      "efficiency": [
        "Latency, compute cost, and throughput."
      ],
      "quality": [
        "Logical coherence, step-level accuracy, action relevance, and factual grounding (semantic/embedding-based evaluation)."
      ],
      "operational": [
        "Scalability, resource usage, and cost per task."
      ],
      "user_centric": [
        "Satisfaction scores and efficiency in meeting user goals."
      ]
    },
    "tools_frameworks": "The page discusses general evaluation workflows but does not name specific third-party tools (e.g., LangSmith, W&B).",
    "benchmarks_datasets": "No specific benchmarks (like WebShop or Mind2Web) or datasets are explicitly listed on this page; the focus is on the criteria and best practices for evaluation rather than specific test suites.",
    "quantitative_results": "The article provides a theoretical and methodological overview and does not include specific quantitative results or performance data from experimental trials."
  }
}

---

### 7. Demystifying evals for AI agents \ Anthropic
**URL:** https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents  
**Latency:** 350.9s  

{
  "6": {
    "title": "Quantitative Results",
    "points": [
      "State-of-the-Art Progress: Coding agent performance on **SWE-bench Verified** improved from **40% to >80%** success rate within a single year.",
      "Scaffolding Sensitivity: On **CORE-Bench**, Claude 3.5 Opus's initial score of **42%** jumped to **95%** simply by fixing rigid grading bugs and using a less constrained agent scaffold, highlighting how sensitive evals are to implementation details."
    ]
  },
  "title": "Research Summary: Demystifying Evals for AI Agents",
  "source": "Anthropic engineering article 'Demystifying evals for AI agents'",
  "focus": "Complexities of evaluating multi-step, autonomous agents",
  "sections": {
    "1": {
      "title": "Key Findings",
      "points": [
        "Evaluation Paradox: The same traits that make agents valuable\u2014autonomy, flexibility, and tool-use\u2014make them difficult to evaluate because they don't follow a linear path.",
        "Non-Determinism: Agent behavior is inherently non-deterministic. Identical inputs can lead to different trajectories, requiring probabilistic metrics like $pass@k$ rather than simple binary success rates.",
        "The \"Swiss Cheese\" Model: No single evaluation method (automated, human, or production monitoring) is perfect. A robust strategy requires layering multiple types of evals to catch different failure modes.",
        "Eval-Driven Development: Evaluations should be built *before* or alongside agent capabilities to define success criteria and accelerate the development loop."
      ]
    },
    "2": {
      "title": "Methodologies",
      "points": [
        "Multi-Turn Agent Evaluations: Moving beyond single-turn prompt/response to evaluate long-running sequences involving tool use and environment state changes.",
        "Hybrid Grading:",
        "Code-based: Best for objective truths (e.g., \"Is the file on the disk?\").",
        "Model-based: Uses an LLM (often with a rubric) to judge subjective quality or complex natural language assertions.",
        "Human-in-the-loop: Critical for establishing \"ground truth\" through SME reviews, crowdsourcing, or transcript spot-checks.",
        "Capability vs. Regression Evals: Capability evals push the agent's boundaries (starting with low pass rates), while regression evals ensure core stability (aiming for ~100% pass rate)."
      ]
    },
    "3": {
      "title": "Metrics",
      "subsections": {
        "Success Metrics": [
          "$pass@k$: Probability that an agent succeeds at least once in $k$ attempts.",
          "$pass^k$: Probability that an agent succeeds in all $k$ trials (measures reliability)."
        ],
        "Efficiency Metrics": [
          "$N_turns$ / $N_toolcalls$: Number of steps or actions taken to complete a task.",
          "$N_total_tokens$: Total cost/resource consumption of the trajectory."
        ],
        "Performance Metrics": "Latency (Time to First Token, tokens/sec), error rates, and cost per task."
      }
    },
    "4": {
      "title": "Tools and Frameworks",
      "points": [
        "Harbor: A framework for running agents in containerized environments with scalable infrastructure for trials.",
        "Braintrust: An ecosystem for offline evaluation, experiment tracking, and production observability.",
        "LangSmith / Langfuse: Tools for tracing agent execution, managing datasets, and conducting offline/online evals.",
        "Arize (Phoenix/AX): Open-source platform for LLM tracing, debugging, and systematic evaluation."
      ]
    },
    "5": {
      "title": "Benchmarks and Datasets",
      "subsections": {
        "Coding & Technical": [
          "SWE-bench Verified: Evaluating agents on real-world GitHub issues by running test suites.",
          "Terminal-Bench: End-to-end technical tasks (e.g., training ML models, kernel builds)."
        ],
        "Conversational & Multi-step": [
          "$\\tau$-Bench / $\\tau^2$-Bench: Multi-turn interactions in retail, airline, and complex cross-domain environments."
        ],
        "Web & OS Navigation": [
          "WebArena / BrowseComp: Browser-based tasks requiring information retrieval and UI interaction.",
          "OSWorld: Full operating system control, inspecting file systems and application states."
        ]
      }
    }
  }
}

---

### 8. Evaluating AI agents: Real-world lessons from building agentic systems ...
**URL:** https://aws.amazon.com/blogs/machine-learning/evaluating-ai-agents-real-world-lessons-from-building-agentic-systems-at-amazon/  
**Latency:** 1634.6s  

*No content extracted.*

---

### 9. AI Agent Evaluation: Key Methods & Insights | Galileo
**URL:** https://galileo.ai/blog/ai-agent-evaluation  
**Latency:** 1087.0s  

{
  "title": "Multi-Step Web Agent Task Completion Evaluation",
  "summary": "Structured summary from Galileo blog post on research findings, methodologies, metrics, tools, benchmarks, and quantitative results",
  "sections": {
    "1_key_findings": {
      "maturity_gap": "While 72% of organizations have deployed agents, only 11% have reached production scale, and only 6% fully trust agents for core business processes.",
      "elite_advantage": "Elite teams (top 15%) achieve 2.2x better reliability than others by treating evaluation as a continuous discipline rather than a one-time checklist.",
      "sustainability_risk": "Gartner predicts over 40% of agentic AI projects will be canceled by 2027 due to the complexity of scaling and maintaining reliability.",
      "consistency_drop": "Agent success rates can drop from 60% to 25% when measured for consistency across multiple runs, highlighting the non-deterministic nature of multi-step agents."
    },
    "2_methodologies": {
      "front_loaded_evaluation": "Success criteria are defined before development begins, treating evals as specifications.",
      "continuous_improvement_loop": "Creating new evaluation cases from every production failure to prevent regressions.",
      "agentic_trajectory_analysis": "Moving beyond input/output evaluation to analyze the entire chain of decisions (the trajectory) an agent takes.",
      "probabilistic_monitoring": "Using specialized AI observability tools rather than traditional APM, which often fails to catch silent logic failures in agents."
    },
    "3_metrics": {
      "agent_specific_metrics": {
        "tool_selection_quality": "Accuracy of tool choice and parameter correctness.",
        "action_advancement": "Progress toward a user goal (clarifications, confirmations, etc.).",
        "agent_flow": "Coherence and correctness of the decision-making trajectory.",
        "action_completion": "Final success rate in accomplishing all user goals."
      },
      "clear_framework": "Evaluates Cost, Latency, Efficiency, Assurance, and Reliability.",
      "operational_metrics": "Agent efficiency (steps taken), reasoning coherence, and toxicity/PII detection rates."
    },
    "4_tools_and_frameworks": {
      "galileo_agent_observability_platform": "Provides specialized metrics and real-time dashboards for agentic workflows.",
      "luna_slm_evaluators": "Specialist small language models fine-tuned to evaluate tool calls and agent responses at a lower cost than frontier models.",
      "ci_cd_quality_gates": "Integration of automated evaluation runs into the deployment pipeline (practiced by 92% of elite teams).",
      "runtime_protection": "Intercepting risky agent actions in real-time before they execute."
    },
    "5_benchmarks_and_datasets": {
      "capability_gap_benchmark": "Humans achieve a 78% completion rate on multi-step browser interaction tasks, while early GPT-4 based agents achieve only 14%.",
      "cost_benchmark": "There is a documented 50x cost variability for achieving similar precision levels; accuracy-optimized configurations can be 4x-10x more expensive than Pareto-efficient ones.",
      "detection_accuracy": "Novel frameworks can detect tool-calling hallucinations with 72.7% to 86.4% accuracy.",
      "datasets": "The methodology emphasizes using real production failures as the primary source for building high-value evaluation datasets."
    },
    "6_quantitative_results_summary": {
      "table": [
        {
          "metric": "Organization Trust in Agents",
          "value": "6%"
        },
        {
          "metric": "Reliability Improvement (Elite Teams)",
          "value": "2.2x"
        },
        {
          "metric": "Teams Integrating Evals in CI/CD",
          "value": "92%"
        },
        {
          "metric": "Completion Rate (Browser Tasks)",
          "value": "14% (Agents) vs 78% (Humans)"
        },
        {
          "metric": "Teams Relying on Human Verification",
          "value": "74%"
        }
      ]
    }
  }
}

---

### 10. MultiAgentBench: Evaluating the Collaboration and Competition of LLM agents
**URL:** https://arxiv.org/abs/2503.01935  
**Latency:** 902.4s  

{
  "paper": {
    "title": "MultiAgentBench: Evaluating the Collaboration and Competition of LLM agents",
    "arxiv": "2503.01935"
  },
  "key_findings": [
    {
      "framework": "MARBLE framework rigorously evaluates LLM-based multi-agent systems across diverse interactive scenarios, capturing both collaborative and competitive dynamics."
    },
    {
      "model_performance": "gpt-4o-mini consistently achieved the highest Task Scores in Research (84.13%) and Coding (65.10%), while Meta-Llama-3.3-70B excelled in Coordination and specific complex tasks like Database error fixing and the Werewolf game."
    },
    {
      "strategy_impact": "Cognitive Evolving Planning improves milestone achievement rates by 3% and demonstrates superior coordination. Conversely, group discussions often resulted in the lowest scores across metrics."
    },
    {
      "coordination_protocols": "The graph-based protocol outperformed others (star, tree, chain) in research scenarios regarding task performance, planning efficiency, and token usage."
    },
    {
      "agent_scaling": "Increasing the number of agents generally leads to a decrease in overall Key Performance Indicators (KPIs), suggesting a trade-off between collaborative complexity and execution performance."
    },
    {
      "emergent_behavior": "In competitive scenarios like Werewolf, models like Llama-3.3-70B showed emergent strategic behaviors (trust-building, strategic use of roles) that allowed them to outperform stronger baselines like gpt-4o."
    }
  ],
  "methodologies": {
    "marble_framework": {
      "coordination_engine": "Synchronizes agent graphs and cognitive modules.",
      "cognitive_module": "Manages internal states, personas, and reasoning (CoT, ReACT).",
      "communication_module": "Handles inter-agent interactions and profile maintenance.",
      "environment_memory_modules": "Simulates scenarios and provides dynamic knowledge access via RAG."
    },
    "coordination_protocols": {
      "star": "Central planner with strong oversight.",
      "tree": "Hierarchical delegation for scalability.",
      "graph_mesh": "Interconnected actors with concurrent planning.",
      "chain": "Sequential handoffs for dependent tasks."
    },
    "planning_strategies": [
      "Vanilla prompting",
      "Chain-of-Thought (CoT)",
      "Group Discussion",
      "Cognitive Self-Evolving Planning (which compares actual outcomes with expectations to adjust future plans)"
    ]
  },
  "evaluation_metrics": {
    "task_completion_performance": {
      "kpi": "Measures milestone progress (ratio of milestones achieved to total).",
      "ts": "Final output quality evaluated via LLM-defined rubrics or rule-based accuracy."
    },
    "coordination_metrics": {
      "cscore": "5-point LLM-based scale assessing the quality of inter-agent dialogue.",
      "pscore": "5-point LLM-based scale assessing role maintenance and strategy adaptation.",
      "cs": "The average of Cscore and Pscore."
    },
    "scenario_specific": [
      "Villager Win Rate and Net Score for Werewolf",
      "Hit Rate of correct block placement for Minecraft"
    ]
  },
  "tools": [
    "MARBLE (the primary backbone)",
    "Mineflayer (Minecraft interaction)",
    "PostgreSQL (database diagnosis)"
  ],
  "benchmarks": [
    {
      "name": "Research",
      "description": "Co-authoring a research proposal."
    },
    {
      "name": "Minecraft",
      "description": "Collaborative construction of structures."
    },
    {
      "name": "Database",
      "description": "Diagnosing system inconsistencies."
    },
    {
      "name": "Coding",
      "description": "Solving structured programming challenges."
    },
    {
      "name": "Werewolf",
      "description": "Competitive game involving deception and collective inference."
    },
    {
      "name": "Bargaining",
      "description": "Dynamic negotiations over shared resources."
    }
  ],
  "datasets": [
    {
      "scenario": "Research",
      "details": "100 curated ML/AI papers from the ResearchTown dataset."
    },
    {
      "scenario": "Coding",
      "details": "Tasks adapted from the SRDD dataset."
    },
    {
      "scenario": "Bargaining",
      "details": "100 products sampled from an Amazon products dataset."
    },
    {
      "scenario": "Minecraft",
      "details": "100 target structures adapted from VillagerAgent."
    },
    {
      "scenario": "Werewolf",
      "details": "100 distinct game archives (saved states) showcasing various configurations."
    }
  ],
  "quantitative_results": [
    {
      "scenario": "Research",
      "metric": "Task Score (TS)",
      "gpt-4o-mini": "84.13%",
      "Llama-3.3-70B": "80.60%",
      "gpt-3.5-turbo": "68.41%"
    },
    {
      "scenario": "Research",
      "metric": "Coordination (CS)",
      "gpt-4o-mini": "68.60%",
      "Llama-3.3-70B": "72.00%",
      "gpt-3.5-turbo": "68.30%"
    },
    {
      "scenario": "Database",
      "metric": "Task Score (TS)",
      "gpt-4o-mini": "37.00%",
      "Llama-3.3-70B": "53.00%",
      "gpt-3.5-turbo": "43.00%"
    },
    {
      "scenario": "Coding",
      "metric": "Task Score (TS)",
      "gpt-4o-mini": "65.10%",
      "Llama-3.3-70B": "46.10%",
      "gpt-3.5-turbo": "46.00%"
    },
    {
      "scenario": "Werewolf",
      "metric": "Win Rate",
      "gpt-4o-mini": "24.73%",
      "Llama-3.3-70B": "35.11%",
      "gpt-3.5-turbo": "N/A"
    }
  ],
  "additional_notes": "Ablation analysis showed that peak coordination (CS) is often reached around 7 iterations, after which performance may plateau or drop due to complexity."
}

---
