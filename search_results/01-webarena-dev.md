# https://webarena.dev/

**Source:** https://webarena.dev/  
**Latency:** 660.71s  
**Extraction goal:** Extract all information about the WebArena benchmark for evaluating web agents. Include: what it evaluates, metrics used, how agents are scored, datasets, leaderboard results, and links to papers.  

## Extracted Content

{
  "WebArena": {
    "description": "A comprehensive benchmark designed to evaluate autonomous web agents in a realistic, reproducible environment.",
    "evaluates": "Ability of autonomous agents to interpret high-level natural language commands and translate them into concrete interactions within a web-based environment across complex, multi-step tasks requiring reasoning, information retrieval, and functional execution (e.g., posting to a forum, managing a repository, or making a purchase).",
    "metrics": {
      "primary": "End-to-End Task Success Rate",
      "textual_accuracy": {
        "information_seeking_tasks": [
          "exact_match: Strict string comparison.",
          "must_include: Checking if the answer contains mandatory keywords.",
          "fuzzy_match: Allowing for minor variations in numerical or textual values."
        ]
      },
      "programmatic_checks": "For tasks with side effects (e.g., 'Create a new issue'), the system programmatically inspects the environment\u2019s state (database or file system) to verify if the intended action was correctly executed (e.g., checking the URL of the last created post or its body content)."
    },
    "scoring": {
      "basis": "Success Rate over 812 curated tasks. A task is successful if the agent reaches the correct final state or provides the correct answer within a specified maximum number of steps.",
      "task_types": {
        "information_seeking": "Scored based on the accuracy of their final textual output.",
        "site_side_action": "Scored based on the state changes they effect on the target website."
      }
    }
  },
  "datasets_environments": {
    "self_hosted_environment": {
      "primary_websites": [
        "E-commerce: Online shopping site (OpenCart).",
        "Social Forum: Reddit-like platform (Postmill).",
        "Collaborative Development: Software development platform (GitLab).",
        "Content Management System (CMS): System for managing digital content."
      ],
      "auxiliary_tools": [
        "Map",
        "Wikipedia",
        "Calculator",
        "Scratchpad for agent note-taking."
      ]
    }
  },
  "leaderboard": {
    "current_top": "OpAgent (CodeFuse AI): 71.6%",
    "human_performance": "~78.2%",
    "baseline_gpt4": "Original GPT-4-based agent: 14.41%"
  },
  "papers": {
    "primary": {
      "title": "WebArena: A Realistic Web Environment for Building Autonomous Agents",
      "arxiv": "https://arxiv.org/abs/2307.13854",
      "pdf": "https://arxiv.org/pdf/2307.13854.pdf"
    }
  }
}
