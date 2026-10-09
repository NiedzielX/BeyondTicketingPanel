/**
 * Polish locale formatting helpers for numbers, dates, and deltas
 */

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  // Format with space as thousands separator for clean Polish analytics UI
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  if (value === 0) return '0';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatNumber(value)}`;
}

export function formatSignedError(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  if (value === 0) return '0';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatNumber(value)}`;
}

export function formatDateShort(dateString: string): string {
  try {
    const d = new Date(dateString);
    const months = [
      'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
      'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

export function formatDateDayOnly(dateString: string): string {
  try {
    const d = new Date(dateString);
    const months = [
      'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}

export function formatDateNumeric(dateString: string): string {
  try {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  } catch {
    return dateString;
  }
}

export function formatDaysRemaining(days: number): string {
  if (days <= 0) return 'dzień eventu';
  if (days === 1) return '1 dzień';
  return `${days} dni`;
}

export function formatRelativeUpdate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date('2026-10-09T12:00:00Z'); // Current simulation baseline
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `dzisiaj, ${hours}:${minutes}`;
    }
    if (diffHours < 48 && Math.abs(date.getDate() - now.getDate()) === 1) {
      return `wczoraj, ${hours}:${minutes}`;
    }
    return formatDateShort(timestamp);
  } catch {
    return timestamp;
  }
}
