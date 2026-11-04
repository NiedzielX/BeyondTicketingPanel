# Beyond panel — Claude instructions

Follow this repository's `AGENTS.md` and the canonical backend `../beyond/AGENTS.md`. The shared ML strategy is Roadmap v6; current execution, progress and handoff live in the backend `ml/` directory. Do not reconstruct state from old commits or invent a frontend-specific ML plan.

Mandatory shared AI structure in `../beyond/.ai/`:

- `specs/YYYY-MM-DD-slug.md` for specifications before material work, with `specs/implemented/` and `specs/archive/` for completed or superseded records;
- `runs/YYYY-MM-DD-slug.md` for each logical autonomous run and its validation/handoff;
- `lessons.md` as the memory index, with detailed evidence-backed findings in `lessons/`.

Read existing lessons before implementation; update run/spec/lesson records after meaningful changes and before handing off. If the backend checkout is absent, locate the canonical repository using authorized tools. These requirements add no approval step to already authorized work.

Keep inventory/sales/attendance and pending-vs-zero outcomes separate. Preserve genuine timestamps, frozen model/evidence rules and production-off defaults. Keep credentials/private exports out of the frontend. Synthetic browser fixtures verify UI behaviour, not model MAE or a successful deployed data chain.
