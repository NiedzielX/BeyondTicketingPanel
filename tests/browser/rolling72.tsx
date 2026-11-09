import React from 'react';
import { createRoot } from 'react-dom/client';
import { Rolling72ForecastChart } from '../../src/components/charts/Rolling72ForecastChart';
import '../../src/index.css';

// Isolated test entry. Valid responses come from the genuine sanitised snapshot;
// malformed/missing responses exercise failure handling and are never published.
const missingConfiguration = new URLSearchParams(window.location.search).get('mode') === 'unconfigured';
createRoot(document.getElementById('root')!).render(<main className="mx-auto max-w-6xl p-4">
  <p className="mb-3 text-xs">Izolowany test interfejsu — bez dostępu do baz produkcyjnych.</p>
  <Rolling72ForecastChart feedUrl={missingConfiguration ? '' : '/research/rolling72-ui-contract.json'} researchSnapshot={!missingConfiguration} />
</main>);
