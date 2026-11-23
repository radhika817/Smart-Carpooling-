import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ProtectedRoute } from '../components/ProtectedRoute';
import * as AuthContext from '../context/AuthContext';

describe('Admin Analytics Visibility & Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navbar Analytics Link Visibility', () => {
    it('renders Analytics link when authenticated user has admin role', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { _id: 'admin_1', name: 'Admin', role: 'admin' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const analyticsLinks = screen.getAllByRole('link', { name: /Analytics/i });
      expect(analyticsLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT render Analytics link when user is a passenger', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { _id: 'pass_1', name: 'Passenger', role: 'passenger' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.queryByRole('link', { name: /Analytics/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Platform analytics/i })).not.toBeInTheDocument();
    });

    it('does NOT render Analytics link when user is a driver', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { _id: 'driver_1', name: 'Driver', role: 'driver' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.queryByRole('link', { name: /Analytics/i })).not.toBeInTheDocument();
    });

    it('does NOT render Analytics link for unauthenticated visitors', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: null,
        isAuthenticated: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.queryByRole('link', { name: /Analytics/i })).not.toBeInTheDocument();
    });
  });

  describe('ProtectedRoute Role Enforcement', () => {
    it('allows access to admin-only route when user is admin', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { _id: 'admin_1', role: 'admin' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin/analytics']}>
          <Routes>
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div>Authorized Admin Analytics Page Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Authorized Admin Analytics Page Content')).toBeInTheDocument();
    });

    it('enforces Access Denied error screen when passenger attempts admin-only route', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { _id: 'pass_1', role: 'passenger' },
        isAuthenticated: true,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin/analytics']}>
          <Routes>
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div>Restricted Admin Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Restricted Admin Content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/This area is restricted to admin accounts/i)).toBeInTheDocument();
    });
  });
});
