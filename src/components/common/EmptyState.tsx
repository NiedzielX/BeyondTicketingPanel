import React from 'react';
import { AlertCircle, FolderSearch, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'empty' | 'warning' | 'refresh';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'empty'
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-3">
        {icon === 'warning' ? (
          <AlertCircle className="w-5 h-5 text-amber-500" />
        ) : icon === 'refresh' ? (
          <RefreshCw className="w-5 h-5 text-indigo-500" />
        ) : (
          <FolderSearch className="w-5 h-5" />
        )}
      </div>
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700/60 shadow-sm transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
