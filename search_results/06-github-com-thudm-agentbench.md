# https://github.com/THUDM/AgentBench

**Source:** https://github.com/THUDM/AgentBench  
**Latency:** 462.12s  
**Extraction goal:** Extract all information about AgentBench for evaluating LLM agents. Include: environments tested, metrics, models evaluated, and key results.  

## Extracted Content

{
  "AgentBench": {
    "description": "Comprehensive benchmark for evaluating LLMs as agents across diverse environments",
    "environments": {
      "core_tasks": [
        {
          "name": "Operating System (OS)",
          "description": "Using bash terminal to complete system-level tasks"
        },
        {
          "name": "Database (DB)",
          "description": "Generating and executing SQL queries"
        },
        {
          "name": "Knowledge Graph (KG)",
          "description": "Information retrieval from knowledge bases"
        },
        {
          "name": "Digital Card Game (DCG)",
          "description": "Strategic gameplay"
        },
        {
          "name": "Lateral Thinking Puzzles (LTP)",
          "description": "Multi-turn questioning to solve puzzles"
        },
        {
          "name": "Householding (ALFWorld)",
          "description": "Interactive task completion in simulated home environments"
        },
        {
          "name": "Web Shopping (WebShop)",
          "description": "Product search and purchase navigation"
        },
        {
          "name": "Web Browsing (Mind2Web)",
          "description": "General web navigation and interaction"
        }
      ],
      "visual_agent_bench": {
        "includes": [
          "Embodied tasks (Minecraft, OmniGibson)",
          "GUI interaction (Mobile, WebArena-Lite)",
          "Visual Design (CSS)"
        ]
      }
    },
    "metrics": {
      "success_rate": "Primary for OS, DB, Householding, Web tasks",
      "answer_f1": "For Knowledge Graph tasks",
      "win_rate": "For Digital Card Game",
      "game_progress": "Portion of guessed-out bullets in LTP",
      "pass_1_average": "Main leaderboard metric, average success rate across all tasks"
    },
    "models_evaluated": {
      "proprietary": [
        "GPT-4 (including GPT-4o, GPT-4 Turbo)",
        "GPT-3.5 Turbo",
        "GPT-5 (preliminary)",
        "Claude models (3.7, 4, 4.5 Sonnet/Thinking)"
      ],
      "open_source_specialized": [
        "Qwen (2.5-72B/32B/7B)",
        "GLM-4",
        "DeepSeek (V3, R1)",
        "AgentLM (70B/13B/7B)",
        "Hephaestus-8B"
      ]
    },
    "key_results_findings": [
      {
        "performance_gap": "Top models like GPT-4 and Claude Sonnet proficient, but significant gap to real-world usability"
      },
      {
        "framework_advantage": "AgentRL (e.g., w/ Qwen2.5-32B) dominates leaderboard at ~70.4%"
      },
      {
        "specialization_matters": "Fine-tuned models like AgentLM outperform general-purpose models"
      },
      {
        "complexity_challenges": "Embodied and multi-step lateral thinking tasks harder than structured data retrieval (DB/KG)"
      }
    ]
  }
}
