import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './pages/Dashboard';
import { CampusMap } from './pages/CampusMap';
import { WeatherPage } from './pages/WeatherPage';
import { AirPage } from './pages/AirPage';
import { NoisePage } from './pages/NoisePage';
import { Management } from './pages/Management';
import { Analytics } from './pages/Analytics';
import { AIInsights } from './pages/AIInsights';
import { LandingPage } from './pages/LandingPage';
import type { PageKey } from './types';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [page, setPage] = useState<PageKey>('dashboard');
  const [dark, setDark] = useState(false);

  const handleTransitionStart = useCallback(() => setRevealing(true), []);
  const handleEnter = useCallback(() => setShowLanding(false), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    if (showLanding) {
      document.body.style.background = '#1a1f24';
    } else {
      document.body.style.background = '';
    }
  }, [showLanding]);

  useEffect(() => {
    const envPage =
      !showLanding && (page === 'weather' || page === 'air' || page === 'noise' || page === 'dashboard');
    document.body.classList.toggle('weather-page', envPage);
    return () => document.body.classList.remove('weather-page');
  }, [page, showLanding]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'map': return <CampusMap />;
      case 'weather': return <WeatherPage />;
      case 'air': return <AirPage />;
      case 'noise': return <NoisePage />;
      case 'management': return <Management />;
      case 'analytics': return <Analytics />;
      case 'ai': return <AIInsights />;
    }
  };

  const envBleed = page === 'weather' || page === 'air' || page === 'noise' || page === 'dashboard';
  const appVisible = revealing || !showLanding;

  return (
    <>
      {/* Dashboard mounts in final layout during fade — no scale jump */}
      {appVisible && (
        <motion.div
          key="app-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            minHeight: '100vh',
            background: 'var(--bg)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Sidebar active={page} onNav={setPage} />
          <TopNav page={page} dark={dark} onTheme={() => setDark(d => !d)} />
          <main
            style={{
              marginLeft: 'var(--sidebar-w)',
              marginTop: 'var(--topnav-h)',
              padding: envBleed ? 0 : 'var(--page-pad)',
              minHeight: 'calc(100vh - var(--topnav-h))',
              height: envBleed ? 'calc(100vh - var(--topnav-h))' : undefined,
              overflow: envBleed ? 'hidden' : undefined,
            }}
          >
            {renderPage()}
          </main>
        </motion.div>
      )}

      {showLanding && (
        <LandingPage
          key="landing"
          onEnter={handleEnter}
          onTransitionStart={handleTransitionStart}
        />
      )}
    </>
  );
}
