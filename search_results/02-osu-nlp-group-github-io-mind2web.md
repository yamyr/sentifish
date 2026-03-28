# https://osu-nlp-group.github.io/Mind2Web/

**Source:** https://osu-nlp-group.github.io/Mind2Web/  
**Latency:** 1447.01s  
**Extraction goal:** Extract all information about the Mind2Web benchmark. Include: what it evaluates, task types, evaluation metrics, dataset size, and key findings.  

## Extracted Content

{
  "Mind2Web": {
    "description": "a large-scale dataset designed to develop and evaluate **generalist web agents** capable of following natural language instructions to complete complex tasks on real-world websites.",
    "what_it_evaluates": {
      "dimensions": [
        {
          "name": "Cross-Task",
          "description": "Tasks on the same website seen during training but with different goals."
        },
        {
          "name": "Cross-Website",
          "description": "Tasks on entirely new websites within domains seen during training."
        },
        {
          "name": "Cross-Domain",
          "description": "Tasks on new websites in completely unseen domains."
        }
      ]
    },
    "task_types_and_content": {
      "total_tasks": 2350,
      "websites": 137,
      "domains": 31,
      "intents": [
        "Search",
        "Book",
        "Purchase",
        "Save",
        "Interact",
        "Check",
        "Create",
        "Play",
        "Calculate",
        "Manage"
      ],
      "operations": [
        "Click",
        "Type",
        "Select",
        "Hover"
      ],
      "complexity": "Tasks average 7.3 actions, reflecting realistic multi-step user workflows."
    },
    "dataset_size": {
      "tasks": 2350,
      "websites": 137,
      "domains": 31,
      "examples": [
        "Travel",
        "Shopping",
        "Health",
        "Finance",
        "Entertainment"
      ],
      "actions": "Over 10,000 recorded interactions with real-world DOM snapshots."
    },
    "evaluation_metrics": [
      {
        "name": "Element Accuracy",
        "description": "Measures if the agent correctly identifies the target UI element."
      },
      {
        "name": "Operation F1",
        "description": "Measures the correctness of the action type (e.g., Click vs. Type) and any associated input values."
      },
      {
        "name": "Step Success Rate (Step SR)",
        "description": "Percentage of individual steps where both the element and operation were correct."
      },
      {
        "name": "Task Success Rate (Task SR)",
        "description": "A strict end-to-end metric where a task is successful only if **all** steps are completed correctly."
      }
    ],
    "key_findings": [
      {
        "finding": "**LLM Limitations with HTML:** Raw HTML from real-world sites is often too large for LLM context windows. Using a small Language Model (LM) to filter candidates (the \"MINDACT\" approach) significantly improves efficiency and effectiveness."
      },
      {
        "finding": "**The \"Success Gap\":** While models like **GPT-4** show promising step-level performance (Step SR of ~26\u201336%), their **Task Success Rate remains very low (~2%)**. A single error in a long sequence usually leads to total task failure."
      },
      {
        "finding": "**GPT-4 vs. GPT-3.5:** GPT-4 markedly outperforms GPT-3.5 (which has a Step SR of ~16\u201318%), but neither can yet reliably complete multi-page tasks autonomously."
      },
      {
        "finding": "**Generalization Challenges:** Performance is highest in \"Cross-Task\" settings and drops significantly in \"Cross-Website\" and \"Cross-Domain\" scenarios, indicating that the diversity of website layouts and interaction patterns is the primary obstacle to generalist agents."
      }
    ]
  }
}
