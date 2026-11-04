import React from 'react';
import { createRoot } from 'react-dom/client';
import { C1LiveStatusPanel } from '../../src/components/common/C1LiveStatusPanel';
import '../../src/index.css';

// Dev/test entry only; the production build never serves a synthetic data feed.
createRoot(document.getElementById('root')!).render(
  <main className="mx-auto max-w-5xl p-4">
    <p>Test syntetyczny — nie są to wyniki modelu ani dane produkcyjne.</p>
    <C1LiveStatusPanel />
  </main>,
);
