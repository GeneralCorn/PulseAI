# Synthetic Pulse MVP PRD (24-hour build)

**Working name:** Synthetic Pulse (“Synthetic War Room”)
**Surface:** Next.js 16 web app (App Router)
**Core value:** Turn an idea + context into a **structured critique** from sampled personas (support/oppose) + risks + a recommended plan.

---

## 0) MVP framing

This PRD is intentionally **short and build-oriented** for a 24-hour MVP.
It focuses on: **features, workflows, use cases, architecture requirements, and UI/animation guidelines**.

---

## 1) Goals

### 1.1 MVP goals (must ship)
1. **Single Idea Evaluation**: user submits an idea + context and gets:
   - Persona/Demographic summary
   - For/Against arguments per persona
   - Risk types (categorized)
   - Final recommended plan + evaluation scorecard
2. **A/B Compare**: user submits 2+ ideas and gets:
   - Shared persona panel
   - Side-by-side pros/cons + risks
   - A winner recommendation + reasoning
3. **Persona Sampling**:
   - Select from an existing taxonomy (“target populations”), OR
   - Auto-generate stakeholder groups when user has no target
   - Include **psychographics** (values, motivations, anxieties, habits)
4. **Command Center UI**:
   - Debates and results displayed as a “war room” with **floating persona and risk blocks**
   - A decision-tree view (React Flow) that summarizes reasoning path

### 1.2 Non-goals (explicitly out of scope for MVP)
- Continuous “live” market research ingestion
- Reddit/social scraping pipelines
- Long-term user accounts, billing, teams, shared workspaces
- Fine-grained demographic truth claims (use “synthetic priors” for MVP)

---

## 2) Primary users & use cases

### 2.1 Users
- **Founder/Product builder**: validate product direction and messaging
- **Creative/Marketing**: validate campaign angles and positioning
- **Student/Indie maker**: sanity-check ideas quickly without surveys

### 2.2 Use cases
1. **Single Idea Evaluation**
   - “Is this feature concept likely to resonate? What will scare people? What objections come up?”
2. **A/B Compare**
   - “Which pitch / landing page angle is stronger for these stakeholders?”
3. **No-target scenario**
   - “I don’t know my audience. Identify likely stakeholders and pressure-test the idea.”

---

## 3) Core workflow (user-facing)

### 3.1 Common pipeline (both Single + A/B)
1. **Input**
   - Idea(s) title + description
   - Context: goals, constraints, target market (optional), success metric (optional)
   - “Critique intensity” dial (normal → harsh) = **Stochastic Mocking**
2. **Persona selection**
   - Choose from saved taxonomy packs (e.g., “CS students”, “moviegoers”, “parents”, “enterprise buyers”), OR
   - Auto-infer stakeholder groups from the idea and generate persona templates
3. **Persona sampling**
   - Sample N personas with seeded randomness for repeatability
4. **Simulation**
   - For each persona: generate stance (support/oppose/neutral), reasoning, and likely behaviors
   - Run structured debate: **Pro vs Con** plus a “Moderator” synthesizer
5. **Aggregation**
   - Cluster recurring themes
   - Score risks and opportunities
6. **Output**
   - Final plan + evaluation scorecard
   - Rendered with floating persona + risk blocks and a decision tree

### 3.2 Single idea flow
- Output emphasizes:
  - “Why people like it” vs “why they reject it”
  - “Top risks” + mitigations
  - “Recommended next step plan” (MVP scope, messaging, experiments)

### 3.3 A/B compare flow
- Output emphasizes:
  - Same personas react to each idea
  - Side-by-side stance deltas
  - A winner + conditions (“Idea A wins if X, otherwise B”)

---

## 4) MVP feature list

### 4.1 Input & configuration
- [ ] Idea form (single) + multi-idea form (A/B)
- [ ] Persona pack selector (dropdown) + “Auto-generate stakeholders” toggle
- [ ] Sliders:
  - Persona count (e.g., 6–20)
  - Critique intensity (Stochastic Mocking)
  - Debate rounds (1–3)

### 4.2 Outputs (core)
- [ ] Persona cards:
  - Name, demographic label(s), psychographic tags
  - Support/Oppose stance + short rationale
- [ ] For/Against panels:
  - Compact bullet arguments per persona
  - Expandable “thought process” (collapsed by default)
- [ ] Risk blocks (floating):
  - Risk type label, severity, likelihood, mitigation
- [ ] Final plan & evaluation:
  - Scorecard (e.g., desirability, feasibility, clarity, differentiation)
  - Next-steps plan (experiments + messaging recommendations)

### 4.3 Visualizations
- [ ] **React Flow** decision tree:
  - Root: “Idea”
  - Branches: Key claims → Objections → Mitigations → Recommendation
  - Click a node to highlight linked persona/risk cards

### 4.4 Persistence (minimal)
- [ ] History list (latest 10 simulations) stored in Supabase
- [ ] Re-run a prior simulation with same seed

### 4.5 Nice-to-have (only if time remains)
- [ ] Export JSON + “shareable link”
- [ ] PDF export (basic)
- [ ] Save custom persona packs in UI

---

## 5) Output contract (critical for reliability)

The simulator must return **structured JSON** so UI rendering is stable.

### 5.1 SimulationResult (high-level)
- `runId`, `createdAt`, `seed`
- `mode`: `single | compare`
- `ideas`: array of `{ id, title, description }`
- `personas`: array of persona objects
- `arguments`: per persona, per idea:
  - `stance`: `support | oppose | neutral`
  - `for`: bullet list
  - `against`: bullet list
  - `thoughtProcess`: short paragraph (collapsible)
- `risks`: array of risk objects with `type`, `severity`, `likelihood`, `mitigation`
- `scorecard`: numeric scores + short justification
- `recommendation`: winner (if compare) + summary
- `plan`: next steps checklist

---

## 6) Build requirements (architecture summary)

### 6.1 Tech stack
- **Next.js 16** (App Router), TypeScript
- **UI**: Tailwind + shadcn/ui
- **Animations**: Framer Motion
- **Graph**: React Flow
- **DB**: Supabase
- **LLM**: Keywords AI (Router)

### 6.2 Core modules (suggested file layout)
- `src/lib/sim/`
  - `simulator.ts` (orchestrator)
  - `types.ts` (contracts)
  - `personaPacks.ts` (seed taxonomy + psychographics)
  - `promptTemplates.ts`
  - `scoring.ts` (aggregation)
- `src/app/`
  - `/` (landing / input)
  - `/run/[id]` (command center results)
  - `/history` (recent runs)

### 6.3 Runtime pattern
- UI submits input → Server Action `runSimulation()` →
  - calls `simulator.ts` →
  - persists `SimulationResult` →
  - navigates to `/run/[id]`

### 6.4 Performance constraints (MVP)
- Target: 15–45 seconds for a run (depending on persona count)
- Streaming is optional for MVP, but JSON must be valid at the end.

---

## 7) UI/UX + animation guidelines

### 7.1 “Command Center” layout
- Left: **Persona swarm** (floating cards)
- Right: **Result panels** (tabs)
  - Summary
  - For/Against
  - Risks
  - Plan
- Bottom or side: **Decision Tree** (React Flow)

### 7.2 Floating blocks (“war room feel”)
- Persona cards and risk blocks gently drift using Framer Motion:
  - Small position variance, slow duration, looped
  - Hover: pause drift + elevate (shadow + scale)
  - Click: pin/spotlight and filter the panels to that entity

### 7.3 Interaction rules
- Selecting a persona:
  - highlights their arguments across panels
  - highlights linked nodes in the decision tree
- Selecting a risk:
  - highlights mitigations and affected personas/ideas
- A/B view:
  - same persona card persists; panels switch per idea

### 7.4 Visual style
- Dark “ops room” theme (high contrast text)
- Card UI: rounded-xl, subtle blur/backdrop, thin borders
- Avoid noisy backgrounds; rely on motion + hierarchy

---

## 8) Acceptance criteria (demo-ready)

### Single idea
- User enters idea + context → selects persona pack or auto-generate → run
- Output shows:
  - at least 8 personas with stances
  - for/against bullets
  - ≥5 risks with mitigations
  - final plan + scorecard
  - floating persona/risk blocks in UI
  - decision tree summarizing reasoning

### A/B compare
- User enters two ideas → run
- Output shows:
  - same personas responding to both
  - a winner recommendation + “when it changes”
  - side-by-side pros/cons and risks

---

## 9) 24-hour build plan (suggested)

1. **Hour 1–3**: Data contracts + simulator skeleton (mock outputs)
2. **Hour 4–8**: Server action + persistence + run page routing
3. **Hour 9–14**: Command Center UI (cards, panels, selection state)
4. **Hour 15–18**: React Flow decision tree + linking interactions
5. **Hour 19–22**: LLM integration + prompt shaping + JSON validation
6. **Hour 23–24**: polish (motion, empty states, error handling)
