import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { adminService } from '../services/adminService';
import * as AuthContext from '../context/AuthContext';

vi.mock('../services/adminService', () => ({
  adminService: {
    getOverview: vi.fn(),
    getUsers: vi.fn(),
    getRides: vi.fn(),
    getSosAlerts: vi.fn(),
    updateUserStatus: vi.fn(),
    cancelRide: vi.fn(),
    resolveSosAlert: vi.fn(),
  },
}));

const mockAdminUser = {
  _id: 'admin_1',
  id: 'admin_1',
  name: 'System Admin',
  email: 'admin@smartride.com',
  role: 'admin',
};

const renderAdminDashboard = () => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: mockAdminUser,
    isAuthenticated: true,
  });

  return render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>
  );
};

describe('AdminDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overview metrics when valid stats payload is returned', async () => {
    const mockOverview = {
      totalUsers: 250,
      driverCount: 75,
      passengerCount: 175,
      totalRides: 120,
      activeRides: 8,
      completedRides: 110,
      activeSosCount: 1,
      totalGroups: 15,
    };

    adminService.getOverview.mockResolvedValue(mockOverview);

    renderAdminDashboard();

    expect(screen.getByText(/Operations console/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin privilege/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('250').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('handles empty/zero stats gracefully without crashing', async () => {
    const emptyOverview = {
      totalUsers: 0,
      driverCount: 0,
      passengerCount: 0,
      totalRides: 0,
      activeRides: 0,
      completedRides: 0,
      activeSosCount: 0,
      totalGroups: 0,
    };

    adminService.getOverview.mockResolvedValue(emptyOverview);

    renderAdminDashboard();

    await waitFor(() => {
      expect(screen.getByText('Operations console')).toBeInTheDocument();
      expect(screen.getByText('All incidents clear')).toBeInTheDocument();
    });
  });

  it('switches to Users tab and displays platform users roster', async () => {
    adminService.getOverview.mockResolvedValue({});
    adminService.getUsers.mockResolvedValue({
      users: [
        {
          _id: 'u_10',
          name: 'Jane Doe',
          email: 'jane@pune.edu',
          role: 'driver',
          organization: 'Pune Tech Park',
          isSuspended: false,
          verificationStatus: { govtId: true, phone: true },
        },
      ],
      pagination: { totalUsers: 1, totalPages: 1 },
    });

    renderAdminDashboard();

    const usersTab = screen.getByRole('button', { name: /User management/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalled();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@pune.edu')).toBeInTheDocument();
      expect(screen.getAllByText(/Active/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('switches to Rides tab and displays active/completed rides', async () => {
    adminService.getOverview.mockResolvedValue({});
    adminService.getRides.mockResolvedValue({
      rides: [
        {
          _id: 'r_99',
          driver: { name: 'Kiran Driver' },
          vehicle: { model: 'Maruti Ertiga' },
          startLocation: { address: 'Baner' },
          destination: { address: 'Hinjewadi' },
          date: '2026-11-24',
          departureTime: '08:30',
          availableSeats: 3,
          totalSeats: 4,
          estimatedCost: 60,
          status: 'OPEN',
        },
      ],
      pagination: { totalRides: 1 },
    });

    renderAdminDashboard();

    const ridesTab = screen.getByRole('button', { name: /Rides oversight/i });
    fireEvent.click(ridesTab);

    await waitFor(() => {
      expect(adminService.getRides).toHaveBeenCalled();
      expect(screen.getByText('Kiran Driver')).toBeInTheDocument();
      expect(screen.getByText(/Maruti Ertiga/i)).toBeInTheDocument();
      expect(screen.getByText(/Baner/i)).toBeInTheDocument();
      expect(screen.getByText(/Hinjewadi/i)).toBeInTheDocument();
    });
  });

  it('switches to SOS tab and displays safety emergency alerts', async () => {
    adminService.getOverview.mockResolvedValue({});
    adminService.getSosAlerts.mockResolvedValue([
      {
        _id: 'sos_1',
        ride: { _id: 'r_99' },
        triggeredBy: { name: 'Priya Passenger', phone: '9988776655' },
        status: 'ACTIVE',
        severity: 'CRITICAL',
        triggerReason: 'Driver deviating from route',
        createdAt: '2026-11-23T12:00:00Z',
      },
    ]);

    renderAdminDashboard();

    const sosTab = screen.getByRole('button', { name: /SOS incident center/i });
    fireEvent.click(sosTab);

    await waitFor(() => {
      expect(adminService.getSosAlerts).toHaveBeenCalled();
      expect(screen.getByText('Priya Passenger')).toBeInTheDocument();
      expect(screen.getByText('Active alarm')).toBeInTheDocument();
    });
  });
});
