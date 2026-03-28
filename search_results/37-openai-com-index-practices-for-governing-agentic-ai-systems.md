# https://openai.com/index/practices-for-governing-agentic-ai-systems/

**Source:** https://openai.com/index/practices-for-governing-agentic-ai-systems/  
**Latency:** 588.46s  
**Extraction goal:** Extract information about OpenAI's practices for governing agentic AI systems. Include: evaluation recommendations, safety considerations, and benchmarks mentioned.  

## Extracted Content

{
  "OpenAI Agentic AI Governance": {
    "Evaluation Recommendations": [
      "Decomposition: Break complex agent goals into independent subtasks (e.g., information gathering vs. calculations) and evaluate each subtask separately.",
      "End-to-End Testing: Conduct testing in conditions that closely mimic real-world deployment, as small errors can magnify when actions are chained together.",
      "Risk-Based Prioritization: Apply more rigorous evaluation to high-risk actions, such as financial transactions or autonomous tool use.",
      "Capability Checks: Model developers should proactively test for \"misuse capabilities,\" such as the ability to assist in cyberattacks or generate targeted propaganda.",
      "Human-Agent Interaction: Evaluate how users and agents interact together, as some failure modes only emerge within these loops."
    ],
    "Safety Considerations": {
      "Operational Safety Practices": [
        "Action Constraints: Use human-in-the-loop approvals for high-stakes tasks, sandboxing, and per-action timeouts.",
        "Conservative Defaults: Systems should favor \"least-disruptive\" actions, surface uncertainty, and ask clarifying questions rather than guessing user intent.",
        "Legibility & Transparency: Maintain an \"action ledger\" and expose the agent's internal reasoning (Chain-of-Thought) so users can inspect its behavior.",
        "Automatic Monitoring: Use secondary AI models to monitor and flag anomalous or risky behavior in real-time.",
        "Interruptibility: Ensure that users can terminate an agent at any time, with clear fallback procedures for mid-sequence interruptions.",
        "Attributability: Link agent instances to specific user identities for accountability in high-stakes interactions."
      ],
      "Systemic Safety Risks": [
        "Adoption Races: The risk of premature deployment due to competitive pressure.",
        "Correlated Failures: Risks arising from \"algorithmic monoculture,\" where many agents share the same underlying model and fail simultaneously.",
        "Offense-Defense Shifts: Potential changes in security balances (e.g., in cybersecurity)."
      ]
    },
    "Benchmarks Mentioned": [
      "Focus on Empirical Testing: Instead of standardized scores, the emphasis is on capability-specific checks (e.g., testing if an agent can successfully execute a specific harmful cyber-routine).",
      "Operational Validation: Recommends tests to verify that safety constraints (like sandboxes) and monitoring systems actually hold under pressure.",
      "Open Research Problem: The paper explicitly identifies the creation of \"sufficient\" benchmarks for agentic systems\u2014and determining which party (developer vs. deployer) is responsible for them\u2014as a critical open research and policy question."
    ],
    "Overview": "OpenAI's practices for governing agentic AI systems, as detailed in their publication and associated white paper, focus on a \"defense-in-depth\" approach to safety and accountability. The article and paper do not prescribe specific standardized numeric benchmarks, noting that the field is still maturing. The paper emphasizes that system deployers must thoroughly assess if an agent is suitable for its intended task and environment. Safety is addressed through both operational practices and the mitigation of systemic risks."
  }
}
