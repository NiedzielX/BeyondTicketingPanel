import React from 'react';
import { createRoot } from 'react-dom/client';
import { IngestionCoveragePanel } from '../../src/components/operations/IngestionCoveragePanel';
import '../../src/index.css';

// Explicit synthetic component entry, never a production data feed.
createRoot(document.getElementById('root')!).render(
  <main className="mx-auto max-w-7xl p-4">
    <p>Test syntetyczny — nie są to dane produkcyjne.</p>
    <IngestionCoveragePanel onSelectEvent={() => {}} />
  </main>,
);
