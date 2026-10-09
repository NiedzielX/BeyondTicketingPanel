import React from 'react';
import { HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  tooltip?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  highlight?: 'normal' | 'warning' | 'danger' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  tooltip,
  trend,
  highlight = 'normal'
}) => {
  const getBorderColor = () => {
    switch (highlight) {
      case 'warning':
        return 'border-amber-500/30 bg-amber-50/20';
      case 'danger':
        return 'border-rose-500/30 bg-rose-50/20';
      case 'success':
        return 'border-emerald-500/30 bg-emerald-50/20';
      default:
        return 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all duration-150 ${getBorderColor()} shadow-[0_1px_2px_rgba(0,0,0,0.03)]`}
    >
      <div className="flex items-center justify-between gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        <span className="truncate">{label}</span>
        {tooltip && (
          <div className="group relative cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" />
            <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden w-56 rounded bg-zinc-900 px-2.5 py-1.5 text-[11px] leading-tight text-white shadow-lg group-hover:block z-30">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.neutral
                ? 'text-zinc-500'
                : trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
