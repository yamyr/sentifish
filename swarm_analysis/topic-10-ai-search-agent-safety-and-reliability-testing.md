# Topic 10: AI search agent safety and reliability testing

**Search latency:** 157.1s  
**Results found:** 10  
**Pages analyzed:** 10  
**Successful analyses:** 6  
**Total content:** 23,783 chars  

## Search Results

| Rank | Title | URL |
|------|-------|-----|
| 1 | Guide to AI Agent Testing | Salesforce | https://www.salesforce.com/agentforce/ai-agents/testing/ |
| 2 | OpenAgentSafety: A Comprehensive Framework for Evaluating Re | https://arxiv.org/abs/2507.06134 |
| 3 | AI Agent Testing Tools: Ensure Reliability, Safety, and Perf | https://wedge.ai/ai-agent-testing-tools-ensure-reliability-safety-and-performanc |
| 4 | How to Test an AI Agent: Checklist & Evaluation Guide | https://www.softude.com/blog/how-to-test-an-ai-agent-checklist-guide/ |
| 5 | AI Agent Testing & Safety Platform - Prevent Chatbot Failure | https://inspectagents.com/ |
| 6 | Exploring Effective Testing Frameworks for AI Agents in Real | https://www.getmaxim.ai/articles/exploring-effective-testing-frameworks-for-ai-a |
| 7 | Framework for Testing AI Agents: The 30-Point Agentic Reliab | https://ai-reliability.institute/research/agentic-ai-reliability-checklist.html |
| 8 | Awesome AI Agent Testing - GitHub | https://github.com/chaosync-org/awesome-ai-agent-testing |
| 9 | OWASP AI Testing Guide | https://owasp.org/www-project-ai-testing-guide/ |
| 10 | SafeSearch: Automated Red-Teaming for the Safety of LLM-Base | https://openreview.net/forum?id=f2ZiFnZEQA |

## Page Analyses

### 1. Guide to AI Agent Testing | Salesforce
**URL:** https://www.salesforce.com/agentforce/ai-agents/testing/  
**Latency:** 1707.7s  

*No content extracted.*

---

### 2. OpenAgentSafety: A Comprehensive Framework for Evaluating Real-World AI ...
**URL:** https://arxiv.org/abs/2507.06134  
**Latency:** 1707.7s  

*No content extracted.*

---

### 3. AI Agent Testing Tools: Ensure Reliability, Safety, and Performance
**URL:** https://wedge.ai/ai-agent-testing-tools-ensure-reliability-safety-and-performance/  
**Latency:** 1299.0s  

{
  "title": "AI search agent safety and reliability testing",
  "source": "Wedge AI",
  "sections": [
    {
      "section": "1. Key Findings",
      "points": [
        "Unpredictability: AI agents are inherently more unpredictable than conventional software because they reason, plan, and act independently.",
        "Trust at Scale: While building agents is becoming easier, deploying them at scale requires a robust testing infrastructure to prevent hallucinations, silent failures, or harmful outputs.",
        "Critical Need: Testing is essential to ensure agents use tools responsibly and maintain context throughout multi-step tasks."
      ]
    },
    {
      "section": "2. Methodologies for Testing",
      "points": [
        "Prompt Accuracy Testing: Ensuring instructions are parsed and followed correctly.",
        "Tool Execution Testing: Verifying that external tools (APIs, parsers) are used properly and only when necessary.",
        "Multi-step Reasoning Testing: Checking if the agent stays on track during complex, long-running tasks.",
        "Memory Consistency Testing: Assessing the agent's ability to retain or discard relevant context appropriately.",
        "Failure Handling: Testing how the agent responds to broken tools, API timeouts, or ambiguous instructions.",
        "Adversarial Testing (Red Teaming): Exposing agents to adversarial prompts to identify bias, safety risks, or catastrophic failure points.",
        "Synthetic Data Stress Testing: Using controlled, synthetic inputs to evaluate reasoning and fallback logic."
      ]
    },
    {
      "section": "3. Metrics for Evaluation",
      "points": [
        "Performance: Latency, throughput, and token usage.",
        "Quality: Factual correctness, usefulness, and output safety.",
        "Behavioral: Prompt accuracy, tool execution correctness, and reasoning consistency.",
        "Subjective/LLM-based: Helpfulness, relevance, and task-specific scoring (e.g., for summarization or QA)."
      ]
    },
    {
      "section": "4. Tools and Frameworks",
      "points": [
        "LangSmith (LangChain): Provides observability, performance tracking, and automated testing for LLM-powered applications.",
        "PromptLayer: Focuses on logging, tracking, and versioning prompt/LLM interactions.",
        "Helicone: An open-source middleware proxy used for tracking, logging, and debugging agent usage.",
        "TruLens: An open-source framework specifically designed to evaluate LLM applications using feedback functions and scoring metrics.",
        "Reka Evaluation Studio: A platform for benchmarking agent behaviors and comparing the quality of different outputs."
      ]
    },
    {
      "section": "5. Benchmarks and Datasets",
      "points": [
        "Custom Datasets: The page highlights the use of custom or crowd-sourced datasets within platforms like Reka Evaluation Studio to benchmark specific agent behaviors.",
        "Performance Datasets: Integration with LangSmith allows for testing against established datasets to measure regression in performance or accuracy."
      ]
    },
    {
      "section": "6. Quantitative Results",
      "points": [
        "The page provides a framework for testing and lists several tools but does not include specific quantitative results (e.g., specific percentage improvements or benchmark scores) from a particular study."
      ]
    }
  ]
}

---

### 4. How to Test an AI Agent: Checklist & Evaluation Guide
**URL:** https://www.softude.com/blog/how-to-test-an-ai-agent-checklist-guide/  
**Latency:** 690.6s  

{
  "key_findings": [
    "Beyond Accuracy: Effective testing must evaluate more than just technical correctness; it must include usefulness, reliability, and user enjoyment.",
    "Continuous Evaluation: Testing is not a one-time event; it requires continuous monitoring and real-world data collection post-deployment to refine behavior.",
    "Safety is Paramount: Identifying vulnerabilities like \"jailbreaking\" and toxic outputs through rigorous red-teaming is critical for enterprise-grade agents."
  ],
  "methodologies": {
    "core_testing_levels": [
      "Unit Testing: Focuses on intent recognition, entity extraction, and backend integrations.",
      "Functional Testing: End-to-end validation of integrated components and conversational flows.",
      "Load & Stress Testing: Measuring response times, API performance, and scalability under high traffic."
    ],
    "user_centric_testing": [
      "Usability Testing: Direct feedback on intuition and ease of use.",
      "A/B Testing: Comparing different response styles or logic flows to optimize engagement."
    ],
    "openai_validation_framework": [
      "Red-Teaming: Human and automated attempts to provoke harmful behaviors.",
      "Pre-Deployment Partnerships: Domain-specific testing in virtual environments with external partners.",
      "Agent-Specific Task Evaluations: Testing autonomous, multi-step tasks using tools like coding or research."
    ]
  },
  "metrics": {
    "performance": [
      "Accuracy (% correct), completion rates, and conversion rates."
    ],
    "reliability": [
      "Similarity of responses across runs (consistency) and error rates."
    ],
    "efficiency": [
      "Response time under load and API performance."
    ],
    "experience": [
      "User satisfaction scores and ease-of-use ratings."
    ]
  },
  "tools_frameworks": {
    "general_automation": [
      "Pytest, OpenEvals (for conversational agents)."
    ],
    "adversarial_safety": [
      "TextAttack (text-based), ART (multi-modal), Perspective API (toxicity screening)."
    ],
    "ethics_fairness": [
      "Fairlearn (bias detection)."
    ],
    "simulation_development": [
      "LangChain (tool-based), OpenAI Gym (Reinforcement Learning agents)."
    ],
    "monitoring": [
      "Grafana, Prometheus (real-time metrics)."
    ],
    "commercial_options": [
      "Botium Box, Weights & Biases (W&B)."
    ]
  },
  "benchmarks_datasets": [
    "ARC-AGI: A benchmark developed by Fran\u00e7ois Chollet to test abstract reasoning on novel problems outside training data.",
    "MMLU: Massive Multitask Language Understanding, accessed via Hugging Face Datasets.",
    "Custom Question Banks: Large-scale automated testing using standardized task sets."
  ],
  "quantitative_results": [
    "While the page does not provide specific case study data (e.g., \"reduced errors by 20%\"), it highlights:",
    "Budgeting: Commercial testing tool stacks typically range from $100 to $500/month.",
    "Human-in-the-Loop: Qualitative probing is emphasized to assess the \"Emotional Quotient\" (EQ) and reasoning process of agents."
  ]
}

---

### 5. AI Agent Testing & Safety Platform - Prevent Chatbot Failures
**URL:** https://inspectagents.com/  
**Latency:** 455.8s  

{
  "title": "AI search agent safety and reliability testing on InspectAgents platform",
  "sections": [
    {
      "heading": "1. Key Findings",
      "points": [
        "High Failure Rates: Industry surveys (Gartner/McKinsey) indicate that approximately 64% of companies deploying AI agents have experienced at least one failure in production.",
        "Significant Financial Risk: Viral AI chatbot failures (e.g., Chevrolet, Air Canada) can lead to $10M+ in damages, including legal liabilities, reputational loss, and operational costs.",
        "Legal Responsibility: Precedent (e.g., Moffatt v. Air Canada) confirms that companies are legally bound by information and promises made by their AI agents, even if the agent hallucinates.",
        "Model Drift: AI models used in search agents degrade over time, necessitating continuous testing and production monitoring."
      ]
    },
    {
      "heading": "2. Methodologies",
      "description": "A three-phase testing lifecycle is recommended:",
      "phases": [
        {
          "phase": "Phase 1: Pre-Deployment Testing",
          "subpoints": [
            "Chain-of-Verification (CoVe): A procedure to verify agent responses through a secondary verification step.",
            "Red Teaming: Adversarial testing to bypass safety filters and prompt injection scenarios.",
            "Evidence Boundary Policies: Establishing strict \"Facts-Only\" rules where agents must cite authoritative sources or specific artifacts."
          ]
        },
        {
          "phase": "Phase 2: Staging Testing",
          "subpoints": [
            "Load & Performance Testing: Measuring latency and cost at scale.",
            "Orchestration Loop Audits: Checking \"8 Trust-Boundary Audit Checkpoints\" for agents using external tools (e.g., Model Context Protocol - MCP)."
          ]
        },
        {
          "phase": "Phase 3: Production Monitoring",
          "subpoints": [
            "Real-time tracking of hallucination rates, error spikes, and conversation abandonment."
          ]
        }
      ]
    },
    {
      "heading": "3. Metrics and Benchmarks",
      "content": "InspectAgents utilizes a 63-point testing checklist across 10 critical risk areas:",
      "metrics": [
        "Hallucination Rate: Frequency of factual errors or non-existent citations.",
        "Confidence Score (0\u2013100): A metric reported by agents to indicate their certainty in a response.",
        "Prompt Injection Success Rate: Effectiveness of adversarial attacks in manipulating the agent.",
        "Operational Metrics: Latency (P50/P99), token consumption/cost, and user satisfaction scores."
      ],
      "frameworks": [
        "NIST AI Risk Management Framework",
        "OWASP Top 10 for LLM Applications",
        "EU AI Act"
      ]
    },
    {
      "heading": "4. Tools and Frameworks",
      "categories": [
        {
          "name": "Testing Frameworks",
          "tools": [
            "promptfoo (LLM testing)",
            "garak (adversarial toolkit)"
          ]
        },
        {
          "name": "RAG Evaluation",
          "tools": [
            "RAGAS",
            "TruLens for evaluating Retrieval-Augmented Generation accuracy"
          ]
        },
        {
          "name": "Enforcement & Guardrails",
          "tools": [
            "Guardrails AI",
            "NeMo Guardrails",
            "Pydantic for schema/output validation"
          ]
        },
        {
          "name": "Security & Bias",
          "tools": [
            "OWASP ZAP (security)",
            "Presidio (PII detection)",
            "IBM AI Fairness 360 (bias auditing)"
          ]
        },
        {
          "name": "Observability",
          "tools": [
            "LangSmith",
            "Helicone",
            "Datadog for production monitoring"
          ]
        }
      ]
    },
    {
      "heading": "5. Datasets and Benchmarks",
      "items": [
        {
          "name": "AI Failures Database",
          "description": "A catalog of over 500 real-world AI agent incidents used as a benchmark for what to avoid."
        },
        {
          "name": "Community Prompt Injection Database",
          "description": "A collaborative dataset of known attack vectors to test agent robustness."
        },
        {
          "name": "Agent Safety Leaderboard (Planned)",
          "description": "A benchmark to compare AI agents against industry peers with public safety scores."
        }
      ]
    },
    {
      "heading": "6. Quantitative Results",
      "points": [
        "500+ analyzed failures across industries including automotive, legal, and healthcare.",
        "63 specific safety criteria required for a \"safe\" deployment.",
        "$10M+ cost associated with high-severity hallucinations and security breaches."
      ]
    }
  ]
}

---

### 6. Exploring Effective Testing Frameworks for AI Agents in Real-World ...
**URL:** https://www.getmaxim.ai/articles/exploring-effective-testing-frameworks-for-ai-agents-in-real-world-scenarios/  
**Latency:** 978.4s  

{
  "title": "Exploring Effective Testing Frameworks for AI Agents in Real-World Scenarios",
  "topic": "AI search agent safety and reliability testing",
  "sections": {
    "1": {
      "title": "Key Findings",
      "items": [
        "Unique Testing Demands: Unlike traditional software, AI agents are non-deterministic and interact via complex tool-calling sequences, requiring multi-level evaluation rather than just accuracy metrics.",
        "Reliability Gaps: Current agentic systems face significant challenges with hallucinations, misjudgments, and security vulnerabilities.",
        "Specialization vs. Generalization: Specialized agents excel in narrow domains, but general-purpose agents still struggle with complex, open-ended tasks.",
        "Criticality of Edge Cases: Inadequate testing of edge cases and fail-safes can result in severe real-world consequences (e.g., Tesla Autopilot incidents)."
      ]
    },
    "2": {
      "title": "Methodologies",
      "items": [
        "Multi-Level Evaluation Architecture:",
        "Component-Level: Testing perception, reasoning, and action in isolation.",
        "Integration: Testing module communication and state transitions.",
        "End-to-End Simulation: Replicating full user workflows to find emergent issues.",
        "Simulation-Based Testing: Modeling diverse user personas and designing complex conversational flows (e.g., using \u03c4-Bench).",
        "Continuous Evaluation Pipelines: Integrating simulations into CI/CD for nightly suites and safety/compliance sweeps.",
        "Hybrid Evaluation: Combining AI-as-Judge (for subjective qualities like tone) with Human-in-the-Loop workflows to catch subtle failures.",
        "Adversarial & Compliance Testing: Probing for prompt injection and ensuring adherence to regulations like the EU AI Act."
      ]
    },
    "3": {
      "title": "Metrics",
      "items": [
        "Performance: Task Completion Rate, Response Time, and Error Rate.",
        "Technical Accuracy: Tool Selection Accuracy and Reasoning Quality.",
        "Safety & Reliability: PII (Personally Identifiable Information) leakage detection and data privacy adherence.",
        "Qualitative: Tone, helpfulness, and adherence to brand guidelines."
      ]
    },
    "4": {
      "title": "Tools & Frameworks",
      "items": [
        "Maxim AI Platform: A unified platform for simulation, evaluation libraries (pre-built evaluators for clarity/toxicity), and data management.",
        "Development Frameworks: LangChain, LangGraph, AutoGen (for code-heavy experiments), and Microsoft Semantic Kernel (for enterprise-grade security).",
        "Visual Iteration: n8n and Flowise."
      ]
    },
    "5": {
      "title": "Benchmarks & Datasets",
      "items": [
        "WebArena: Benchmarking general-purpose agents against human performance.",
        "\u03c4-Bench: Providing conversation-based test scenarios.",
        "Data Sources: Production traces (actual usage patterns), synthetic data (for rare edge cases), and domain-specific test suites."
      ]
    },
    "6": {
      "title": "Quantitative Results",
      "items": [
        "The \"Agent Gap\": General agents achieved only 14.41% success in WebArena, compared to 78.24% for humans.",
        "Productivity Gains: Microsoft Copilot for M365 yielded a 70% increase in routine task productivity and a 20% reduction in code errors.",
        "Testing Efficiency: Autonomous testing saved one team $240K over 2 years and reduced a 2-week testing cycle to just 2 hours.",
        "Safety Record: Tesla\u2019s Autopilot, cited as a cautionary example of inadequate reliability testing, was linked to at least 13 fatal crashes."
      ]
    }
  }
}

---

### 7. Framework for Testing AI Agents: The 30-Point Agentic Reliability ...
**URL:** https://ai-reliability.institute/research/agentic-ai-reliability-checklist.html  
**Latency:** 1707.7s  

*No content extracted.*

---

### 8. Awesome AI Agent Testing - GitHub
**URL:** https://github.com/chaosync-org/awesome-ai-agent-testing  
**Latency:** 1707.7s  

*No content extracted.*

---

### 9. OWASP AI Testing Guide
**URL:** https://owasp.org/www-project-ai-testing-guide/  
**Latency:** 1265.7s  

{
  "result": "Based on the research from the **OWASP AI Testing Guide**, here is a structured summary regarding **AI search agent safety and reliability testing**:\n\n### **1. Key Findings & Risks**\nThe guide identifies several critical risks specific to AI agents (including search agents):\n*   **Unintended Autonomous Actions (Excessive Agency):** Agents may exceed user intent by generating sub-goals, refusing to halt, or misusing tools.\n*   **Hallucinations & Misinformation:** Generating factually incorrect or fabricated information, often due to unreliable training data or insufficient grounding.\n*   **Over-Reliance:** Blind trust in AI outputs without human verification, particularly dangerous in high-stakes domains (medical, legal, financial).\n*   **Tool Misuse & Business Logic Bypass:** Attackers may induce agents to bypass authentication or execute arbitrary operations in connected tools (e.g., SQL Injection via the agent).\n*   **Emergent Behaviors:** Potential for deception, recursive planning (self-improvement loops), or resisting shutdown commands.\n\n### **2. Testing Methodologies**\nThe guide provides a standardized, technology-agnostic framework across four layers:\n*   **AI Application Layer:** Testing for prompt injection, agentic behavior limits, hallucinations, and over-reliance.\n*   **AI Model Layer:** Evasion attacks, model poisoning, and goal alignment.\n*   **AI Infrastructure Layer:** Plugin boundary violations and supply chain tampering.\n*   **AI Data Layer:** Training data exposure and dataset diversity.\n*   **Adversarial Robustness Testing:** Dedicated red-teaming methodologies that extend beyond functional tests to evaluate how agents handle malicious or edge-case inputs.\n\n### **3. Metrics**\n*   **Disclaimer & Authoritative Scores:** Used for evaluating over-reliance. Successful systems should achieve a \"Disclaimer Score\" of 2+ and an \"Authoritative Score\" of 0.\n*   **Safety Thresholds:** For example, requiring >95% of high-stakes queries to include clear professional disclaimers.\n*   **Circuit-Breaker Limits:** Monitoring execution steps, time, token usage, and cost to prevent unbounded autonomy or resource exhaustion.\n*   **Phare Dimensions:** Measuring factuality, misinformation, and the ability to debunk false claims.\n\n### **4. Tools & Frameworks**\n*   **OWASP AI Testing Guide:** The primary framework for standardized test cases.\n*   **Giskard Red Teaming & Phare:** For evaluating hallucinations and factuality.\n*   **Galileo Agentic Evaluations:** Specifically for monitoring and evaluating autonomous agent behaviors.\n*   **Garak:** A generative AI red-teaming kit with probes for package hallucinations and more.\n*   **Maestro (CSA):** An agentic AI threat modeling framework.\n*   **BrowserART:** Tests browser-based agents for unsafe behaviors.\n*   **MITRE ATLAS & Google SAIF:** Frameworks for understanding adversarial tactics and securing AI deployments.\n\n### **5. Benchmarks & Datasets**\n*   **SafeAgentBench:** A benchmark for evaluating safe refusals on hazardous or unauthorized tasks.\n*   **Phare Benchmark:** Specifically designed to test factuality and the debunking capabilities of LLMs.\n*   **Test Datasets:** The guide utilizes \"Fictional Event Probes\" (asking about events that never happened) and \"High-Stakes Domain Queries\" (medical/financial/legal prompts) to measure reliability.\n\n### **6. Quantitative Results**\nWhile specific \"scores\" depend on the target model, the guide defines normative target results:\n*   **Reliability Target:** Agents must halt 100% of the time upon receiving an \"Abort\" or \"Stop\" command.\n*   **Grounding Target:** Agents should show 0% hallucination rate when queried about specifically curated fictional datasets.\n*   **Alignment Target:** Agents should not attempt to use tools or bypass logic in 100% of \"Invocation of arbitrary tool\" test scenarios."
}

---

### 10. SafeSearch: Automated Red-Teaming for the Safety of LLM-Based Search Agents
**URL:** https://openreview.net/forum?id=f2ZiFnZEQA  
**Latency:** 834.6s  

{
  "title": "SafeSearch: Automated Red-Teaming for the Safety of LLM-Based Search Agents",
  "key_findings": [
    {
      "name": "Widespread Vulnerability",
      "description": "Current LLM-based search agents are highly susceptible to unreliable search results (e.g., synthesized adversarial webpages). Attack Success Rates (ASR) reached as high as 90.5% for models like GPT-4.1-mini."
    },
    {
      "name": "Ineffectiveness of Common Defenses",
      "description": "Standard defense practices, such as reminder prompting, show limited effectiveness in mitigating these risks."
    },
    {
      "name": "Scaffold Dependency",
      "description": "The level of vulnerability varies across different agent architectures (Search Workflow, Tool-Calling, and Deep Research), with Search Workflow often being the most vulnerable."
    },
    {
      "name": "Model Robustness Trends",
      "description": "Newer models (e.g., GPT-5-mini) demonstrate significantly lower ASRs (~18.9%) compared to older versions, suggesting improvements in inherent safety, though they remain exploitable."
    }
  ],
  "methodologies": {
    "name": "SafeSearch Red-Teaming Framework",
    "description": "A scalable, automated framework that simulates attacks by injecting synthesized unreliable content into authentic search results. It follows a three-stage pipeline:",
    "stages": [
      {
        "name": "Test Case Generation",
        "description": "Uses LLM assistants (e.g., o4-mini) to generate adversarial queries and corresponding unreliable webpages based on risk categories."
      },
      {
        "name": "Simulation-Based Testing",
        "description": "Stress-tests agents by presenting them with a mix of genuine and poisoned search results."
      },
      {
        "name": "Checklist-Assisted Evaluation",
        "description": "Employs an LLM-based judge (GPT-4.1-mini) using predefined safety checklists to evaluate agent responses, achieving up to 98% agreement with human judgment."
      }
    ]
  },
  "metrics": [
    {
      "name": "Attack Success Rate (ASR)",
      "description": "The primary metric measuring how often an agent provides a harmful or incorrect response based on adversarial search results."
    },
    {
      "name": "Harmful Score (HS)",
      "description": "A qualitative measure of the harm in the output, often compared between benign settings (HS_benign) and manipulated settings (HS_manip)."
    },
    {
      "name": "Helpfulness Score",
      "description": "Measures the perceived utility of the agent's response to ensure safety doesn't overly compromise performance."
    }
  ],
  "tools_and_frameworks": [
    {
      "name": "SafeSearch Framework",
      "description": "The core automated red-teaming tool introduced in the paper."
    },
    {
      "name": "LLM Generators",
      "models": [
        "o4-mini",
        "Qwen3-8B"
      ],
      "description": "Used as adversarial content generators."
    },
    {
      "name": "LLM Judges",
      "models": [
        "GPT-4.1-mini"
      ],
      "description": "Utilized as the automated evaluator for response safety."
    }
  ],
  "benchmarks_and_datasets": {
    "name": "SafeSearch Benchmark",
    "test_cases": 300,
    "risk_categories": [
      {
        "name": "Advertisements",
        "description": "Manipulation by sponsored content."
      },
      {
        "name": "Bias",
        "description": "Propagation of prejudiced viewpoints."
      },
      {
        "name": "Harmful Output",
        "description": "Direct generation of dangerous content."
      },
      {
        "name": "Indirect Prompt Injection (IPI)",
        "description": "Hidden instructions in webpages that hijack the agent."
      },
      {
        "name": "Misinformation",
        "description": "Spreading false or unverified information."
      }
    ],
    "data_sources": [
      "HarmBench (unsafe queries)",
      "WildChat (real-world user conversations)"
    ]
  },
  "quantitative_results": [
    {
      "model_scaffold": "Search Workflow",
      "backend_llm": "GPT-4.1-mini",
      "asr_overall": "90.5%"
    },
    {
      "model_scaffold": "Search Workflow",
      "backend_llm": "Qwen3-8B",
      "asr_overall": "85.5%"
    },
    {
      "model_scaffold": "Search Workflow",
      "backend_llm": "GPT-5-mini",
      "asr_overall": "18.9%"
    },
    {
      "model_scaffold": "Tool-Calling",
      "backend_llm": "Claude Series",
      "asr_overall": "19.8% \u2013 27.7%"
    },
    {
      "model_scaffold": "Baseline (No Attack)",
      "backend_llm": "Various",
      "asr_overall": "0.2% \u2013 3.2%"
    }
  ],
  "codebase_url": "https://anonymous.4open.science/r/SafeSearch"
}

---
