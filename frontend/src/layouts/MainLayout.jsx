import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-900">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};
