import React from 'react';
import { createRoot } from 'react-dom/client';
import { Rolling72MlForecastChart } from '../../src/components/charts/Rolling72MlForecastChart';
import '../../src/index.css';
const unconfigured = new URLSearchParams(window.location.search).get('mode') === 'unconfigured';
createRoot(document.getElementById('root')!).render(<main className="mx-auto max-w-6xl p-4">
  <Rolling72MlForecastChart feedUrl={unconfigured ? '' : '/research/rolling72-ml-ui-contract.json'} researchSnapshot />
</main>);
