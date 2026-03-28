# https://www.swebench.com/

**Source:** https://www.swebench.com/  
**Latency:** 1935.32s  
**Extraction goal:** Extract all information about SWE-bench for software engineering agent evaluation. Include: how it works, evaluation criteria, leaderboard, and how agents are tested.  

## Extracted Content

{
  "SWE-bench": {
    "description": "Benchmark designed to evaluate software engineering agents by resolving real-world GitHub issues",
    "sections": {
      "1.How_it_Works": {
        "tasks": [
          "Navigate the codebase: Understand the existing logic and dependencies",
          "Locate the bug/feature request: Identify the specific files and lines of code that need changes",
          "Generate a patch: Produce a standard .patch file that resolves the issue",
          "Verification: This patch is then applied to a fresh, containerized instance of the repository to check if it fixes the problem without breaking existing functionality"
        ]
      },
      "2.Evaluation_Criteria": {
        "primary_metric": "Resolution Rate (% Resolved)",
        "resolved_definition": "A task is resolved only if the model-generated patch passes the repository's test suite, including the specific tests that were originally failing (the gold tests)",
        "metrics": [
          "Total instances: Total issues in the dataset",
          "Instances submitted: Number of issues the model attempted",
          "Instances resolved: Number of successful fixes"
        ],
        "environment": "All evaluations are conducted in Docker containers to ensure consistency, reproducibility, and isolation across different platforms"
      },
      "3.Leaderboard": {
        "variants": [
          {
            "name": "SWE-bench Verified",
            "description": "A human-filtered subset of 500 instances considered high-quality",
            "top_models": [
              {
                "model": "Claude 4.5 Opus",
                "score": "76.80%"
              },
              {
                "model": "Gemini 3 Flash",
                "score": "75.80%"
              },
              {
                "model": "MiniMax M2.5",
                "score": "75.80%"
              }
            ]
          },
          {
            "name": "SWE-bench Lite",
            "description": "A smaller, more accessible subset of 300 instances"
          },
          {
            "name": "SWE-bench Full",
            "description": "The original large-scale dataset with over 2,000 instances"
          },
          {
            "name": "Multilingual & Multimodal",
            "description": "Newer categories expanding the benchmark beyond English and text-only inputs"
          }
        ]
      },
      "4.How_Agents_are_Tested": {
        "pipeline": {
          "input": [
            "instance_id",
            "repository name",
            "base_commit (the state of the code before the fix)",
            "problem_statement (the issue text)"
          ],
          "inference_methods": [
            "API-based: Using scripts like run_api.py for models like GPT-4 or Claude",
            "Local: Using run_llama.py for open-source models",
            "Frameworks: Many entries use specialized agents (e.g., SWE-agent) that use a bashes interface to interact with the environment"
          ],
          "harness": "swebench.harness module automates the testing",
          "harness_steps": [
            "1. Setting up a Docker environment specific to the repository version",
            "2. Applying the agent's patch",
            "3. Running the predefined Fail-to-Pass (tests that must now pass) and Pass-to-Pass (existing tests that must still pass) suites",
            "4. Generating a report on the success or failure of the patch"
          ]
        }
      }
    }
  },
  "source": "Extracted information summary"
}
