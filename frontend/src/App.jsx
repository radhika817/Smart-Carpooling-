import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SearchRidesPage } from './pages/SearchRidesPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { CreateRidePage } from './pages/CreateRidePage';
import { ProtectedRoute } from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="search" element={<SearchRidesPage />} />
              <Route
                path="vehicles"
                element={
                  <ProtectedRoute>
                    <VehiclesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="create-ride"
                element={
                  <ProtectedRoute>
                    <CreateRidePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="*"
                element={
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                    <h1 className="text-6xl font-black text-brand-400">404</h1>
                    <p className="text-slate-300 text-lg mt-3">Page Not Found</p>
                    <a
                      href="/"
                      className="mt-6 px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-sm"
                    >
                      Return Home
                    </a>
                  </div>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
