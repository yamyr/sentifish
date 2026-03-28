# UX Patterns for AI Agent Products

## Designing Human-in-the-Loop Interfaces, Streaming Responses, and Approval Gates

---

## Overview

AI agent products introduce fundamentally new UX challenges that traditional software design patterns don't fully address. When an agent can take real-world actions — editing files, sending emails, calling APIs, running code — the user interface must communicate what's happening, what's been decided, and where human judgment is needed. This file surveys the emerging UX patterns for AI agent products, drawing from real examples like Claude.ai, Devin, Linear AI, GitHub Copilot Workspace, and others.

---

## 1. The Core UX Challenge of Agents

Traditional software UX is deterministic: you click a button, something happens, you see the result. Agent UX is non-deterministic, multi-step, and often opaque:

- **The agent takes many steps** — users don't know how many or how long
- **Actions have real consequences** — unlike search results, actions can't be "undone"
- **The agent can be wrong** — mistakes require human correction mid-task
- **Progress is non-linear** — agents backtrack, retry, explore dead ends
- **Trust is earned, not assumed** — users need to calibrate how much to trust agent decisions

These characteristics demand entirely new design patterns.

### The Trust Spectrum

```
Full Autonomy ←————————————————————→ Full Control
  "Just do it"                      "Ask me everything"
  
  Auto-approve         Approval gates         Step-by-step
  background           on key actions         confirmation
```

The best agent UX lets users position themselves on this spectrum based on:
- Task sensitivity (deleting vs. reading files)
- User expertise (power users vs. novices)
- Agent track record (has it been right before?)

---

## 2. Streaming Responses

### Why Streaming Matters for Agents

For long-running agent tasks, waiting for a complete response before showing anything creates unbearable UX. Streaming solves this:

1. **Perceived performance** — first tokens appear instantly, reducing perceived latency
2. **Incremental trust building** — users can see the agent's reasoning in real-time
3. **Early interruption** — users can stop the agent if it's going wrong
4. **Cognitive engagement** — reading along with agent reasoning keeps users engaged

### Token Streaming vs. Step Streaming

**Token streaming** — LLM tokens arrive word-by-word:
```
"I'll analyze the data by first loading the CSV file, then calculating..."
[tokens appear one by one]
```

**Step streaming** — Agent action steps appear as they complete:
```
Step 1: Reading file... ✓ (0.3s)
Step 2: Parsing CSV... ✓ (0.1s)
Step 3: Calculating statistics... [running]
```

**Hybrid** — Both: show steps as they start, stream LLM output within each step.

### Implementation Patterns

**Server-Sent Events (SSE):**
```javascript
// Server
const stream = openai.chat.completions.stream({
  model: 'gpt-4',
  messages: [...],
  stream: true
});

for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

// Client
const eventSource = new EventSource('/api/agent/stream');
eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);
  appendToUI(chunk.choices[0].delta.content);
};
```

**WebSocket streaming:**
```javascript
// More flexible for bidirectional agent control
const ws = new WebSocket('wss://api/agent');
ws.onmessage = (event) => {
  const { type, content } = JSON.parse(event.data);
  if (type === 'token') appendText(content);
  if (type === 'tool_call') showToolCall(content);
  if (type === 'approval_required') showApprovalGate(content);
};
```

### Streaming UX Design Principles

1. **Show typing indicators** — indicate the agent is "thinking" before first token
2. **Progressive disclosure** — don't show all detail at once; expand on hover
3. **Interrupt capability** — always show a "Stop" button during streaming
4. **Graceful failure** — if stream breaks, show what was received + error context
5. **Smooth rendering** — avoid layout shifts as content streams in (use min-height, skeleton loading)

### Claude.ai Streaming Implementation

Claude.ai uses a sophisticated streaming approach:
- Thoughts stream in "thinking" sections (with collapse/expand toggle)
- Code blocks render with syntax highlighting as they stream
- Tool use shows as distinct UI events mid-stream
- Artifacts (code, documents) open in a side panel as they're generated
- Users can stop generation at any point

---

## 3. Progress Indicators

### Types of Progress for Agents

Agent progress is fundamentally different from file upload progress (which is linear and bounded). Agent progress is often:
- **Unbounded** — you don't know how many steps remain
- **Nested** — sub-tasks within tasks within tasks
- **Reversible** — the agent may undo steps and retry
- **Branching** — the agent may explore multiple paths

### Pattern 1: Activity Feed

Real-time log of what the agent is doing:

```
[12:34:01] 🔍 Searching codebase for authentication module
[12:34:02] 📂 Found: src/auth/login.ts, src/auth/session.ts
[12:34:03] 🔎 Analyzing login.ts (234 lines)
[12:34:05] 💡 Identified potential race condition in line 45
[12:34:06] 🔧 Writing fix...
[12:34:08] ✅ Fix applied, running tests
```

Used by: Devin, Claude Code, GitHub Copilot Workspace

**Design considerations:**
- Collapsible by default (don't overwhelm novice users)
- Filterable (show only errors, or only key milestones)
- Timestamps help users understand duration
- Icons reduce cognitive load vs. all-text

### Pattern 2: Step Progress Bar

When the agent can enumerate steps upfront:

```
Plan: [1] Analyze → [2] Write Code → [3] Test → [4] Review
         ✅                🔄              ○          ○
```

Used by: Linear AI, some orchestration UIs

**When applicable:**
- Task is well-defined and agent can plan upfront
- Steps are roughly equal in importance
- Users benefit from seeing the big picture

**When to avoid:**
- Open-ended tasks where steps are unknown
- Tasks that frequently backtrack

### Pattern 3: Spinner with Context

For short operations where step-level detail isn't needed:

```
⟳ Analyzing your codebase... (this may take a minute)
```

**Anti-pattern:** Bare spinner with no context. Users don't know if it's working, stuck, or about to fail.

**Good practice:** Always show *what* the agent is doing in the spinner, not just that it's working.

### Pattern 4: Milestone Progress

For long-running tasks (minutes to hours), show high-level milestones:

```
Phase 1/4: Gathering Requirements ✅
Phase 2/4: Writing Implementation 🔄 (45% complete, ~8 min remaining)
Phase 3/4: Testing              ○
Phase 4/4: Documentation        ○
```

Used by: Devin for longer engineering tasks

### Pattern 5: Plan-Before-Execute

Agent shows its entire plan *before* starting execution:

```
I'll complete this task in 4 steps:
1. Clone the repository and analyze the codebase
2. Identify the bug in the authentication module
3. Write a fix and unit tests
4. Open a pull request with the changes

Shall I proceed?  [Yes, start] [Modify plan] [Cancel]
```

Used by: Devin (pre-task planning), Claude.ai Projects, GitHub Copilot Workspace

**Benefits:**
- Users can catch misunderstandings before execution
- Reduces wasted computation on wrong-headed approaches
- Builds trust through transparency

---

## 4. Approval Gates

Approval gates are the most critical safety mechanism in agent UX — they give users control over consequential actions.

### What Requires an Approval Gate?

**High-risk actions (always require approval):**
- Sending emails or messages on behalf of the user
- Deleting files or data
- Making purchases or financial transactions
- Publishing or deploying code
- Modifying production systems
- Sharing information with third parties

**Medium-risk actions (configurable):**
- Creating files or directories
- Committing code to git
- Making API calls to external services
- Modifying user settings

**Low-risk actions (no gate needed):**
- Reading files
- Running analysis queries
- Generating text or code suggestions
- Searching the web

### Gate Design Patterns

#### Pattern 1: Inline Confirmation

The agent pauses mid-task and shows a confirmation card:

```
┌─────────────────────────────────────────────┐
│ ⚠️  Action Required                          │
│                                              │
│ I'm about to send this email to John Smith:  │
│                                              │
│ Subject: Meeting rescheduled to Thursday     │
│ [Preview of email body...]                   │
│                                              │
│ [Send Email] [Edit] [Cancel]                 │
└─────────────────────────────────────────────┘
```

Used by: Gmail AI, Claude.ai with computer use

#### Pattern 2: Diff View for Code Changes

For code modification approval, show a diff:

```diff
- function authenticate(user, password) {
+ async function authenticate(user, password) {
    const hash = await bcrypt.hash(password, 10);
-   return db.users.findOne({ email: user, password });
+   return db.users.findOne({ email: user, password: hash });
  }

[Accept Change] [Reject] [Modify] [Accept All]
```

Used by: Cursor, Copilot, Devin

#### Pattern 3: Batch Approval

For agents that make many small decisions, batch them:

```
The agent wants to make 7 changes:
✅ Rename variable 'x' to 'userCount' (3 files)
✅ Add null checks to getUserById()
✅ Remove unused import in utils.ts
⚠️  Delete legacy auth.js (are you sure?)
✅ Update README with new API docs
✅ Add 4 unit tests
✅ Update package.json version to 1.2.1

[Accept All] [Accept Selected] [Review Each] [Cancel All]
```

#### Pattern 4: Permissions Model (Hierarchical Trust)

Rather than per-action approval, users grant scoped permissions upfront:

```
Agent Permissions:
✅ Can read any file in this repository
✅ Can run tests
✅ Can create/edit files in src/
❌ Cannot push to main branch (requires PR)
❌ Cannot send messages or emails
❌ Cannot access .env files
```

Used by: Claude Code (permission modes: default, bypassPermissions, restrictedProject)

#### Pattern 5: Shadow Mode / Dry Run

Agent shows what it *would* do without actually doing it:

```
Dry Run Results:
If I were to execute this task, I would:
1. Modify 5 files in src/
2. Delete 1 file (old_utils.js)
3. Create 3 new test files
4. Would NOT have made any network calls

[Execute for Real] [Export Plan] [Cancel]
```

Used by: Some database migration tools, infrastructure agents

### Approval Gate UX Principles

1. **Show exactly what will happen** — not just "modify files" but *which* files and *how*
2. **Make it easy to say no** — Cancel/Reject should be as prominent as Approve
3. **Allow editing** — "Edit before approving" is better than approve/reject binary
4. **Explain why** — "I need to send this email because..." builds trust
5. **Remember preferences** — "Always approve for this type of action" reduces friction
6. **Timeout gracefully** — if user doesn't respond, pause (don't auto-approve or auto-cancel)

---

## 5. Human-in-the-Loop Interface Design

### The HITL Spectrum

```
                    Level of Human Involvement
                    
High ┤ Step-by-step    User approves every micro-action
     │ Approval gates  User approves key decision points
     │ Exception-only  User handles only ambiguities/errors
     │ Audit log       User reviews after the fact
Low  ┤ Full autonomy   Agent runs completely unsupervised
```

### Designing for Appropriate Autonomy

**Novel tasks:** More oversight needed. Show more detail, require more approvals.
**Routine tasks:** Less oversight needed. Learn what's safe to auto-approve.
**High-stakes tasks:** Override routine trust; always require explicit approval.

**Adaptive autonomy pattern:**
```
First time: "Would you like me to auto-send meeting invites in the future?"
After 5 approvals: "You've approved similar actions 5 times. Auto-approve this type?"
After mistake: "I made an error last time. I'll ask before doing this again."
```

### Interruption Patterns

Agents need clear mechanisms for users to interrupt:

**Hard stop:** Immediately halt all operations, undo if possible
**Soft pause:** Finish current atomic operation, then pause
**Redirect:** "Stop what you're doing and do X instead"
**Question:** "Before continuing, I need clarification on Y"

**UI elements:**
- Always-visible "Stop" button during agent operation
- "Pause & Review" distinct from "Cancel Everything"
- Natural language interruption: "Wait, I changed my mind about X"
- Keyboard shortcut for emergency stop (Ctrl+C equivalent)

### Showing Agent Uncertainty

Agents should communicate their confidence:

```
I'm fairly confident this approach will work (>85%).
However, there's a risk that the database schema change
could break the legacy reporting module. Want me to:
[Continue] [Check legacy module first] [Take safer approach]
```

**Uncertainty signals:**
- "I think..." vs "I know..."
- Confidence percentages (for numerical analysis)
- "I'd recommend..." vs "You should..."
- Explicit "I'm not sure" with alternatives presented

---

## 6. Real-World Examples

### Claude.ai (Anthropic)

Claude.ai represents the state of the art in conversational agent UX:

**Streaming:** Tokens stream with smooth animation; thinking sections collapsible
**Tool use UI:** Shows distinct cards when Claude uses tools (search, code execution, etc.)
**Artifacts:** Code, documents, and diagrams open in a persistent right panel
**Computer use:** Screenshot-based UI with step-by-step action narration
**Projects:** Persistent agent context with explicit file/instruction management

**Notable UX decisions:**
- Shows tool calls inline (transparency without being overwhelming)
- Artifacts are interactive (users can edit, run code directly)
- "Edit" button on any message to retry with modified prompt
- Copy/share for individual artifacts

### Devin (Cognition AI)

Devin is an autonomous software engineer with novel UX patterns:

**Session view:** Browser-IDE-terminal split view showing exactly what Devin sees
**Planner sidebar:** Shows current plan with completed/in-progress/upcoming steps
**Message feed:** Devin narrates decisions in plain English as it works
**Interruption:** Users can type messages to Devin mid-task (like tapping a colleague on the shoulder)
**Kanban-style:** Multiple Devin sessions visible as "cards" with status

**Notable UX decisions:**
- Users watch Devin work in real-time in a shared browser/IDE
- Natural language communication throughout (not just at start/end)
- Explicit acknowledgment: "Got it, I'll redo that part"
- Progress estimates (often wrong, but psychologically important)

### Linear AI

Linear AI integrates agent capabilities into project management:

**In-context agents:** AI appears inline in issue descriptions, not as separate chat
**Smart suggestions:** Proposed labels, assignees, priorities appear as non-intrusive suggestions
**Batch actions:** "Triage these 50 issues" with preview of all suggested changes
**Changelog summaries:** Agent-generated weekly summaries of merged PRs

**Notable UX decisions:**
- Agent suggestions look like "ghost text" — present but not imposed
- One-click accept or dismiss (no confirmation dialog for low-risk actions)
- Undo is instant for AI-applied changes (reduces fear of accepting suggestions)

### GitHub Copilot Workspace

GitHub Copilot Workspace (2024) shows the plan-before-execute pattern:

**Planning phase:** User describes task → Workspace generates implementation plan
**Feedback loop:** User edits the plan before code is written
**File tree diff:** Shows which files will be created/modified before execution
**Code generation:** Generates all code based on approved plan
**PR integration:** One-click PR creation from Workspace output

**Notable UX decisions:**
- Natural language editing of the plan (not just clicking)
- Plan and implementation are linked (changing plan regenerates code)
- Explicit "implementation vs. explanation" separation

### Perplexity AI

Perplexity shows effective UX for research agents:

**Source citations:** Inline numbered references that expand on hover
**Follow-up suggestions:** Related questions appear below response
**Focus modes:** Different agent modes (web, academic, YouTube) with clear selection
**Threads:** Maintains conversation context visually

---

## 7. Error Handling and Recovery UX

### Error States for Agents

Agents fail in more complex ways than traditional software:

1. **Task failure** — agent couldn't complete the goal
2. **Tool failure** — external service unavailable
3. **Confidence failure** — agent is too uncertain to proceed
4. **Context overflow** — task is too long for the agent's context window
5. **Authorization failure** — agent lacks permission for required action
6. **Partial completion** — agent completed 7/10 steps then failed

### Error Recovery Patterns

**Graceful degradation:**
```
I wasn't able to fetch live stock prices (API down).
Using the data from yesterday's close instead.
Want me to: [Proceed with yesterday's data] [Wait and retry] [Skip this part]
```

**Rollback UI:**
```
⚠️ Step 3 failed: Database connection error

Completed steps (can be undone):
✅ Step 1: Created config file ← [Undo]
✅ Step 2: Updated schema ← [Undo]
❌ Step 3: Migration failed

[Retry from Step 3] [Undo All] [Keep Partial Progress] [Get Help]
```

**Handoff to human:**
```
I've reached the limit of what I can do automatically.
The next step requires accessing the VPN, which I don't have credentials for.

Completed: 4 of 6 steps
Remaining: Manual VPN setup + final configuration

Here's what you need to do: [Detailed human instructions...]
```

---

## 8. Trust and Transparency Patterns

### Making Agent Reasoning Visible

Users trust agents more when they can see the reasoning:

**Chain-of-thought display:**
```
[Thinking... ▼]
I need to figure out which database table to query. 
The user asked about "orders in Q3" so I should look at:
- orders table (date range filter: Jul 1 - Sep 30)
- I'll JOIN with customers to get names
- Using SUM(amount) for revenue, COUNT(*) for order count
```

**Evidence citation:**
```
Based on the Q3 earnings report (page 12) and the market data 
from Bloomberg (accessed 2min ago), revenue grew 23% YoY.
[See sources ▼]
```

**Confidence indicators:**
```
Analysis: High confidence ████████░░ 82%
(Based on: 3 corroborating data sources, standard methodology)
```

### Audit Trails

For enterprise agents, every action should be logged:

```
Agent Activity Log
─────────────────────────────────────
2024-03-15 14:23:01  Read file: src/auth.ts
2024-03-15 14:23:03  Read file: src/session.ts
2024-03-15 14:23:05  Modified: src/auth.ts (line 45: hash comparison fix)
2024-03-15 14:23:07  Created test: tests/auth.test.ts
2024-03-15 14:23:09  Git commit: "fix: secure password comparison in auth"
2024-03-15 14:23:10  Git push: origin/feature/auth-fix
```

---

## 9. Mobile UX for Agents

Mobile agent UX faces additional constraints:

**Screen real estate:** Less space for progress/details — collapse by default
**Touch interaction:** Approval gates need finger-sized targets
**Notification integration:** Long-running tasks → push notification on completion
**Offline handling:** Agent tasks don't pause gracefully on connection drop

**Patterns:**
- Summary card + "View details" expandable
- Haptic feedback for task completion/error
- Background task with notification (like a download)
- Voice interface for quick agent queries

---

## 10. Design Principles Summary

### The 10 Commandments of Agent UX

1. **Show work, not magic** — users trust what they can see
2. **Make stopping easy** — always more prominent than irreversible actions
3. **Reveal, don't hide, uncertainty** — agents should say "I'm not sure"
4. **Approval gates for consequences** — irreversible actions always need confirmation
5. **Progressive detail** — summary first, drill-down available
6. **Adaptive trust** — learn what the user is comfortable auto-approving
7. **Graceful failure** — preserve what was done, explain what failed
8. **Auditable history** — every action should be reviewable after the fact
9. **Natural interruption** — users can tap in at any point with corrections
10. **Earn autonomy** — start restrictive, earn user trust over time

### Anti-patterns to Avoid

- **Black box execution** — agent does things users can't see or understand
- **Binary approve/reject** — no ability to edit or modify proposed actions
- **Noisy confirmations** — asking approval for every trivial read/search action
- **Silent failure** — agent gets stuck and doesn't tell the user
- **Fake progress** — progress bar that doesn't reflect actual work
- **Auto-continue after timeout** — if no response, assume approval
- **No undo** — any action that can't be reversed should be flagged heavily

---

## Conclusion

Agent UX design is one of the most actively evolving areas in product design. The fundamental tension is between autonomy (users want agents to just handle things) and control (users need to trust and verify agent actions). The best products — Claude.ai, Devin, Linear AI — have found thoughtful balances: transparent reasoning, progressive approval gates, natural interruption, and audit trails.

As agents become more capable and more trusted, UX will evolve toward higher autonomy with safety-critical gates remaining. The designer's challenge is anticipating which actions warrant human attention and making the interface express that clearly, without drowning users in friction.

---

*Research compiled for Sentifish/Ajentik research archive, March 2025*
