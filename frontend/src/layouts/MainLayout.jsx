import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#06090e] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
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
