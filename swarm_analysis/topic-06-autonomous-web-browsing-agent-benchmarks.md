# Topic 6: autonomous web browsing agent benchmarks

**Search latency:** 56.4s  
**Results found:** 10  
**Pages analyzed:** 10  
**Successful analyses:** 10  

## Search Results

| Rank | Title | URL |
|------|-------|-----|
| 1 | Web Bench - AI Web Browsing Agent Benchmark | https://webbench.ai/ |
| 2 | GitHub - steel-dev/leaderboard: Open leaderboard for browser | https://github.com/steel-dev/leaderboard |
| 3 | Best 30+ Open Source Web Agents in 2026 - aimultiple.com | https://aimultiple.com/open-source-web-agents |
| 4 | 11 Best AI Browser Agents in 2026 - firecrawl.dev | https://www.firecrawl.dev/blog/best-browser-agents |
| 5 | WebVoyager Benchmark Results - Browserable | https://www.browserable.ai/blog/web-voyager-benchmark |
| 6 | 10 AI agent benchmarks | https://www.evidentlyai.com/blog/ai-agent-benchmarks |
| 7 | Browser Agent Benchmark: Comparing LLM Models for Web Automa | https://browser-use.com/posts/ai-browser-agent-benchmark |
| 8 | Web Bench - A new way to compare AI Browser Agents | https://www.skyvern.com/blog/web-bench-a-new-way-to-compare-ai-browser-agents/ |
| 9 | BrowseComp by OpenAI: Benchmarking for Web-Browsing Agent | https://www.getmaxim.ai/blog/openai-browsecomp-web-browsing-agent-benchmark/ |
| 10 | The Battle for Browser Autonomy: How AI Agents Are Redefinin | https://www.webpronews.com/the-battle-for-browser-autonomy-how-ai-agents-are-red |

## Page Analyses

### Web Bench - AI Web Browsing Agent Benchmark
**URL:** https://webbench.ai/  
**Latency:** 315.0s  

{
  "web_bench_summary": {
    "introduction": "Web Bench is a comprehensive benchmark designed to evaluate AI web browsing agents on real-world, non-synthetic tasks across the live internet. It aims to provide a more rigorous and realistic evaluation than previous benchmarks by using a vast array of actual websites and complex task sequences.",
    "key_findings": [
      {
        "performance_disparity": "Agents perform exceptionally well on read-heavy tasks (e.g., data extraction, navigation), often exceeding a 75% success rate. However, performance drops significantly for write-heavy tasks (e.g., form filling, account creation), where state-of-the-art (SOTA) agents struggle to reach even a 50% success rate."
      },
      {
        "infrastructure_barriers": "A major hurdle for autonomous agents is not just AI capability but web infrastructure, including CAPTCHAs, bot detection, and authentication loops."
      },
      {
        "step_correlation": "Non-read tasks typically require more steps, which increases the cumulative probability of agent failure."
      }
    ],
    "methodologies": {
      "dataset_creation_pipeline": [
        {
          "step": 1,
          "name": "Requirement Generation",
          "description": "Uses Perplexity AI to identify possible user functionalities for a given URL."
        },
        {
          "step": 2,
          "name": "Initial Task Generation",
          "description": "LLMs generate ~30 realistic tasks per website (categorized as read, write, update, login)."
        },
        {
          "step": 3,
          "name": "Human Feasibility Check",
          "description": "Human annotators verify if tasks are actually possible on the site (removing ~55% of tasks)."
        },
        {
          "step": 4,
          "name": "QA Check",
          "description": "A secondary team clarifies wording and removes inconsistent tasks (e.g., those involving payments)."
        },
        {
          "step": 5,
          "name": "Final Sampling",
          "description": "A subset of verified tasks is selected for the benchmark, accounting for website changes and reliability."
        }
      ],
      "evaluation_process": [
        {
          "human_in_the_loop_verification": "Agent trajectories (screen recordings and outputs) are reviewed by human annotators."
        },
        {
          "trajectory_labeling": "Each run is labeled as \"Success,\" \"Failure,\" or \"Bad Task\" (if the website changed during the test)."
        }
      ]
    },
    "metrics": [
      "Success Rate: The primary metric, calculated as the percentage of successfully completed tasks.",
      "Step Count: The number of actions taken per task, used to analyze complexity.",
      "Failure Analysis: Categorization of failures into \"Agent Problems\" (navigation, timeout, extraction errors) vs. \"Infrastructure Problems\" (proxies, CAPTCHAs)."
    ],
    "tools_frameworks_benchmarks": {
      "benchmarks": [
        {
          "name": "Autonomous Benchmark",
          "description": "For fully automated agents."
        },
        {
          "name": "Copilot (HITL) Benchmark",
          "description": "For \"Human-In-The-Loop\" assistants."
        }
      ],
      "agents_tested": [
        "Anthropic Computer Use (CUA)",
        "Skyvern 2.0",
        "OpenAI Operator (Copilot/HITL)",
        "Browser Use Cloud API",
        "Convergence AI",
        "Skyvern & Browserbase Infrastructure"
      ]
    },
    "datasets": {
      "total_tasks_generated": 5750,
      "websites": 452,
      "benchmark_set_tasks": 2454,
      "categories": [
        {
          "name": "READ",
          "percentage": 64.4,
          "description": "Information extraction."
        },
        {
          "name": "CREATE",
          "percentage": 20.9,
          "description": "Form filling/Write tasks."
        },
        {
          "name": "UPDATE/DELETE/FILE",
          "description": "Remainder of the set."
        }
      ]
    },
    "quantitative_results": [
      {
        "benchmark_type": "Copilot (HITL)",
        "top_model": "OpenAI Operator",
        "success_rate": 76.5
      },
      {
        "benchmark_type": "Autonomous",
        "top_model": "Anthropic Sonnet 3.7 CUA",
        "success_rate": 66
      },
      {
        "benchmark_type": "Autonomous",
        "top_model": "Skyvern 2.0",
        "success_rate": 64.4
      },
      {
        "benchmark_type": "Autonomous",
        "top_model": "OpenAI CUA",
        "success_rate": 59.8
      }
    ],
    "notes": "In \"Write-only\" task categories, the best autonomous performance was notably lower, around 46.6% (Skyvern 2.0)."
  },
  "source": "Based on the research from [Web Bench](https://webbench.ai/) and its associated technical report."
}

---

### GitHub - steel-dev/leaderboard: Open leaderboard for browser agents
**URL:** https://github.com/steel-dev/leaderboard  
**Latency:** 632.5s  

{
  "title": "Steel Browser Agent Leaderboard Research Summary",
  "key_findings": [
    {
      "performance_sota": {
        "leader": "Surfer 2 (H Company)",
        "score": "97.1%",
        "benchmark": "WebVoyager",
        "date": "March 2026"
      }
    },
    {
      "followers": [
        {
          "name": "Magnitude",
          "score": "93.9%"
        }
      ]
    },
    {
      "model_leaders": {
        "claude_35_sonnet": "leads on text-heavy and reasoning benchmarks",
        "gpt_4o": "superior for vision-related tasks"
      }
    },
    {
      "human_gap": {
        "early_example": {
          "gpt_4": "~14.4%",
          "humans": "~78.2%",
          "benchmark": "WebArena"
        },
        "recent": {
          "surfer_2": "nearly closed on WebVoyager"
        }
      }
    },
    {
      "enterprise_difficulty": "compositional tasks in WorkArena significantly harder than single-step navigation"
    }
  ],
  "methodologies": {
    "observation_spaces": [
      "screenshots with bounding-box overlays",
      "accessibility tree text"
    ],
    "interaction_environments": [
      {
        "type": "Live Browsing",
        "examples": [
          "WebVoyager"
        ],
        "tools": [
          "Selenium",
          "Playwright"
        ]
      },
      {
        "type": "Self-Hosted/Sandbox",
        "examples": [
          "WebArena"
        ],
        "platforms": [
          "GitLab",
          "Reddit"
        ],
        "purpose": "consistency and prevent data leakage"
      }
    ],
    "action_spaces": "Gym-style discrete actions (click, type, scroll)"
  },
  "metrics": [
    {
      "name": "Success Rate (SR)",
      "description": "percentage of tasks successfully completed"
    },
    {
      "name": "Functional Correctness",
      "description": "execution-based evaluation using programmatic validators"
    },
    {
      "name": "Automated Evaluation",
      "description": "GPT-4V-based protocols on screenshots (~85% agreement with humans)"
    }
  ],
  "tools_frameworks": [
    {
      "name": "Steel",
      "description": "open-source browser API for AI agents"
    },
    {
      "name": "BrowserGym",
      "description": "unified ecosystem standardizing observation/action spaces"
    },
    {
      "name": "AgentLab",
      "description": "framework for agent creation, testing, parallel experiments"
    },
    {
      "name": "Automation Drivers",
      "tools": [
        "Playwright",
        "Selenium"
      ]
    }
  ],
  "benchmarks": [
    {
      "name": "WebVoyager",
      "focus": "General Multimodal Web Navigation",
      "dataset_size": "643 tasks across 15 real-world sites"
    },
    {
      "name": "WebArena",
      "focus": "Self-hosted realistic workflows",
      "dataset_size": "812 tasks (e-commerce, forums, dev tools)"
    },
    {
      "name": "WorkArena",
      "focus": "Enterprise ServiceNow automation",
      "dataset_size": "19,912 unique instances (L1)"
    },
    {
      "name": "VisualWebArena",
      "focus": "Visual-heavy web tasks",
      "description": "Extension of WebArena with visual reasoning"
    },
    {
      "name": "Mind2Web",
      "focus": "Generalizability to new websites",
      "description": "Cross-domain web interaction tasks"
    }
  ],
  "leaderboard_webvoyager": [
    {
      "rank": 1,
      "agent": "Surfer 2 (H Company)",
      "score": "97.1%"
    },
    {
      "rank": 2,
      "agent": "Magnitude (Magnitude)",
      "score": "93.9%",
      "open_source": true
    },
    {
      "rank": 3,
      "agent": "AIME Browser-Use (Aime)",
      "score": "92.34%"
    },
    {
      "rank": 6,
      "agent": "Browser Use (Open Source)",
      "score": "89.1%"
    },
    {
      "rank": 7,
      "agent": "OpenAI Operator",
      "score": "87%"
    },
    {
      "baseline": {
        "agent": "Original WebVoyager (GPT-4V)",
        "score": "59.1%"
      }
    }
  ]
}

---

### Best 30+ Open Source Web Agents in 2026 - aimultiple.com
**URL:** https://aimultiple.com/open-source-web-agents  
**Latency:** 949.5s  

{
  "key_findings": {
    "performance_leaders": [
      {
        "name": "Browser-Use",
        "success_rate": 89.1
      },
      {
        "name": "Skyvern 2.0",
        "success_rate": 85.85
      }
    ],
    "impact_of_site_complexity": "Agents perform significantly better on static or search-oriented sites compared to dynamic sites with complex forms and interactive elements.",
    "benchmark_vs_real_world_gap": "Most benchmarks are conducted on \"cooperative\" sites without aggressive bot protection. Real-world success rates are likely lower due to security measures like Cloudflare or DataDome.",
    "viral_growth": "The field is expanding rapidly, with projects like **OpenClaw** reaching 147,000 GitHub stars shortly after launch."
  },
  "benchmarks_and_datasets": {
    "primary_benchmark": "WebVoyager",
    "dataset_composition": {
      "scale": 643,
      "scope": "15 real-world websites (e.g., Google, GitHub, Wikipedia, Booking.com, Google Flights, Apple, Amazon, Hugging Face)",
      "task_types": [
        "form submission",
        "multi-page navigation",
        "search operations",
        "dropdown interactions",
        "date selection"
      ]
    }
  },
  "methodologies": {
    "interpretation_approaches": {
      "vision_based": [
        "Skyvern 2.0",
        "WebVoyager",
        "VimGPT"
      ],
      "dom_based": [
        "Browser-Use",
        "Agent-E"
      ],
      "hybrid": [
        "LiteWebAgent",
        "AutoWebGLM"
      ]
    },
    "testing_environments": {
      "local_testing": [
        "Browser-Use",
        "Agent-E"
      ],
      "cloud_testing": [
        "Skyvern 2.0"
      ]
    },
    "evaluation": "Benchmarks typically use LLMs (like GPT-4o) to evaluate whether the agent successfully completed the multi-step task based on the final output."
  },
  "metrics": [
    "Success Rate (%)",
    "GitHub Stars",
    "Throughput"
  ],
  "tools_and_frameworks": {
    "autonomous_web_agents": [
      "Browser-Use",
      "Skyvern",
      "Agent-E",
      "OpenClaw",
      "AgenticSeek",
      "Auto-GPT",
      "SuperAGI",
      "OpenManus"
    ],
    "computer_use_agents": [
      "OpenInterpreter",
      "UI-TARS",
      "AutoBrowser MCP",
      "Claude Cowork"
    ],
    "ai_scrapers_crawlers": [
      "Crawl4AI",
      "FireCrawl",
      "ScrapeGraphAI"
    ],
    "enablement_tools": [
      "LaVague (NL-to-action)",
      "ZeroStep",
      "Browserless (LLM-browser bridges)"
    ]
  },
  "quantitative_results": {
    "webvoyager_benchmark": [
      {
        "agent": "Browser-Use",
        "success_rate": 89.1,
        "methodology_notes": "Tested on 586 tasks (55 outdated removed); used GPT-4o for evaluation."
      },
      {
        "agent": "Skyvern 2.0",
        "success_rate": 85.85,
        "methodology_notes": "Tested on 635 tasks in Skyvern Cloud; updated dates to 2025."
      },
      {
        "agent": "Agent-E",
        "success_rate": 73.1,
        "methodology_notes": "Tested on complete 643 tasks; DOM parsing only (no vision)."
      },
      {
        "agent": "WebVoyager",
        "success_rate": 57.1,
        "methodology_notes": "Original multimodal agent baseline."
      }
    ],
    "agent_e_detailed_results": {
      "high_success": [
        {
          "site": "Wolfram",
          "success_rate": 95.7
        },
        {
          "site": "Google Search",
          "success_rate": 90.7
        },
        {
          "site": "Google Maps",
          "success_rate": 87.8
        }
      ],
      "low_success": [
        {
          "site": "Booking.com",
          "success_rate": 27.3
        },
        {
          "site": "Google Flights",
          "success_rate": 35.7
        }
      ]
    }
  },
  "source": "Based on the research from [AIMultiple](https://aimultiple.com/open-source-web-agents)"
}

---

### 11 Best AI Browser Agents in 2026 - firecrawl.dev
**URL:** https://www.firecrawl.dev/blog/best-browser-agents  
**Latency:** 1102.1s  

{
  "key_findings": {
    "state_of_the_art_performance": {
      "tool": "Browser Use",
      "success_rate": "89.1%",
      "benchmark": "WebVoyager"
    },
    "hybrid_efficiency": {
      "from": "~30%",
      "to": "~80%"
    },
    "specialization": {
      "tool": "Skyvern",
      "task": "form-filling (WRITE)",
      "success_rate": "85.85%",
      "benchmark": "WebVoyager"
    },
    "security_vulnerabilities": "24% of prompt injection attacks"
  },
  "methodologies": [
    "Task-Oriented Evaluation: Agents are evaluated by their ability to complete a series of diverse, goal-directed web tasks (e.g., booking a flight, finding specific info).",
    "Human-in-the-loop / Plan-Follower Models: Evaluating agents based on their ability to follow a plan with human oversight to improve reliability.",
    "Efficiency Comparison: Benchmarking AI-powered agents against manual human performance (e.g., 90 seconds vs. 12+ minutes for complex forms)."
  ],
  "metrics": [
    "Success Rate: The primary metric, indicating the percentage of benchmark tasks successfully completed.",
    "Token Consumption: Measuring the efficiency of data extraction; Firecrawl's clean output reduces LLM token usage by 67% compared to raw HTML.",
    "Processing Speed: Time-to-completion for complex multi-field web forms.",
    "Reliability: The consistency and predictability of the agent's actions across different sessions."
  ],
  "tools_and_frameworks": {
    "Firecrawl": "Provides the data layer, including an Agent endpoint and Browser Sandbox for secure execution.",
    "Browser Use": "An open-source framework for building AI browser agents (connected to LiteLLM).",
    "Stagehand": "Browserbase\u2019s open-source SDK specifically for TypeScript developers.",
    "Skyvern": "A no-code workflow automation tool using LLMs and computer vision.",
    "Steel": "An open-source browser API for AI agents.",
    "Agent Browser": "Vercel Labs' open-source CLI tool built in Rust."
  },
  "benchmarks": {
    "WebVoyager": "A standard benchmark consisting of 586 diverse web tasks used by most leading agents for performance validation.",
    "WebArena": "A complex benchmark environment used by OpenAI to test more advanced autonomous capabilities."
  },
  "datasets": {
    "WebVoyager Task Set": "586 specific, diverse web-based task descriptions used for testing agent autonomy."
  },
  "quantitative_results": [
    {
      "tool_agent": "Browser Use",
      "benchmark": "WebVoyager",
      "success_rate_performance": "89.1%"
    },
    {
      "tool_agent": "OpenAI Computer-Using Agent",
      "benchmark": "WebVoyager",
      "success_rate_performance": "87.0%"
    },
    {
      "tool_agent": "OpenAI Computer-Using Agent",
      "benchmark": "WebArena",
      "success_rate_performance": "58.1%"
    },
    {
      "tool_agent": "Skyvern",
      "benchmark": "WebVoyager",
      "success_rate_performance": "85.85%"
    },
    {
      "tool_agent": "Firecrawl",
      "benchmark": "Token Efficiency",
      "success_rate_performance": "67% reduction in LLM token use"
    },
    {
      "tool_agent": "Skyvern",
      "benchmark": "Speed (30-field form)",
      "success_rate_performance": "90 seconds (vs 12+ min manually)"
    }
  ]
}

---

### WebVoyager Benchmark Results - Browserable
**URL:** https://www.browserable.ai/blog/web-voyager-benchmark  
**Latency:** 1404.3s  

{
  "summary": "Autonomous Web Browsing Agent Benchmarks: WebVoyager Results for Browserable",
  "key_findings": [
    {
      "state_of_the_art": "Browserable achieved 90.4% success rate, best-in-class"
    },
    {
      "accessibility": "Fully open-source and self-hostable"
    },
    {
      "benchmarking_challenges": "Many tasks outdated due to website updates, require manual curation"
    }
  ],
  "methodologies": [
    {
      "model_integration": "Gemini 2.0 Flash (primary), GPT-4o and Claude 3.5 Sonnet (backups)"
    },
    {
      "task_refinement": "56 tasks removed from original WebVoyager (outdated or require human intervention)"
    },
    {
      "environment": "Real browser environments, actions: navigating, form-filling, clicking, data extraction"
    },
    {
      "cost_efficiency": "$70 USD for 567-task evaluation"
    }
  ],
  "metrics": [
    {
      "name": "Success Rate (%)",
      "description": "Percentage of tasks completed without human assistance"
    }
  ],
  "tools_and_frameworks": [
    {
      "browserable": "Open-source autonomous browser agent"
    },
    {
      "llms": [
        "Gemini 2.0 Flash (Primary)",
        "GPT-4o",
        "Claude 3.5 Sonnet"
      ]
    },
    {
      "browser_automation": "Frameworks for live web elements (e.g., Playwright, Puppeteer standard)"
    }
  ],
  "benchmarks_and_datasets": [
    {
      "webvoyager": "Standardized suite for real-world browsing, tasks on:",
      "platforms": [
        "E-commerce: Amazon",
        "Travel: Google Flights",
        "Search/Information: Apple, Google, others"
      ]
    }
  ],
  "quantitative_results": [
    {
      "agent": "Browserable",
      "success_rate": 90.4
    },
    {
      "agent": "Operator",
      "success_rate": 87
    },
    {
      "agent": "Runner H 0.1",
      "success_rate": 67
    },
    {
      "agent": "Computer Use",
      "success_rate": 52
    },
    {
      "agent": "Web Voyager (Baseline)",
      "success_rate": 50
    }
  ]
}

---

### 10 AI agent benchmarks
**URL:** https://www.evidentlyai.com/blog/ai-agent-benchmarks  
**Latency:** 481.0s  

{
  "General Findings & Context": [
    "Agentic AI Evolution: Agentic AI is considered a top trend (potentially making 2025 the \"year of AI agents\"), shifting from simple LLM interactions to sophisticated, autonomous systems capable of handling multi-step, real-world tasks with minimal human input.",
    "Evaluation Need: As agents become more autonomous, rigorous evaluation of their planning, decision-making, and tool-use capabilities is critical to uncover failure modes.",
    "Custom Evals: While standardized benchmarks are essential for model comparison, the blog emphasizes that developers also need custom evaluations on their own data for production-ready agents."
  ],
  "Key Benchmarks & Methodologies": {
    "WebArena": {
      "Goal": "A realistic, self-hosted web environment for autonomous agents.",
      "Methodology": "Simulates four domains: e-commerce, social forums, collaborative code development, and content management systems.",
      "Metrics": "Functional Correctness/Success (achieving the final goal regardless of the path taken).",
      "Dataset/Scale": "Encompasses 812 templated tasks and variations."
    },
    "AgentBench": {
      "Goal": "Assesses LLM-as-Agent reasoning in multi-turn, open-ended settings.",
      "Methodology": "Evaluates across eight environments, including Web Browsing, Web Shopping, Operating Systems, and Databases.",
      "Dataset/Scale": "Challenges typically involve 5 to 50 turns."
    },
    "Webshop": {
      "Goal": "A simulated environment specifically for web-based shopping tasks.",
      "Methodology": "Agents must search, filter, and navigate pages to complete a purchase based on crowd-sourced instructions.",
      "Dataset/Scale": "Includes 1.18 million products and 12,087 instructions."
    },
    "GAIA": {
      "Goal": "Benchmark for general-purpose assistants.",
      "Methodology": "Real-world questions requiring reasoning, multimodality handling, and tool use. Tasks are sorted into three levels of increasing difficulty based on the number of steps/tools required.",
      "Dataset/Scale": "466 human-annotated tasks."
    },
    "ToolLLM (ToolBench)": {
      "Goal": "Mastery of real-world APIs.",
      "Methodology": "Tests retrieval, multi-step reasoning, and correct invocation across 49 categories.",
      "Metrics": "Successful execution within budgets and solution path quality.",
      "Tools/Frameworks": "Utilizes a ChatGPT-backed automatic evaluator.",
      "Dataset/Scale": "16,464 RESTful APIs."
    }
  },
  "Metrics & Frameworks Mentioned": [
    "Success Rate / Task Completion: Commonly mentioned across WebArena and ToolLLM.",
    "Functional Correctness: Primary metric for WebArena.",
    "Safety Evaluator: ToolEmu uses an LM-based automatic safety evaluator to detect risky behaviors in a sandbox environment.",
    "Reinforcement Learning: ColBench introduces the SWEET-RL algorithm for training agents using step-level rewards.",
    "Natural Language Feedback: MINT uses GPT-4 to simulate natural language feedback during agent interactions."
  ],
  "Tools & Frameworks for Evaluation": [
    "ToolEmu Sandbox: An LM-emulated sandbox for rapid prototyping without actual tool infrastructure.",
    "MetaTool (ToolE): A dataset for evaluating tool-use awareness (knowing *when* to use a tool).",
    "BFCL (Berkeley Function-Calling Leaderboard): A specialized leaderboard for function-calling accuracy across multiple programming languages."
  ],
  "Quantitative Results": {
    "MetaTool": "21,000+ labeled prompts.",
    "BFCL": "2,000 question-answer pairs.",
    "ToolLLM": "16,000+ APIs.",
    "Webshop": "1.18 million products.",
    "ColBench": "Performance is noted to be \"significantly improved\" when using the SWEET-RL algorithm, though specific percentage points were not detailed in this summary."
  }
}

---

### Browser Agent Benchmark: Comparing LLM Models for Web Automation
**URL:** https://browser-use.com/posts/ai-browser-agent-benchmark  
**Latency:** 344.8s  

{
  "key_findings": {
    "performance_gap": {
      "top_performer": "Browser Use Cloud (bu-ultra)",
      "success_rate": "78%",
      "outperforms": "Claude Opus 4-6 by 16 percentage points"
    },
    "efficiency": {
      "top_performer": "Browser Use Cloud",
      "throughput": "14 tasks per hour"
    },
    "optimization_advantage": [
      "full-stack optimizations",
      "built-in stealth proxies",
      "CAPTCHA solving",
      "persistent filesystems",
      "optimized tool orchestration"
    ],
    "oss_capabilities": {
      "library": "Browser Use open-source library",
      "model": "ChatBrowserUse-2",
      "success_rate": "63.3%",
      "comparison": "surpassing standard LLM performance"
    }
  },
  "methodology": {
    "benchmark": "BU Bench V1",
    "task_count": 100,
    "task_description": "hand-selected tasks that are 'hard but possible'",
    "task_selection": "filtered out tasks that were either too easy (100% success rate) or impossible (0% success rate)",
    "anti_contamination": "task set is encrypted to prevent inclusion in future LLM training data",
    "scale": "over 600,000 tasks run during testing",
    "evaluation": {
      "judge": "Gemini 2.5 Flash",
      "verdict": "binary (true/false)",
      "agreement_rate_with_humans": "87%"
    }
  },
  "metrics": [
    "Success Rate (Primary): percentage of tasks successfully completed",
    "Throughput: tasks per hour"
  ],
  "benchmarks_datasets": {
    "name": "BU Bench V1",
    "task_sources": [
      {
        "source": "Custom",
        "tasks": 20
      },
      {
        "source": "WebBench",
        "tasks": 20
      },
      {
        "source": "Mind2Web 2",
        "tasks": 20
      },
      {
        "source": "GAIA",
        "tasks": 20
      },
      {
        "source": "BrowseComp",
        "tasks": 20
      }
    ]
  },
  "tools_frameworks": {
    "browser_use_cloud": "bu-ultra (proprietary, fully-managed agent platform)",
    "browser_use_oss": "open-source library for browser automation",
    "chatbrowseruse_2": "specialized LLM optimized for browser automation tasks",
    "models_tested": [
      "Claude Opus/Sonnet 4-6",
      "GPT-5/GPT-5-mini",
      "Gemini 2.5 Flash/3.1 Pro"
    ]
  },
  "quantitative_results": [
    {
      "model": "Browser Use Cloud (bu-ultra)",
      "success_rate": "78.0%",
      "throughput": "~14"
    },
    {
      "model": "OSS + ChatBrowserUse-2",
      "success_rate": "63.3%",
      "throughput": null
    },
    {
      "model": "Claude Opus 4-6",
      "success_rate": "62.0%",
      "throughput": null
    },
    {
      "model": "Gemini 3.1 Pro",
      "success_rate": "59.3%",
      "throughput": null
    },
    {
      "model": "Claude Sonnet 4-6",
      "success_rate": "59.0%",
      "throughput": null
    },
    {
      "model": "GPT-5",
      "success_rate": "52.4%",
      "throughput": "~6"
    },
    {
      "model": "GPT-5-mini",
      "success_rate": "37.0%",
      "throughput": null
    },
    {
      "model": "Gemini 2.5 Flash",
      "success_rate": "35.2%",
      "throughput": null
    }
  ]
}

---

### Web Bench - A new way to compare AI Browser Agents
**URL:** https://www.skyvern.com/blog/web-bench-a-new-way-to-compare-ai-browser-agents/  
**Latency:** 477.4s  

{
  "web_bench_summary": {
    "key_findings": [
      {
        "write_heavy_performance_gap": "All current AI agents perform significantly worse on write-heavy tasks (logging in, filling out forms, downloading files) compared to read-heavy tasks. Largest area for future growth."
      },
      {
        "infrastructure_criticality": "Success depends as much on infrastructure (proxies, bot detection evasion) as on AI model."
      },
      {
        "current_sota": "Anthropic's Sonnet 3.7 CUA is SOTA for overall web browsing."
      },
      {
        "read_vs_write": "Read-only tasks stable; write tasks major hurdle."
      }
    ],
    "methodologies": {
      "benchmark_expansion": "Expanded WebVoyager from 15 websites/642 tasks to 452 websites/5,750 tasks with Halluminate.",
      "data_sampling": "Sampled from top 1,000 global websites by traffic, English-language, no paywalls.",
      "execution_rules": "Max 50 steps per task.",
      "validation": "Human-in-the-loop validation."
    },
    "metrics": [
      "Pass Rate / Accuracy (Read-heavy vs. Write-heavy)",
      "Step Count",
      "Runtime Duration",
      "Human-Validated Success Rate (OpenAI Operator with human-in-the-loop: 78.1%)"
    ],
    "tools_frameworks_agents": {
      "evaluated_agents": [
        "Skyvern (2.0)",
        "Browser-use",
        "OpenAI's Operator (CUA)",
        "Anthropic Sonnet 3.7 CUA"
      ],
      "infrastructure_tools": [
        "Skyvern's internal infrastructure",
        "Browserbase"
      ],
      "partnerships": "Halluminate"
    },
    "benchmarks_datasets": {
      "web_bench_dataset": "5,750 tasks across 17 categories",
      "open_source": "2,454 tasks on GitHub (Halluminate/WebBench)",
      "comparison": "Robust alternative to WebVoyager"
    },
    "quantitative_results": {
      "operator_human_loop": "78.1% success rate",
      "top_ai_agents": "64.4% to 66% pass rates",
      "skyvern_2_0": "Best for write tasks (data entry, file handling)",
      "leaderboard": "eval.skyvern.com"
    },
    "challenges_limitations": [
      "Technical Blockers: bot detection (Cloudflare), Google Authentication, complex sites (e.g., Chase.com)",
      "Navigation Failures: closing popups, captchas, finding buttons",
      "Agent Hallucinations: timeouts, incomplete multi-step workflows"
    ]
  }
}

---

### BrowseComp by OpenAI: Benchmarking for Web-Browsing Agent
**URL:** https://www.getmaxim.ai/blog/openai-browsecomp-web-browsing-agent-benchmark/  
**Latency:** 248.8s  

{
  "overview": {
    "title": "BrowseComp",
    "description": "Benchmark developed by OpenAI to evaluate web-browsing agents using hard-to-google questions requiring multi-hop searches, information synthesis, and complex reasoning."
  },
  "key_findings": [
    {
      "performance_vs_effort": "Accuracy correlates strongly with browsing effort and steps; backtracking and query reformulation improve performance."
    },
    {
      "model_performance_gap": "State-of-the-art models like GPT-4o struggle compared to humans, needing better strategies."
    },
    {
      "compute_scaling": "Performance scales with test-time compute; Best-of-N sampling boosts accuracy."
    },
    {
      "confidence_calibration": "Persistent agents like Deep Research become overconfident, increasing calibration errors."
    }
  ],
  "methodologies": [
    {
      "inversion_based_design": "Questions written backward from verified answers, targeting 10+ minutes human effort."
    },
    {
      "web_distance_filtering": "Answers not trivially discoverable via single search."
    },
    {
      "canary_guids": "Unique cryptographic GUIDs (e.g., browsecomp:26b5c67b...) to prevent data leakage."
    },
    {
      "verifiability": "Short answers (word/phrase) for automated evaluation."
    }
  ],
  "benchmarks_datasets": {
    "dataset_size": 1266,
    "tools_frameworks": [
      "BrowseComp",
      "OpenAI Deep Research Agent",
      "OpenAI o1 Series",
      "OpenHands & AutoGPT",
      "Maxim"
    ]
  },
  "metrics": [
    "Accuracy (primary success metric)",
    "Calibration Error (confidence matching success rate)",
    "Test-Time Compute Scaling"
  ],
  "quantitative_results": {
    "model_performance": [
      {
        "model": "OpenAI Deep Research",
        "accuracy": 51.5,
        "calibration_error": 91
      },
      {
        "model": "OpenAI o1",
        "accuracy": 9.9,
        "calibration_error": 65
      },
      {
        "model": "GPT-4o (with Browsing)",
        "accuracy": 1.9,
        "calibration_error": 82
      },
      {
        "model": "GPT-4o (Standard)",
        "accuracy": 0.6,
        "calibration_error": 69
      },
      {
        "model": "Human Trainers",
        "accuracy": 29.2,
        "calibration_error": null
      }
    ],
    "compute_scaling": {
      "best_of_64_samples": {
        "agent": "Deep Research",
        "single_run": "~52%",
        "best_of_64": "~78%"
      },
      "aggregation_improvement": "15-25% relative improvement via multiple attempts and voting"
    }
  }
}

---

### The Battle for Browser Autonomy: How AI Agents Are Redefining Web ...
**URL:** https://www.webpronews.com/the-battle-for-browser-autonomy-how-ai-agents-are-redefining-web-interaction-benchmarks/  
**Latency:** 881.6s  

{
  "title": "The Battle for Browser Autonomy: How AI Agents Are Redefining Web Interaction Benchmarks",
  "overview": "The article details the shift in the AI industry from simple chatbots to autonomous web-browsing agents. This transition has necessitated a complete re-evaluation of how AI performance is measured, as traditional benchmarks fail to capture the complexity of multi-step, goal-oriented web interactions.",
  "key_findings": [
    {
      "performance_gap": "There is a stark divide in the market; top-tier autonomous systems are achieving success rates of approximately 85% on complex web tasks, while many competitors still struggle with success rates below 40%."
    },
    {
      "autonomy_vs_interaction": "The industry is moving beyond \"chat\" to \"autonomy,\" where agents must navigate unknown UI changes and handle multi-step workflows without human intervention."
    },
    {
      "reliability_crisis": "A \"95% success rate\" is often insufficient for enterprise use, as the remaining 5% of errors in financial or healthcare portals can lead to significant real-world consequences."
    }
  ],
  "methodologies": [
    {
      "simulated_human_navigation": "Testing involves agents performing tasks in live or sandboxed web environments to mimic human browsing behavior."
    },
    {
      "multi_step_task_execution": "Evaluations focus on the agent's ability to maintain state and recover from errors across long-sequence interactions rather than single-turn question-answering."
    },
    {
      "enterprise_grade_stress_tests": "Using proprietary and emerging open-source frameworks to test agents against dynamic web elements that frequently change."
    }
  ],
  "benchmarks_datasets": {
    "web_specific_benchmarks": "The article emphasizes the move toward benchmarks like WebArena and Mind2Web (implied context) which test real-world site interactions.",
    "testing_scenarios": [
      "E-commerce platforms (completing purchases, tracking orders).",
      "Enterprise SaaS software (data entry, report generation).",
      "Government portals (navigating complex forms and compliance documents)."
    ],
    "traditional_benchmarks": "Mentions that older standards like MMLU, HumanEval, and GSM8K are becoming secondary to agentic-specific evaluations."
  },
  "metrics": [
    "Task Success Rate (TSR): The primary metric for determining if an agent completed a complex goal.",
    "Error Recovery Rate: How effectively an agent can correct its path when it encounters a 404 error, a popup, or a UI change.",
    "ROI & Efficiency Metrics: Quantitative measures such as hours saved per task and Return on Investment compared to human workers (reporting 40\u201360% efficiency gains in some sectors).",
    "Technical Performance: Latency (response time) and throughput (tasks per hour)."
  ],
  "tools_frameworks": {
    "evaluation_platforms": "Mention of tools like Braintrust, Patronus AI, and Galileo for monitoring and grading agentic workflows.",
    "agentic_capabilities": "Highlighting Anthropic\u2019s \"computer use\" and OpenAI\u2019s \"Operator\" as the primary contenders defining these new interaction standards."
  },
  "quantitative_results": {
    "85_percent_success_rate": "Achieved by leading autonomous models on complex, multi-step web tasks.",
    "less_than_40_percent_success_rate": "The baseline for many current-generation models when faced with \"broken\" or highly dynamic web interfaces.",
    "40_60_percent_efficiency_gain": "Reported by enterprises currently deploying these agents for administrative and customer service automation."
  }
}

---
