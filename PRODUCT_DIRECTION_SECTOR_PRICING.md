# Beyond Ticketing Panel — Sector Performance & Pricing Direction

Status: **canonical dashboard product direction**  
Effective: **2026-10-16**

Backend/product source of truth:

`NiedzielX/beyond/ml/SECTOR_DECISION_PRICING_V1.md`

## Primary dashboard job

The dashboard must not reduce Beyond recommendations to generic CRM / paid-media suggestions.

For each event, the UI should make it immediately visible:

1. which sector is underperforming / outperforming;
2. how far it is from expected trajectory;
3. what is projected to remain available / where demand is likely to finish if current trajectory continues;
4. what pricing action is worth testing;
5. what assumption / confidence supports that recommendation.

## Primary page

`src/pages/EventDetailPage.tsx`

Add a prominent block:

**Sector Performance & Pricing**

## Event summary card

Show:

- Structural Prior P50;
- current live / provisional P50;
- `Projected outcome if current trajectory continues`;
- delta vs Structural Prior;
- trajectory status;
- confidence;
- biggest sector risk;
- biggest sector opportunity;
- latest evidence timestamp.

## Sector table

Minimum columns:

| Sector | Current price | Availability | Velocity | Expected progress | Actual progress | Gap | No-action final | Status | Price recommendation | Scenario impact | Confidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |

Status values:

- `UNDERPERFORMING`;
- `ON_TRACK`;
- `OUTPERFORMING`;
- `INSUFFICIENT_SIGNAL`.

Pricing actions:

- `DECREASE`;
- `HOLD`;
- `INCREASE`;
- `PRICE_DATA_MISSING`;
- `MONITOR`.

## Expandable sector detail

Show:

- inventory / availability trajectory;
- expected trajectory;
- trajectory gap;
- 6h / 24h / 72h / 7d velocity where available;
- acceleration;
- release / coverage-change markers;
- price history;
- no-action projection;
- pricing scenarios;
- rationale / reason codes;
- confidence;
- data quality / limitations.

## Pricing scenario display

Before learned elasticity exists, scenario outputs must be visibly marked:

**Assumption-based pricing scenario**

Suggested scenario grid may include configurable:

- -10%;
- -5%;
- HOLD;
- +5%;
- +10%.

For each scenario display:

- price;
- projected public sell-through / remaining availability proxy;
- projected revenue proxy;
- delta vs no-action;
- assumption set;
- confidence.

Do not present the scenario delta as proven causal uplift.

## Recommendation card shape

Example only — runtime values must come from real data:

**Sector:** B4  
**Status:** UNDERPERFORMING  
**Gap:** -18% vs expected trajectory  
**Current price:** 90 PLN  
**Projected no-action:** ~620 public seats remaining at kickoff  
**Recommendation:** test 85 PLN  
**Scenario:** estimated sell-through / revenue change vs no-action  
**Confidence:** Medium

## User action capture

Recommendation UI should support:

- `Accept`;
- `Reject`;
- `Snooze`;
- `Mark executed`.

When executed, capture the actual action / price and execution time so the backend can link:

`recommendation -> execution -> subsequent trajectory -> final outcome`

## Semantic guardrails

- public availability is not confirmed paid sales;
- sector public-inventory projections must not be shown as final attendance;
- event attendance P50 and sector inventory projection are separate quantities;
- pricing is recommendation-only in MVP;
- no automatic price changes;
- use `PROVISIONAL`, `SCENARIO`, `ASSUMPTION-BASED` labels until learned/validated.

## Current priority

Dashboard work should prioritize sector/pricing decision support before adding more generic recommendation cards.
