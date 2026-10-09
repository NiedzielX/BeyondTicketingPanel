import { ModelVersionMetric } from '../types/ticketing';
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
  model_version: string | null;
  final_p10: number | null;
  final_p50: number | null;
  final_p90: number | null;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

class ModelPerformanceService {
  async getVersionMetrics(club?: string): Promise<ModelVersionMetric[]> {
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
        select: 'id,ticket_event_id,forecast_generated_at,model_version,final_p10,final_p50,final_p90',
        order: 'forecast_generated_at.asc,id.asc'
      })
    ]);

    const allowedEventIds = new Set(
      events
        .filter((event) => !club || event.home_team === club)
        .map((event) => event.id)
    );

    const outcomeByEvent = new Map<number, number>();
    for (const outcome of outcomes) {
      if (outcome.actual_attendance !== null) {
        outcomeByEvent.set(outcome.ticket_event_id, outcome.actual_attendance);
      }
    }

    const rows = forecasts.filter(
      (forecast) =>
        forecast.final_p50 !== null &&
        forecast.model_version &&
        allowedEventIds.has(forecast.ticket_event_id)
    );

    const versions = Array.from(new Set(rows.map((row) => row.model_version as string))).sort();

    return versions.map((modelVersion) => {
      const versionRows = rows.filter((row) => row.model_version === modelVersion);
      const forecastEventIds = new Set(versionRows.map((row) => row.ticket_event_id));

      // Executive comparison: one latest forecast per event and model version.
      const latestByEvent = new Map<number, ForecastRow>();
      for (const row of versionRows) {
        const current = latestByEvent.get(row.ticket_event_id);
        if (
          !current ||
          new Date(row.forecast_generated_at).getTime() > new Date(current.forecast_generated_at).getTime() ||
          (row.forecast_generated_at === current.forecast_generated_at && row.id > current.id)
        ) {
          latestByEvent.set(row.ticket_event_id, row);
        }
      }

      const evaluated = Array.from(latestByEvent.values())
        .map((row) => {
          const actual = outcomeByEvent.get(row.ticket_event_id);
          if (actual === undefined || actual <= 0 || row.final_p50 === null) return null;
          const prediction = row.final_p50;
          const signed = prediction - actual;
          const absolute = Math.abs(signed);
          const percentage = (absolute / actual) * 100;
          const covered =
            row.final_p10 !== null && row.final_p90 !== null
              ? actual >= row.final_p10 && actual <= row.final_p90
              : undefined;
          return { actual, signed, absolute, percentage, covered };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      if (evaluated.length === 0) {
        return {
          modelVersion,
          forecastEventsCount: forecastEventIds.size,
          evaluatedMatchesCount: 0,
          evaluatedForecastsCount: versionRows.length,
          status: 'awaiting_outcomes'
        };
      }

      const absoluteSum = evaluated.reduce((sum, row) => sum + row.absolute, 0);
      const actualSum = evaluated.reduce((sum, row) => sum + row.actual, 0);
      const coveredRows = evaluated.filter((row) => row.covered !== undefined);

      return {
        modelVersion,
        forecastEventsCount: forecastEventIds.size,
        evaluatedMatchesCount: evaluated.length,
        evaluatedForecastsCount: versionRows.length,
        mae: round(absoluteSum / evaluated.length, 0),
        mape: round(evaluated.reduce((sum, row) => sum + row.percentage, 0) / evaluated.length, 2),
        wape: actualSum > 0 ? round((absoluteSum / actualSum) * 100, 2) : undefined,
        bias: round(evaluated.reduce((sum, row) => sum + row.signed, 0) / evaluated.length, 0),
        accuracyWithin5Pct: round(
          (evaluated.filter((row) => row.percentage <= 5).length / evaluated.length) * 100,
          1
        ),
        accuracyWithin10Pct: round(
          (evaluated.filter((row) => row.percentage <= 10).length / evaluated.length) * 100,
          1
        ),
        intervalCoveragePct:
          coveredRows.length > 0
            ? round((coveredRows.filter((row) => row.covered).length / coveredRows.length) * 100, 1)
            : undefined,
        status: 'evaluated'
      };
    });
  }
}

export const modelPerformanceService = new ModelPerformanceService();
