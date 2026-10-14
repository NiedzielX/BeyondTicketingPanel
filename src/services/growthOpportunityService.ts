import { EnrichedEvent } from '../types/ticketing';
import { eventsService } from './eventsService';
import { EventLiveState, researchService } from './researchService';

export type GrowthPlay =
  | 'hold_data_quality'
  | 'protect_yield'
  | 'demand_activation'
  | 'last_mile_conversion'
  | 'monitor'
  | 'insufficient_data';

export type DemandState = 'accelerating' | 'stable' | 'slowing' | 'scarce' | 'uncertain';
export type GrowthPriority = 'high' | 'medium' | 'low' | 'data_hold';

export interface GrowthOpportunity {
  eventId: string;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  eventDate: string;
  daysToEvent: number;
  demandState: DemandState;
  play: GrowthPlay;
  priority: GrowthPriority;
  confidence: 'high' | 'medium' | 'low';
  headline: string;
  diagnosis: string;
  recommendedAction: string;
  doNotDo: string;
  whyNow: string;
  observationPlan: string;
  pilotMeasurementPlan: string;
  forecastP50?: number;
  forecastGapToCapacity?: number;
  visibleAvailability?: number;
  velocity6h?: number;
  velocity24h?: number;
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

function choosePlay(event: EnrichedEvent, live: EventLiveState | null, state: DemandState): GrowthPlay {
  if (hasStructuralInventoryRisk(live) || event.dataStatus === 'Problem') return 'hold_data_quality';
  if (!live || live.availableTotal === undefined) return 'insufficient_data';
  if (state === 'scarce' || state === 'accelerating') return 'protect_yield';
  if (state === 'slowing' && event.daysToEvent > 7) return 'demand_activation';
  if (state === 'slowing' && event.daysToEvent <= 7) return 'last_mile_conversion';
  if (event.commercialStatus === 'Poniżej oczekiwań' || event.commercialStatus === 'Wymaga uwagi') {
    return event.daysToEvent > 7 ? 'demand_activation' : 'last_mile_conversion';
  }
  return 'monitor';
}

function priorityFor(play: GrowthPlay, daysToEvent: number): GrowthPriority {
  if (play === 'hold_data_quality' || play === 'insufficient_data') return 'data_hold';
  if (play === 'last_mile_conversion') return 'high';
  if (play === 'demand_activation') return daysToEvent <= 14 ? 'high' : 'medium';
  if (play === 'protect_yield') return 'medium';
  return 'low';
}

function copyFor(play: GrowthPlay, daysToEvent: number) {
  switch (play) {
    case 'hold_data_quality':
      return {
        headline: 'Wstrzymaj decyzję komercyjną',
        diagnosis: 'Zmiana publicznej dostępności może wynikać ze zmiany puli lub sektorów, więc sygnał popytu nie jest dziś wystarczająco czysty.',
        recommendedAction: 'Najpierw potwierdź stabilność inventory. Po kolejnym poprawnym odczycie wróć do decyzji Growth.',
        doNotDo: 'Nie uruchamiaj promocji ani zmiany ceny wyłącznie na podstawie tego odczytu.',
        whyNow: 'Ryzyko błędnej interpretacji danych jest dziś większe niż potencjalna korzyść z szybkiej interwencji.'
      };
    case 'protect_yield':
      return {
        headline: 'Popyt wygląda mocno — chroń yield',
        diagnosis: 'Publiczna dostępność spada szybko lub pozostała już relatywnie mała pula względem początku obserwacji.',
        recommendedAction: 'Nie dokładaj szerokiego rabatu. Priorytetem powinny być scarcity messaging, premium, hospitality lub upsell.',
        doNotDo: 'Nie obniżaj ceny szeroko tylko po to, żeby przyspieszyć sprzedaż przy już mocnym sygnale popytu.',
        whyNow: 'Przy mocnym popycie największym ryzykiem jest oddanie marży, a nie brak konwersji.'
      };
    case 'demand_activation':
      return {
        headline: 'Jest czas na aktywację popytu',
        diagnosis: `Tempo publicznej dostępności wygląda słabiej, a do meczu zostało około ${Math.max(0, Math.round(daysToEvent))} dni.`,
        recommendedAction: 'Uruchom ograniczoną aktywację do konkretnego segmentu: rodziny, grupy, lapsed buyers lub kibice podobnych meczów. Zacznij od komunikacji i targetowania zamiast szerokiej przeceny.',
        doNotDo: 'Nie uruchamiaj od razu masowego rabatu dla całej bazy.',
        whyNow: 'Pozostał jeszcze czas na reakcję i ponowną ocenę tempa przed wejściem w last-mile.'
      };
    case 'last_mile_conversion':
      return {
        headline: 'Skup się na last-mile conversion',
        diagnosis: 'Do meczu zostało mało czasu, a sygnał popytu nie przyspiesza wystarczająco.',
        recommendedAction: 'Priorytetem powinny być kanały wysokiej intencji: remarketing, push/e-mail z jasnym CTA, komunikacja ograniczenia czasowego i dostępności.',
        doNotDo: 'Nie buduj długiego awareness campaign, którego efekt pojawi się po meczu.',
        whyNow: 'Okno na zmianę wyniku jest krótkie, więc liczy się szybkość konwersji, a nie zasięg.'
      };
    case 'monitor':
      return {
        headline: 'Brak potrzeby interwencji',
        diagnosis: 'Obecny sygnał nie pokazuje wyraźnego problemu ani presji wymagającej zmiany komercyjnej.',
        recommendedAction: 'Utrzymaj obecny plan i obserwuj velocity, publiczną dostępność oraz forecast przy kolejnych checkpointach.',
        doNotDo: 'Nie twórz kampanii tylko dlatego, że system potrafi wygenerować rekomendację.',
        whyNow: 'Brak interwencji też jest decyzją — obecne dane nie uzasadniają kosztownej zmiany.'
      };
    default:
      return {
        headline: 'Za mało danych do rekomendacji Growth',
        diagnosis: 'Nie mamy jeszcze wystarczającego, stabilnego sygnału live inventory dla tego meczu.',
        recommendedAction: 'Poczekaj na kolejne poprawne snapshoty i forecast checkpoint.',
        doNotDo: 'Nie interpretuj braku danych jako słabego popytu.',
        whyNow: 'Najpierw potrzebujemy wiarygodnego sygnału, dopiero potem rekomendacji.'
      };
  }
}

function observationPlanFor(play: GrowthPlay): string {
  if (play === 'hold_data_quality' || play === 'insufficient_data') {
    return 'Obserwuj jakość kolejnych snapshotów. Nie przypisuj zmian do działań komercyjnych, dopóki sygnał inventory nie będzie stabilny.';
  }
  if (play === 'monitor') {
    return 'Bez interwencji. Porównuj kolejne checkpointy: velocity 6h/24h, visible availability i zmianę P50.';
  }
  return 'Po rekomendowanym działaniu obserwuj zmianę velocity 6h/24h, visible availability i P50. Na etapie POC jest to sygnał obserwacyjny — nie dowód wpływu kampanii.';
}

function buildOpportunity(event: EnrichedEvent, live: EventLiveState | null): GrowthOpportunity {
  const state = inferDemandState(live);
  const play = choosePlay(event, live, state);
  const copy = copyFor(play, event.daysToEvent);
  const structuralRisk = hasStructuralInventoryRisk(live);
  const confidence: GrowthOpportunity['confidence'] = structuralRisk || !live
    ? 'low'
    : (live.rawSnapshotCount ?? 0) >= 12
      ? 'high'
      : 'medium';

  return {
    eventId: event.id,
    eventName: event.name,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    competition: event.competition,
    eventDate: event.eventDate,
    daysToEvent: event.daysToEvent,
    demandState: state,
    play,
    priority: priorityFor(play, event.daysToEvent),
    confidence,
    ...copy,
    observationPlan: observationPlanFor(play),
    pilotMeasurementPlan: 'Po wejściu klubu w pilot można dołączyć CRM/ticketing i przejść do Treatment/Holdout oraz pomiaru incremental tickets/revenue. Nie jest to wymagane do działania Growth POC.',
    forecastP50: event.currentForecast,
    forecastGapToCapacity: event.currentForecast === undefined ? undefined : Math.max(0, event.capacity - event.currentForecast),
    visibleAvailability: live?.availableTotal,
    velocity6h: live?.velocity6h,
    velocity24h: live?.velocity24h,
    evidence: [
      { label: 'Do meczu', value: `${Math.max(0, Math.round(event.daysToEvent))} dni` },
      { label: 'Widoczne miejsca', value: fmt(live?.availableTotal, 0) },
      { label: 'Availability index', value: live?.availableIndex === undefined ? '—' : `${fmt(live.availableIndex * 100, 0)}%` },
      { label: 'Velocity 6h', value: fmt(live?.velocity6h, 1) },
      { label: 'Velocity 24h', value: fmt(live?.velocity24h, 1) },
      { label: 'Forecast P50', value: event.currentForecast === undefined ? '—' : fmt(event.currentForecast, 0) },
      { label: 'Gap do pojemności wg P50', value: event.currentForecast === undefined ? '—' : fmt(Math.max(0, event.capacity - event.currentForecast), 0) }
    ],
    dataCaveat: 'Beyond obserwuje publiczną dostępność miejsc i jej zmiany. To proxy popytu, a nie potwierdzona sprzedaż. Bez danych wykonawczych klubu nie przypisujemy zmian kampanii i nie pokazujemy sztucznego +tickets, +PLN ani ROI.'
  };
}

class GrowthOpportunityService {
  async getForEvent(eventId: string): Promise<GrowthOpportunity | null> {
    const [detail, live] = await Promise.all([
      eventsService.getEventById(eventId),
      researchService.getEventLiveState(eventId)
    ]);
    if (!detail) return null;
    return buildOpportunity(detail.event, live);
  }

  async getAll(): Promise<GrowthOpportunity[]> {
    const events = await eventsService.getEvents({ status: 'active', sortBy: 'daysToEvent', sortOrder: 'asc' });
    const rows = await Promise.all(
      events.map(async (event) => buildOpportunity(event, await researchService.getEventLiveState(event.id)))
    );

    const priorityRank: Record<GrowthPriority, number> = { high: 0, medium: 1, low: 2, data_hold: 3 };
    return rows.sort((a, b) => {
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return a.daysToEvent - b.daysToEvent;
    });
  }
}

export const growthOpportunityService = new GrowthOpportunityService();
