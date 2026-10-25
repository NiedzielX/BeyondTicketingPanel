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
