Here’s the full, updated prompt with Fable 5 orchestration, delegation, intuitive README, and `CLAUDE.md` workflow baked in. [anthropic](https://www.anthropic.com/claude/fable)

***

## Full prompt for Fable 5 and supporting agents

Design a highly visual, touch-first Progressive Web App for iPad and other screens that teaches nine-year-olds about the periodic table through material science.

### Role and model usage

You are the *orchestrator* agent running on Claude Fable 5.  
Your job is to handle the hardest parts of the work: planning, decomposition, design decisions, content quality, and final integration. [ddshub](https://www.ddshub.cc/en/blog/claude-fable-5-ai-agents)

You may delegate well-scoped, mechanical, or repetitive subtasks to other agents/models (for example: Sonnet/Opus/Haiku or similar) whenever this is more efficient, and then review their output before using it. [lushbinary](https://lushbinary.com/blog/build-long-horizon-ai-agents-claude-fable-5-guide/)

Use Fable 5 for:
- Overall product and learning strategy.  
- Information architecture and UX flows.  
- Pedagogical design and content correctness.  
- Non-trivial tradeoffs (performance vs visuals, PWA architecture choices, offline strategy).  
- Risk/edge-case analysis and safety checks for kids and parents. [linkedin](https://www.linkedin.com/posts/andriy-bilous-32718aa7_ai-activity-7470842586497351680-KjlC)

Delegate to other agents for:
- Generating long lists of element trivia and non-critical copy.  
- Producing boilerplate code, CSS scaffolding, or simple component shells.  
- Creating structured JSON/YAML data for elements and materials.  
- Summarizing standards docs or API references. [developersdigest](https://www.developersdigest.tech/blog/fable-5-orchestrator-model-playbook)

When delegating:
- Define a clear subtask and expected output format.  
- Pass only the minimal context needed.  
- Inspect and, if necessary, correct sub-agent results before integrating them. [platform.claude](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)

***

### CLAUDE.md workflow

Use a `CLAUDE.md` file in the project root to make it easy to start, pause, resume, and document progress on this PWA. [knightli](https://knightli.com/en/2026/06/10/claude-fable-5-prompting-guide/)

You must:
- Read `CLAUDE.md` at the start of each work session and treat it as the source of truth for current goals, constraints, and active tasks. [knightli](https://knightli.com/en/2026/06/10/claude-fable-5-prompting-guide/)
- Update `CLAUDE.md` at the end of each major step with:  
  - Current state (what’s done, what’s in progress, what’s blocked).  
  - Decisions made and why they were chosen (especially architecture, UX, and content rules).  
  - The next 2–3 concrete actions another agent or future you should take. [ayautomate](https://www.ayautomate.com/blog/claude-fable-5-system-prompt-leak)

Assume (or create) sections like:

```markdown
# Project: Periodic Table Material Science PWA

## Current goal
<short description of the current objective for this work session>

## Constraints
<non-negotiable rules: safety for kids, factual accuracy, performance, tech stack limits>

## Active tasks
- [ ] Task 1 …
- [ ] Task 2 …
- [ ] Task 3 …

## Decisions and rationale
- Decision: …
  - Why: …

## Progress log
- YYYY-MM-DD HH:MM – What was done, what changed, what remains.

## Next steps
- [ ] Clear, small actions that another agent or future session can pick up.
```

Use this file to:
- Start work: read **Current goal** and **Constraints** before proposing changes.  
- Pause or stop: write a short update under **Progress log** and refresh **Next steps**.  
- Resume: align on **Active tasks** and **Progress log**, then continue from **Next steps**. [productcompass](https://www.productcompass.pm/p/claude-fable-5-guide)

Interaction with other agents:
- When delegating subtasks, add their assignments to **Active tasks** in `CLAUDE.md` with a clear owner and expected output format.  
- When their work returns, summarize results and corrections in **Decisions and rationale** plus **Progress log**.  
- Keep `CLAUDE.md` focused on reusable lessons and decisions, not raw chat transcripts. [kenhuangus.substack](https://kenhuangus.substack.com/p/claude-fable-5-what-changed-and-how)

***

### Product goal and audience

Goal: create a kid-friendly learning experience that makes abstract chemistry feel concrete, memorable, and fun.

Audience and tone:
- Age 9, curious, playful, visually rich, simple language, no condescension.  
- The experience should feel like a game with real educational value.

Core learning outcomes:
- Help children recognize major elements and a few of their most interesting properties.  
- Connect each element to real-world materials, uses, and “why it matters.”  
- Encourage exploration, comparison, and recall through play.

***

### Functional requirements

Must include:
- Element profiles with superpowers, real-world uses, origin stories, and trivia.  
- A “Material Detective” mode that guides children to identify materials by clues.  
- Sliders or comparisons for properties such as hardness, weight, and conductivity.  
- A “Material Match” game.  
- A mascot-led narrative and progress tracking.  
- Safe, parent-approved experiment ideas.  
- Lightweight 3D or visual approaches for crystal structures using WebXR, CSS, Canvas, or other browser-native techniques.

Experience requirements:
- Highly visual, touch-optimized tablet experience.  
- Responsive layout that works across screen sizes.  
- Smooth animations and strong performance.  
- Clear navigation and accessibility for children.

***

### Technical and content requirements

Technical architecture:
- High-performance, offline-first PWA.  
- Use Service Workers for offline access and local caching.  
- Optimize asset loading for images/animations on tablets.  
- Favor browser-native solutions over heavy dependencies when possible.  
- Design for maintainability, testability, and incremental feature updates.

Content requirements:
- Factually accurate and well-researched.  
- Clear separation between scientific facts and playful metaphors.  
- Age-appropriate but scientifically meaningful explanations.  
- Make the bridge from chemistry concepts to material engineering explicit and understandable.

***

### README requirement (Fable 5 responsibility)

At the end of your response, produce an intuitive `README.md` for the project. Treat this as part of the deliverable, not an afterthought. [lushbinary](https://lushbinary.com/blog/claude-fable-5-prompting-guide/)

The README must:
- Explain the app’s purpose in one short, kid–parent-friendly paragraph.  
- Describe the main features and learning goals in clear bullet points.  
- Document the tech stack, key architectural decisions, and offline-first behavior.  
- Show how to install, run, and test the PWA locally (Service Worker setup, build/dev commands, environment variables).  
- Explain how to add or update element content safely (data structure, validation rules, and where scientific facts should be sourced/checked).  
- Include a brief section on performance considerations for tablets (asset optimization, caching, profiling).  
- Include a short “Contributing” section with guidelines for new lessons, experiments, or UI components.

You may delegate boilerplate sections (like installation commands or dependency lists) to other agents, but you are responsible for verifying and integrating their output into a coherent README.

***

### How to respond

Structure your response in the following sections:

1. App concept and learning structure.  
2. Information architecture and main user flows.  
3. UI/UX system for kids (navigation, feedback, gamification).  
4. Technical architecture and performance/offline strategy.  
5. Screen, component, and interaction list.  
6. Delegation plan: which subtasks you would route to other agents and how you would validate them.  
7. Risk, edge cases, and content-safety considerations.  
8. Phased build plan (MVP → beta → polished release).  
9. `README.md` draft that reflects the design and architecture you proposed.  
10. Initial `CLAUDE.md` content suitable for the project root, aligned with your plan.

***

### Constraints

- Do not invent scientific facts; state clearly where you’d need external validation or datasets.  
- Do not add features that don’t clearly improve learning, usability, or reliability.  
- Keep explanations concise but precise; prioritize decisions and tradeoffs over generic advice.  
- Avoid exposing your internal reasoning verbatim; focus on final recommendations and plans. [platform.claude](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)

***

You can paste this entire prompt into Fable 5 as a single request; it matches current guidance that emphasizes clear objectives, output formats, and lightweight scaffolding over ultra-verbose step-by-step instructions. [youmind](https://youmind.com/landing/x-viral-articles/claude-fable-5-prompting-guide)
