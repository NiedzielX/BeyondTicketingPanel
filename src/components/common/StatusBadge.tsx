import React from 'react';
import {
  TrendingUp,
  Minus,
  TrendingDown,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  DataStatus,
  ForecastStatus,
  IssueSeverity,
  ClubCommercialStatus,
  SalesTrend
} from '../../types/ticketing';

interface CommercialStatusBadgeProps {
  status: ClubCommercialStatus;
  size?: 'sm' | 'md';
}

export const CommercialStatusBadge: React.FC<CommercialStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'Bardzo dobra sprzedaż':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Bardzo dobra sprzedaż
        </span>
      );
    case 'Zgodnie z oczekiwaniami':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-indigo-700 bg-indigo-500/10 border border-indigo-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Zgodnie z oczekiwaniami
        </span>
      );
    case 'Poniżej oczekiwań':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-amber-700 bg-amber-500/10 border border-amber-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Poniżej oczekiwań
        </span>
      );
    case 'Wymaga uwagi':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-rose-700 bg-rose-500/10 border border-rose-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Wymaga uwagi
        </span>
      );
    default:
      return null;
  }
};

interface TrendIndicatorProps {
  trend: SalesTrend;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend }) => {
  switch (trend) {
    case 'Przyspiesza':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Przyspiesza</span>
        </span>
      );
    case 'Zwalnia':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Zwalnia</span>
        </span>
      );
    case 'Stabilny':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Minus className="w-3.5 h-3.5" />
          <span>Stabilny</span>
        </span>
      );
  }
};

interface DataStatusBadgeProps {
  status: DataStatus;
  size?: 'sm' | 'md';
}

export const DataStatusBadge: React.FC<DataStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'Aktualne':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Aktualne
        </span>
      );
    case 'Nieaktualne':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-amber-700 bg-amber-500/10 border border-amber-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Nieaktualne
        </span>
      );
    case 'Brak danych':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-zinc-600 bg-zinc-500/10 border border-zinc-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Brak danych
        </span>
      );
    case 'Problem':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-rose-700 bg-rose-500/10 border border-rose-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Problem
        </span>
      );
    default:
      return null;
  }
};

interface ForecastStatusBadgeProps {
  status: ForecastStatus;
  size?: 'sm' | 'md';
}

export const ForecastStatusBadge: React.FC<ForecastStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'Aktualna':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-indigo-700 bg-indigo-500/10 border border-indigo-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Aktualna
        </span>
      );
    case 'Do przeliczenia':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-sky-700 bg-sky-500/10 border border-sky-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          Do przeliczenia
        </span>
      );
    case 'Brak prognozy':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-zinc-600 bg-zinc-500/10 border border-zinc-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Brak prognozy
        </span>
      );
    case 'Problem':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
          } rounded text-rose-700 bg-rose-500/10 border border-rose-500/20 whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Problem
        </span>
      );
    default:
      return null;
  }
};

interface SeverityBadgeProps {
  severity: IssueSeverity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  switch (severity) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-rose-700 bg-rose-500/10 border border-rose-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Krytyczny
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-amber-700 bg-amber-500/10 border border-amber-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          Ostrzeżenie
        </span>
      );
    case 'info':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-blue-700 bg-blue-500/10 border border-blue-500/30 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Informacja
        </span>
      );
  }
};
