/**
 * App Component
 * 
 * Main application component with routing and lazy-loaded pages.
 */

import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/shared/components/Layout';
import { PageLoader } from '@/shared/components';
import { useSettingsStore } from '@/stores/settingsStore';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/features/home/HomePage'));
const HistoryPage = lazy(() => import('@/features/history/HistoryPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

function App() {
  // Initialize theme on mount
  useEffect(() => {
    const theme = useSettingsStore.getState().theme;
    const resolved = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

// 404 component
function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🤔</div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
        Page Not Found
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-6">
        Looks like this page doesn't exist.
      </p>
      <a 
        href="/"
        className="btn btn-primary inline-flex"
      >
        Go Home
      </a>
    </div>
  );
}

export default App;
