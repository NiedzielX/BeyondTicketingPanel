# Beyond Ticketing Panel

Frontend for monitoring Beyond Ticketing data quality, event ingestion and ML-facing operational state.

## Current ingestion UX — 2026-10-25

The panel no longer treats only future canonical events as the visible universe.

It surfaces:

- tracked ticket events;
- protected pre-mapping buffers;
- schedule gaps;
- source family / ingestion source;
- recent completed matches;
- actionable ingestion reason where a fixture is not yet model-facing.

### Events view

Available scopes:

- `Nadchodzące`
- `Zakończone`
- `Wszystkie`

Completed matches remain visible after kickoff, preventing valid historical booking curves from appearing to disappear from the product.

## Backend contract

Shared Supabase status contract:

`public.dashboard_ticketing_ingestion_status_v1`

Current payload version:

`dashboard-ticketing-ingestion-status-v2`

The contract combines the current multi-source ingestion state, including RoboTicket and Stellis acquisition paths.

## Ingestion states

Important UI states include:

- `TRACKED`
- protected buffering / pre-mapping states
- `SCHEDULE_GAP`
- recent completed / historical tracked states

Unknown or hidden inventory is not represented as zero.

Ambiguous ticket products are not treated as matches.

## Source coverage

Current alias-resolved Ekstraklasa home-club source coverage is **18/18**.

This means every current league home club has at least one active acquisition path. It does not mean every future fixture already exposes public inventory or is immediately model-safe.

Backend source-safety logic remains canonical in the `NiedzielX/beyond` repository.

## Daily inventory-path research preview — 2026-11-03

The event detail page has a separate chart for real daily-path model outputs. It reads the versioned `daily-inventory-path-preview-v1` JSON export from `/research/daily-inventory-path-v1.json`, or the optional `VITE_DAILY_INVENTORY_PATH_URL`. A research runner can place its generated export in `public/research/daily-inventory-path-v1.json` for local preview. No example/model-generated dataset is bundled by default.

The chart uses observed `available_total`, exact issue/target timestamps, a real time/P-N axis and only the future values present in the model payload. Earlier issue vintages remain selectable. It does not construct a future path from final-attendance P50. Missing exports display an empty state; malformed or incomplete paths are rejected. This preview is not a deployed prospective validation stream or confirmed net ticket sales.

The featured-match mini-chart now shows observed public availability only. The separate attendance chart is labelled as the history of forecasts of the terminal result.

Contract and geometry checks can run without frontend dependencies using Node 24:

```sh
node --experimental-strip-types --test src/services/dailyInventoryPathService.test.ts src/components/charts/dailyInventoryPathGeometry.test.ts
```

The normal application checks remain `npm run lint` and `npm run build` after installing dependencies.

## Existing C1 v8 live-shadow scoreboard — 2026-11-04

Forecast Accuracy includes a separate global C1 v8 section, read with the browser's existing publishable role from `dashboard_c1_shadow_v8_status_v1`. It displays the governed policy, raw expert and shared-prior latest-per-event attendance MAEs, scored independent events, prediction coverage and latest score/prediction timestamps. Representative-window MAE is labelled separately. This section always covers all clubs and does not inherit the page's club filter or substitute the structural forecast table's metric.

Missing/invalid data produces an explicit missing/error state; zero scored events require null MAE. A scored zero error is valid. Refresh is explicit. No experimental model is activated, and no service credential or frozen score is changed. This section describes existing C1 v8, not the new separately collecting training-expansion candidate.

The eight C1 parser checks run with `node --experimental-strip-types --test src/services/c1LiveStatusContract.test.ts`. The existing isolated Chromium contract also exercises the actual C1 component using explicitly synthetic success/pending/missing/invalid/network-failure responses. These are correctness checks, not new model-accuracy evidence.
