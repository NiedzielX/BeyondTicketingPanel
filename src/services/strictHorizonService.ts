import { HorizonMetric, StrictHorizonPerformance } from '../types/ticketing';
import { fetchRows } from './supabaseRest';

interface TicketEventRow {
  id: number;
  home_team: string;
}

interface OutcomeRow {
  ticket_event_id: number;
  actual_attendance: number | null;
}

interface ForecastRow {
  id: number;
  ticket_event_id: number;
  forecast_generated_at: string;
  hours_to_kickoff: number | null;
  model_version: string | null;
  final_p50: number | null;
}

const HORIZONS = [
  { label: 'T-30' as const, target: 720, tolerance: 240 },
  { label: 'T-14' as const, target: 336, tolerance: 96 },
  { label: 'T-7' as const, target: 168, tolerance: 48 },
  { label: 'T-3' as const, target: 72, tolerance: 24 },
  { label: 'T-24h' as const, target: 24, tolerance: 12 }
];

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

class StrictHorizonService {
  async getPerformance(club?: string): Promise<StrictHorizonPerformance> {
    const [events, outcomes, forecasts] = await Promise.all([
      fetchRows<TicketEventRow>('ticket_events', {
        select: 'id,home_team',
        order: 'id.asc'
      }),
      fetchRows<OutcomeRow>('ticket_event_outcomes', {
        select: 'ticket_event_id,actual_attendance',
        order: 'ticket_event_id.asc'
      }),
      fetchRows<ForecastRow>('forecast_observations', {
        select: 'id,ticket_event_id,forecast_generated_at,hours_to_kickoff,model_version,final_p50',
        order: 'forecast_generated_at.asc,id.asc'
      })
    ]);

    const allowedEventIds = new Set(
      events.filter((event) => !club || event.home_team === club).map((event) => event.id)
    );
    const actualByEvent = new Map<number, number>();
    for (const outcome of outcomes) {
      if (
        allowedEventIds.has(outcome.ticket_event_id) &&
        outcome.actual_attendance !== null &&
        outcome.actual_attendance > 0
      ) {
        actualByEvent.set(outcome.ticket_event_id, outcome.actual_attendance);
      }
    }

    const evaluable = forecasts.filter(
      (row) =>
        row.final_p50 !== null &&
        row.model_version &&
        row.hours_to_kickoff !== null &&
        allowedEventIds.has(row.ticket_event_id) &&
        actualByEvent.has(row.ticket_event_id)
    );

    // Horizon charts must never mix model versions. Use the latest model version
    // that actually has at least one verified outcome in the selected club scope.
    const latestTimestampByVersion = new Map<string, number>();
    for (const row of evaluable) {
      const version = row.model_version as string;
      const timestamp = new Date(row.forecast_generated_at).getTime();
      latestTimestampByVersion.set(
        version,
        Math.max(latestTimestampByVersion.get(version) ?? 0, timestamp)
      );
    }

    const selectedVersion = Array.from(latestTimestampByVersion.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!selectedVersion) {
      return {
        protocol: 'closest_pre_target_one_per_match',
        horizonMetrics: HORIZONS.map(({ label }) => ({
          horizon: label,
          forecastsCount: 0,
          mae: 0,
          mape: 0,
          bias: 0,
          medianError: 0
        }))
      };
    }

    const versionRows = evaluable.filter((row) => row.model_version === selectedVersion);

    const horizonMetrics: HorizonMetric[] = HORIZONS.map(({ label, target, tolerance }) => {
      const candidates = versionRows.filter(
        (row) =>
          row.hours_to_kickoff !== null &&
          row.hours_to_kickoff >= target &&
          row.hours_to_kickoff <= target + tolerance
      );

      const bestByEvent = new Map<number, ForecastRow>();
      for (const row of candidates) {
        const current = bestByEvent.get(row.ticket_event_id);
        if (!current) {
          bestByEvent.set(row.ticket_event_id, row);
          continue;
        }

        const rowDistance = (row.hours_to_kickoff as number) - target;
        const currentDistance = (current.hours_to_kickoff as number) - target;
        const rowTime = new Date(row.forecast_generated_at).getTime();
        const currentTime = new Date(current.forecast_generated_at).getTime();

        if (
          rowDistance < currentDistance ||
          (rowDistance === currentDistance && rowTime > currentTime) ||
          (rowDistance === currentDistance && rowTime === currentTime && row.id > current.id)
        ) {
          bestByEvent.set(row.ticket_event_id, row);
        }
      }

      const errors = Array.from(bestByEvent.values()).map((row) => {
        const actual = actualByEvent.get(row.ticket_event_id)!;
        const prediction = row.final_p50 as number;
        const signed = prediction - actual;
        const absolute = Math.abs(signed);
        const percentage = (absolute / actual) * 100;
        return { signed, absolute, percentage };
      });

      if (errors.length === 0) {
        return {
          horizon: label,
          forecastsCount: 0,
          mae: 0,
          mape: 0,
          bias: 0,
          medianError: 0
        };
      }

      return {
        horizon: label,
        forecastsCount: errors.length,
        mae: round(errors.reduce((sum, row) => sum + row.absolute, 0) / errors.length, 0),
        mape: round(errors.reduce((sum, row) => sum + row.percentage, 0) / errors.length, 2),
        bias: round(errors.reduce((sum, row) => sum + row.signed, 0) / errors.length, 0),
        medianError: round(median(errors.map((row) => row.absolute)), 0)
      };
    });

    return {
      modelVersion: selectedVersion,
      protocol: 'closest_pre_target_one_per_match',
      horizonMetrics
    };
  }
}

export const strictHorizonService = new StrictHorizonService();
