import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import CosmicSpaceCanvas from '../components/common/CosmicSpaceCanvas';
import { useTheme } from '../context/ThemeContext';

export const MainLayout = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const isFullWidthPage =
    location.pathname === '/' ||
    location.pathname === '/learn' ||
    location.pathname === '/skills';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-500 relative transition-colors duration-300">
      {/* Dynamic Cosmic Space View with Moving Stars & Spark Streaks */}
      <CosmicSpaceCanvas />

      <Header />
      <div className="flex flex-1 relative">
        {!isFullWidthPage && <Sidebar />}
        <main className={`flex-1 overflow-y-auto w-full min-w-0 ${isFullWidthPage ? 'p-0 max-w-full' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'}`}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;

