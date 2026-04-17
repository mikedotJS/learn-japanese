import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BasedProvider } from '@weirdscience/based-client';
import { based } from './lib/based';
import { AuthProvider } from './context/AuthProvider';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BasedProvider client={based}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BasedProvider>
  </StrictMode>,
);

// Register service worker for PWA (production only — the dev bundler
// serves its own modules and a cache-first SW would pin stale assets).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/learn-japanese/sw.js').catch(() => {});
  });
} else if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
}
