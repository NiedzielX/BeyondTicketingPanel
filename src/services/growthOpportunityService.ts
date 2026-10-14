import { EventDetailData } from '../types/ticketing';
import { eventsService } from './eventsService';
import { growthExperimentService } from './growthExperimentService';
import { EventLiveState, researchService } from './researchService';

export type GrowthPlay =
  | 'hold_data_quality'
  | 'protect_yield'
  | 'demand_activation'
  | 'last_mile_conversion'
  | 'monitor'
  | 'insufficient_data';

export type DemandState = 'accelerating' | 'stable' | 'slowing' | 'scarce' | 'uncertain';

export interface GrowthOpportunity {
  eventId: string;
  demandState: DemandState;
  play: GrowthPlay;
  confidence: 'high' | 'medium' | 'low';
  headline: string;
  diagnosis: string;
  recommendedAction: string;
  doNotDo: string;
  measurementPlan: string;
  measurementInfrastructureReady: true;
  executionSourceConnected: boolean;
  executionSourceName?: string;
  evidence: Array<{ label: string; value: string }>;
  dataCaveat: string;
}

const fmt = (value?: number, digits = 1) =>
  value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString('pl-PL', { maximumFractionDigits: digits });

function hasStructuralInventoryRisk(live: EventLiveState | null): boolean {
  return Boolean(live?.releaseActivityFlag || live?.sectorCoverageChangeFlag);
}

function inferDemandState(live: EventLiveState | null): DemandState {
  if (!live) return 'uncertain';
  if (hasStructuralInventoryRisk(live)) return 'uncertain';

  const index = live.availableIndex;
  const v6 = live.velocity6h;
  const v24 = live.velocity24h;

  if (index !== undefined && index <= 0.35) return 'scarce';
  if (v6 !== undefined && v24 !== undefined && v6 > 0 && v24 > 0) {
    if (v6 >= v24 * 1.25) return 'accelerating';
    if (v6 <= v24 * 0.75) return 'slowing';
    return 'stable';
  }
  if (v6 !== undefined && v6 > 0) return 'stable';
  return 'uncertain';
}

function choosePlay(detail: EventDetailData, live: EventLiveState | null, state: DemandState): GrowthPlay {
  if (hasStructuralInventoryRisk(live) || detail.event.dataStatus === 'Problem') return 'hold_data_quality';
  if (!live || live.availableTotal === undefined) return 'insufficient_data';
  if (state === 'scarce' || state === 'accelerating') return 'protect_yield';
  if (state === 'slowing' && detail.event.daysToEvent > 7) return 'demand_activation';
  if (state === 'slowing' && detail.event.daysToEvent <= 7) return 'last_mile_conversion';
  if (detail.event.commercialStatus === 'Poniżej oczekiwań' || detail.event.commercialStatus === 'Wymaga uwagi') {
    return detail.event.daysToEvent > 7 ? 'demand_activation' : 'last_mile_conversion';
  }
  return 'monitor';
}

function copyFor(play: GrowthPlay, daysToEvent: number) {
  switch (play) {
    case 'hold_data_quality':
      return {
        headline: 'Wstrzymaj decyzję komercyjną',
        diagnosis: 'Zmiana publicznej dostępności może wynikać ze zmiany puli lub sektorów, więc nie mamy dziś czystego sygnału popytu.',
        recommendedAction: 'Najpierw potwierdź stabilność inventory. Po kolejnym poprawnym odczycie wróć do decyzji Growth.',
        doNotDo: 'Nie uruchamiaj promocji ani zmiany ceny wyłącznie na podstawie tego odczytu.'
      };
    case 'protect_yield':
      return {
        headline: 'Popyt wygląda mocno — chroń yield',
        diagnosis: 'Publiczna dostępność spada szybko lub pozostała już relatywnie mała pula względem początku obserwacji.',
        recommendedAction: 'Nie dokładaj szerokiego rabatu. Testuj działania zwiększające wartość koszyka: premium, hospitality, upsell lub komunikację scarcity.',
        doNotDo: 'Nie obniżaj ceny szeroko tylko po to, żeby przyspieszyć sprzedaż przy już mocnym sygnale popytu.'
      };
    case 'demand_activation':
      return {
        headline: 'Jest czas na aktywację popytu',
        diagnosis: `Tempo publicznej dostępności wygląda słabiej, a do meczu zostało około ${Math.max(0, Math.round(daysToEvent))} dni.`,
        recommendedAction: 'Uruchom ograniczony test CRM/paid do konkretnego segmentu: rodziny, grupy, lapsed buyers lub kibice podobnych meczów. Zostaw grupę kontrolną.',
        doNotDo: 'Nie uruchamiaj od razu masowego rabatu dla całej bazy.'
      };
    case 'last_mile_conversion':
      return {
        headline: 'Skup się na last-mile conversion',
        diagnosis: 'Do meczu zostało mało czasu, a sygnał popytu nie przyspiesza wystarczająco.',
        recommendedAction: 'Testuj komunikację wysokiej intencji: remarketing, abandoned intent, push/e-mail z jasnym CTA i ograniczeniem czasowym.',
        doNotDo: 'Nie buduj długiego awareness campaign, którego efekt pojawi się po meczu.'
      };
    case 'monitor':
      return {
        headline: 'Brak potrzeby interwencji',
        diagnosis: 'Obecny sygnał nie pokazuje wyraźnego problemu ani presji wymagającej zmiany komercyjnej.',
        recommendedAction: 'Utrzymaj obecny plan i obserwuj velocity oraz forecast przy kolejnych checkpointach.',
        doNotDo: 'Nie twórz kampanii tylko dlatego, że system potrafi wygenerować rekomendację.'
      };
    default:
      return {
        headline: 'Za mało danych do rekomendacji Growth',
        diagnosis: 'Nie mamy jeszcze wystarczającego, stabilnego sygnału live inventory dla tego meczu.',
        recommendedAction: 'Poczekaj na kolejne poprawne snapshoty i forecast checkpoint.',
        doNotDo: 'Nie interpretuj braku danych jako słabego popytu.'
      };
  }
}

class GrowthOpportunityService {
  async getForEvent(eventId: string): Promise<GrowthOpportunity | null> {
    const [detail, live, experiments] = await Promise.all([
      eventsService.getEventById(eventId),
      researchService.getEventLiveState(eventId),
      growthExperimentService.getForEvent(eventId)
    ]);
    if (!detail) return null;

    const state = inferDemandState(live);
    const play = choosePlay(detail, live, state);
    const copy = copyFor(play, detail.event.daysToEvent);
    const structuralRisk = hasStructuralInventoryRisk(live);
    const confidence: GrowthOpportunity['confidence'] = structuralRisk || !live
      ? 'low'
      : (live.rawSnapshotCount ?? 0) >= 12
        ? 'high'
        : 'medium';
    const executionSource = experiments.find((experiment) => experiment.latestBatchSource !== undefined)?.latestBatchSource;

    return {
      eventId,
      demandState: state,
      play,
      confidence,
      ...copy,
      measurementPlan: play === 'monitor' || play === 'insufficient_data' || play === 'hold_data_quality'
        ? 'Brak eksperymentu do mierzenia. Zapisz decyzję i obserwuj kolejny checkpoint.'
        : 'Uruchom przypisany Treatment + Holdout. Beyond mierzy wynik intent-to-treat: incremental tickets i revenue względem całego przypisanego holdoutu, a koszt kampanii odejmuje przy liczeniu incremental contribution.',
      measurementInfrastructureReady: true,
      executionSourceConnected: executionSource !== undefined,
      executionSourceName: executionSource,
      evidence: [
        { label: 'Do meczu', value: `${Math.max(0, Math.round(detail.event.daysToEvent))} dni` },
        { label: 'Widoczne miejsca', value: fmt(live?.availableTotal, 0) },
        { label: 'Availability index', value: live?.availableIndex === undefined ? '—' : `${fmt(live.availableIndex * 100, 0)}%` },
        { label: 'Velocity 6h', value: fmt(live?.velocity6h, 1) },
        { label: 'Velocity 24h', value: fmt(live?.velocity24h, 1) },
        { label: 'Forecast P50', value: detail.event.currentForecast === undefined ? '—' : fmt(detail.event.currentForecast, 0) }
      ],
      dataCaveat: executionSource
        ? `Warstwa pomiarowa i execution source (${executionSource}) są podłączone. Wynik biznesowy pojawia się dopiero po poprawnym assignment + outcome data obu ramion i przejściu gate'u pomiarowego.`
        : 'Warstwa pomiarowa Treatment/Holdout jest gotowa. Brakuje realnego execution source od klubu: assigned, exposed, purchasers, tickets, revenue, refunds i campaign cost. Dopóki te dane nie wpłyną, Beyond nie pokazuje sztucznego +tickets / +PLN / ROI.'
    };
  }
}

export const growthOpportunityService = new GrowthOpportunityService();
