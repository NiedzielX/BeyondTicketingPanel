# Beyond panel — agent instructions

The canonical ML plan and shared project memory live in `NiedzielX/beyond`, at sibling `../beyond/` in the cloud workspace. Follow its `AGENTS.md`; do not create a competing ML strategy in this frontend repository. If only the panel is checked out, locate/read the canonical repository through the available authorized repository tools before changing forecasting semantics.

Canonical read order: `ml/MAE_RESEARCH_ROADMAP_V6.md` → `ml/EXECUTION_PLAN_CURRENT.md` → `ml/PROGRESS_TRACKING.md` → `ml/TRAJECTORY_FORECASTING_PLAN_V1.md` → `ml/NEXT_SESSION_HANDOFF.md`, then implementation/live state. Read shared `.ai/lessons.md` before implementation.

## Required shared records

- `../beyond/.ai/specs/YYYY-MM-DD-slug.md`: material changes and acceptance criteria before implementation. Completed specifications/evidence go to `implemented/`; withdrawn/superseded specifications go to `archive/`.
- `../beyond/.ai/runs/YYYY-MM-DD-slug.md`: each logical autonomous run records changes, checks, evidence, blockers and next action; update before handoff.
- `../beyond/.ai/lessons.md` and `../beyond/.ai/lessons/`: read and maintain reusable findings with evidence and limits. Link these shared records instead of duplicating a separate memory index.

These are documentation requirements, not additional approval gates for authorized work.

## Panel rules

Distinguish public available inventory, paid sales and attendance. Preserve immutable forecast vintages and genuine time coordinates. Missing outcomes do not mean MAE=0; explicit visible zero is not missing and does not establish paid sales/sellout. Invalid/missing feeds must not invent a fallback path.

Frozen model parameters, prospective windows and production flags belong to the backend contracts; UI work does not authorize changing them. Never place service-role credentials or private source exports in this public frontend. Browser test fixtures/screenshots must be explicitly synthetic and must not become a served production research feed.

Use real TypeScript/build checks and the existing parser/geometry/browser contracts appropriate to changes. Local npm access may be blocked while hosted checks pass; report each result accurately. Browser component tests are distinct from a deployed live-feed request and from ML accuracy.
