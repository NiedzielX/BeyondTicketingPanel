import React from 'react';
import { createRoot } from 'react-dom/client';
import { DailyInventoryPathChart } from '../../src/components/charts/DailyInventoryPathChart';
import '../../src/index.css';

// Dev/test entry only. Vite's production entry remains index.html.
createRoot(document.getElementById('root')!).render(
  <main className="mx-auto max-w-5xl p-4">
    <p className="mb-3 text-sm">Test syntetyczny — nie są to wyniki modelu ani dane produkcyjne.</p>
    <DailyInventoryPathChart eventId="42" />
  </main>,
);
