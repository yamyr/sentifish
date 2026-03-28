# https://lilianweng.github.io/posts/2023-06-23-agent/

**Source:** https://lilianweng.github.io/posts/2023-06-23-agent/  
**Latency:** 483.39s  
**Extraction goal:** Extract information about LLM-powered autonomous agents from Lilian Weng's blog. Include: evaluation approaches, benchmarks mentioned, and agent architectures.  

## Extracted Content

{
  "agent_architectures": {
    "general_llm_powered_agent_system": "Comprises Planning (task decomposition and reflection), Memory (short-term via context and long-term via vector stores/RAG), and Tool Use (calling external APIs).",
    "react": "Integrates reasoning and acting by extending the action space to include thoughts, enabling the agent to create, maintain, and update action plans while handling exceptions.",
    "reflexion": "A framework that equips agents with dynamic memory and self-reflection capabilities. It uses a verbal reinforcement learning setup where the agent reflects on past failures to improve future performance.",
    "chain_of_hindsight_coh": "An architecture that encourages models to improve by presenting a sequence of past outputs annotated with feedback, training the model to self-reflect and refine its answers.",
    "algorithm_distillation_ad": "Applies the concept of reinforcement learning to in-context learning, where the model learns to improve its policy by observing its own history of trajectories.",
    "mrkl": "A neuro-symbolic architecture that uses an LLM as a router to direct queries to specialized expert modules (e.g., calculators, database search).",
    "tool_augmented_architectures": "Includes TALM (Tool Augmented Language Models), Toolformer, and HuggingGPT, which focus on fine-tuning or prompting LLMs to use external APIs and models for task execution.",
    "domain_specific_simulation_agents": {
      "chemcrow": "Augmented with 13 expert-designed tools for chemistry tasks (organic synthesis, drug discovery).",
      "generative_agents": "Virtual characters in a sandbox environment that use a memory stream, reflection mechanism, and planning to simulate believable human behavior.",
      "autogpt_gpt_engineer": "Proof-of-concept examples for automated task completion and repository-level code generation."
    }
  },
  "evaluation_approaches": {
    "cycle_based_evaluation": "Using Thought-Action-Observation cycles (as in ReAct) to evaluate performance on knowledge-intensive and decision-making tasks.",
    "self_reflection_reward_models": "Frameworks like Reflexion use binary reward models and heuristic functions to detect hallucination or inefficient planning in failed trajectories.",
    "multi_level_tool_evaluation": "API-Bank evaluates tool-augmented LLMs at three levels: API calling, API retrieval, and multi-step planning.",
    "human_vs_llm_evaluation": "For expert domains like chemistry (ChemCrow), evaluations compared human expert assessments against LLM-based evaluations (e.g., GPT-4), noting that humans are often better at identifying chemical correctness while LLMs may struggle with self-evaluation in niche domains.",
    "safety_risk_assessment": "Using specific test sets (e.g., known chemical weapon agents) to evaluate an agent's ability to reject harmful requests."
  },
  "benchmarks": {
    "knowledge_intensive_tasks": [
      "HotpotQA",
      "FEVER"
    ],
    "decision_making_navigation": [
      "AlfWorld Env (robotic task simulation)",
      "WebShop (online shopping environment)"
    ],
    "tool_use_benchmarks": [
      "API-Bank (53 API tools and 264 annotated dialogues)"
    ],
    "training_preference_datasets": [
      "WebGPT comparisons",
      "Summarization from human feedback",
      "Human preference dataset (HH-RLHF)"
    ],
    "domain_specific_tests": "A curated test set of known chemical weapon agents for evaluating scientific discovery agents."
  }
}
