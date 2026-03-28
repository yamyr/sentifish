# https://webshop-pnlp.github.io/

**Source:** https://webshop-pnlp.github.io/  
**Latency:** 1333.29s  
**Extraction goal:** Extract all information about the WebShop benchmark for interactive web shopping agents. Include: evaluation metrics, task design, and agent performance results.  

## Extracted Content

{
  "WebShop_Benchmark": {
    "task_design": {
      "environment": "A simulated e-commerce website containing 1.18 million real-world products (scraped from Amazon) and 12,087 crowd-sourced human instructions.",
      "state_space": {
        "pages": [
          "Search Page: For entering text queries.",
          "Results Page: Displaying lists of items with titles and prices.",
          "Item Page: Showing specific product details, images, and customizable options (e.g., color, size).",
          "Item-detail Page: Providing technical specifications and descriptions."
        ]
      },
      "action_space": {
        "actions": [
          "search[text_query]: To find products based on the instruction.",
          "click[button_text]: To navigate (e.g., \"next >\", \"back to search\") or customize and purchase products (e.g., selecting \"Red\" or \"Small\" and clicking \"Buy Now\")."
        ]
      },
      "goal": "Agents are given a natural language instruction (e.g., \"I'm looking for a quick-release replacement fitness strap band in teal...\") and must navigate the site to find, customize, and \"purchase\" the correct item."
    },
    "evaluation_metrics": {
      "metrics": [
        {
          "name": "Task Success Rate",
          "description": "A binary metric representing the percentage of episodes where the agent successfully purchased a product that matched all specifications in the human instruction."
        },
        {
          "name": "Reward (or Score)",
          "description": "An automatically computed continuous metric (ranging from 0 to 1, or 0 to 100 when scaled) based on programmatic matching functions. It evaluates how closely the chosen product matches the instruction across four dimensions:",
          "dimensions": [
            "Product Type: Is it the correct category of item?",
            "Attributes: Does it have the requested features (e.g., color, material, brand)?",
            "Options: Were the correct variations selected (e.g., size)?",
            "Price: Does it align with any specified price requirements?"
          ]
        }
      ]
    },
    "agent_performance_results": {
      "human_expert": {
        "success_rate": "59.0%"
      },
      "best_automated_model_il_rl": {
        "success_rate": "29.0%"
      },
      "rule_based_heuristics": {
        "success_rate": "9.6%"
      },
      "additional_notes": "Agents trained on WebShop demonstrate non-trivial sim-to-real transfer, showing improved performance when evaluated on the live amazon.com website compared to agents without such training."
    }
  }
}
