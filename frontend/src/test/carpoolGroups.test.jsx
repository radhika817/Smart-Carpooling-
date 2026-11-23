import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CarpoolGroupsPage } from '../pages/CarpoolGroupsPage';
import { CarpoolGroupDetailPage } from '../pages/CarpoolGroupDetailPage';
import { groupService } from '../services/groupService';
import { rideService } from '../services/rideService';
import * as AuthContext from '../context/AuthContext';

vi.mock('../services/groupService', () => ({
  groupService: {
    getGroups: vi.fn(),
    getGroupById: vi.fn(),
    getGroupRides: vi.fn(),
    createGroup: vi.fn(),
    joinByCode: vi.fn(),
    leaveGroup: vi.fn(),
  },
}));

vi.mock('../services/rideService', () => ({
  rideService: {
    bookSeat: vi.fn(),
  },
}));

const mockUser = {
  _id: 'user_1',
  id: 'user_1',
  name: 'Sam Commuter',
  email: 'sam@techpark.edu',
  organization: 'Tech Park University',
  role: 'passenger',
};

const renderWithAuth = (ui, initialRoute = '/') => {
  vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: mockUser,
    isAuthenticated: true,
  });

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {ui}
    </MemoryRouter>
  );
};

describe('CarpoolGroupsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state and displays fetched carpool groups', async () => {
    const mockGroups = [
      {
        _id: 'g_1',
        name: 'Hinjewadi Commuter Circle',
        description: 'Daily rides between Shivajinagar and Hinjewadi Phase 1',
        organization: 'Tech Park University',
        scheduleDescription: 'Mon-Fri 08:30 AM',
        origin: { address: 'Shivajinagar, Pune' },
        destination: { address: 'Hinjewadi Phase 1, Pune' },
        members: [{ user: 'user_1', role: 'admin' }],
        isPrivate: false,
      },
    ];

    groupService.getGroups.mockResolvedValue(mockGroups);

    renderWithAuth(<CarpoolGroupsPage />);

    expect(screen.getByText(/Carpool Groups & Commuter Circles/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hinjewadi Commuter Circle')).toBeInTheDocument();
      expect(screen.getByText(/Shivajinagar, Pune/i)).toBeInTheDocument();
      expect(screen.getByText(/Hinjewadi Phase 1, Pune/i)).toBeInTheDocument();
      expect(screen.getByText('Mon-Fri 08:30 AM')).toBeInTheDocument();
    });
  });

  it('renders empty state when no carpool groups match query', async () => {
    groupService.getGroups.mockResolvedValue([]);

    renderWithAuth(<CarpoolGroupsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No carpool groups found/i)).toBeInTheDocument();
      expect(screen.getByText(/Create first group/i)).toBeInTheDocument();
    });
  });

  it('opens create modal, submits form, and calls groupService.createGroup', async () => {
    groupService.getGroups.mockResolvedValue([]);
    groupService.createGroup.mockResolvedValue({
      _id: 'g_created_99',
      name: 'Cyber City Express',
    });

    renderWithAuth(<CarpoolGroupsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No carpool groups found/i)).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /^Create group$/i });
    fireEvent.click(createBtn);

    expect(screen.getByText(/Create Carpool Community Circle/i)).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText(/e\.g\. Hinjewadi IT Express, BITS Pilani Commuters/i);
    fireEvent.change(nameInput, { target: { value: 'Cyber City Express' } });

    const submitBtn = screen.getAllByRole('button', { name: /Create group/i })[1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(groupService.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cyber City Express',
          organization: 'Tech Park University',
        })
      );
    });
  });

  it('opens join modal and submits invite code via groupService.joinByCode', async () => {
    groupService.getGroups.mockResolvedValue([]);
    groupService.joinByCode.mockResolvedValue({
      _id: 'g_joined_42',
      name: 'Pune IT Park',
    });

    renderWithAuth(<CarpoolGroupsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No carpool groups found/i)).toBeInTheDocument();
    });

    const joinBtn = screen.getByRole('button', { name: /Join by code/i });
    fireEvent.click(joinBtn);

    expect(screen.getByText(/Join Group by Invite Code/i)).toBeInTheDocument();
    const codeInput = screen.getByPlaceholderText(/e\.g\. 3637B4/i);
    fireEvent.change(codeInput, { target: { value: '3637B4' } });

    const confirmJoinBtn = screen.getByRole('button', { name: /Join circle/i });
    fireEvent.click(confirmJoinBtn);

    await waitFor(() => {
      expect(groupService.joinByCode).toHaveBeenCalledWith('3637B4');
    });
  });
});

describe('CarpoolGroupDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders group metadata, rides tab, and member roster', async () => {
    const mockGroup = {
      _id: 'g_1',
      name: 'Magarpatta Commuters',
      description: 'Daily office carpool circle',
      organization: 'Tech Park University',
      inviteCode: 'MAG123',
      scheduleDescription: 'Mon-Fri 09:00 AM',
      origin: { address: 'Kothrud, Pune' },
      destination: { address: 'Magarpatta City, Pune' },
      creator: { _id: 'user_1', name: 'Sam Commuter', email: 'sam@techpark.edu' },
      members: [
        {
          user: { _id: 'user_1', name: 'Sam Commuter', role: 'passenger' },
          role: 'admin',
          joinedAt: '2026-01-01',
        },
        {
          user: { _id: 'user_2', name: 'Rohan Driver', role: 'driver' },
          role: 'member',
          joinedAt: '2026-01-02',
        },
      ],
    };

    const mockRides = [
      {
        _id: 'ride_101',
        driver: { _id: 'user_2', name: 'Rohan Driver', rating: 4.9 },
        vehicle: { model: 'Tata Nexon EV' },
        startLocation: { address: 'Kothrud, Pune' },
        destination: { address: 'Magarpatta City, Pune' },
        departureTime: '08:45',
        date: '2026-11-25',
        availableSeats: 2,
        totalSeats: 3,
        estimatedCost: 80,
        status: 'OPEN',
      },
    ];

    groupService.getGroupById.mockResolvedValue(mockGroup);
    groupService.getGroupRides.mockResolvedValue(mockRides);

    renderWithAuth(
      <Routes>
        <Route path="/groups/:id" element={<CarpoolGroupDetailPage />} />
      </Routes>,
      '/groups/g_1'
    );

    await waitFor(() => {
      expect(screen.getByText('Magarpatta Commuters')).toBeInTheDocument();
      expect(screen.getByText('MAG123')).toBeInTheDocument();
      expect(screen.getAllByText(/Kothrud, Pune/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Magarpatta City, Pune/i).length).toBeGreaterThanOrEqual(1);
    });

    // Check Rides Tab renders the ride info
    await waitFor(() => {
      expect(screen.getByText(/Tata Nexon EV/i)).toBeInTheDocument();
      expect(screen.getByText(/₹80/i)).toBeInTheDocument();
      expect(screen.getByText(/2 seats left/i)).toBeInTheDocument();
    });

    // Switch to Members tab
    const membersTab = screen.getByRole('button', { name: /Members roster/i });
    fireEvent.click(membersTab);

    await waitFor(() => {
      expect(screen.getByText('Rohan Driver')).toBeInTheDocument();
      expect(screen.getByText('Creator')).toBeInTheDocument();
    });
  });
});
