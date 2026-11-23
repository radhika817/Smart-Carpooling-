import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../services/api';
import { adminService } from '../services/adminService';
import { groupService } from '../services/groupService';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminService API Response Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes getOverview when response is directly unwrapped payload', async () => {
    const mockOverview = { stats: { totalUsers: 42, activeRides: 5 } };
    api.get.mockResolvedValueOnce(mockOverview);

    const result = await adminService.getOverview();
    expect(api.get).toHaveBeenCalledWith('/admin/overview');
    expect(result).toEqual(mockOverview);
    expect(result.stats.totalUsers).toBe(42);
  });

  it('normalizes getOverview when response is nested inside data property', async () => {
    const mockOverview = { stats: { totalUsers: 15, activeRides: 2 } };
    api.get.mockResolvedValueOnce({ data: mockOverview });

    const result = await adminService.getOverview();
    expect(result).toEqual(mockOverview);
    expect(result.stats.totalUsers).toBe(15);
  });

  it('normalizes getUsers list for admin console', async () => {
    const mockUsers = { users: [{ _id: 'u1', name: 'Alice' }], pagination: { page: 1 } };
    api.get.mockResolvedValueOnce(mockUsers);

    const result = await adminService.getUsers({ role: 'driver' });
    expect(api.get).toHaveBeenCalledWith('/admin/users', { params: { role: 'driver' } });
    expect(result).toEqual(mockUsers);
    expect(result.users).toHaveLength(1);
  });

  it('normalizes getRides list for admin console', async () => {
    const mockRides = { rides: [{ _id: 'r1', destination: { address: 'Hinjewadi' } }] };
    api.get.mockResolvedValueOnce({ data: mockRides });

    const result = await adminService.getRides({ status: 'OPEN' });
    expect(api.get).toHaveBeenCalledWith('/admin/rides', { params: { status: 'OPEN' } });
    expect(result).toEqual(mockRides);
  });

  it('normalizes getSosAlerts list for admin console', async () => {
    const mockAlerts = [{ _id: 'sos1', status: 'ACTIVE', severity: 'HIGH' }];
    api.get.mockResolvedValueOnce(mockAlerts);

    const result = await adminService.getSosAlerts();
    expect(result).toEqual(mockAlerts);
    expect(result[0].status).toBe('ACTIVE');
  });

  it('normalizes updateUserStatus patch call', async () => {
    api.patch.mockResolvedValueOnce({ success: true, isSuspended: true });

    const result = await adminService.updateUserStatus('u1', { isSuspended: true, reason: 'Violation' });
    expect(api.patch).toHaveBeenCalledWith('/admin/users/u1/status', { isSuspended: true, reason: 'Violation' });
    expect(result.isSuspended).toBe(true);
  });
});

describe('groupService API Response Normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes getGroups when returned as raw array', async () => {
    const mockGroups = [{ _id: 'g1', name: 'Tech Corridor Commuters' }];
    api.get.mockResolvedValueOnce(mockGroups);

    const result = await groupService.getGroups();
    expect(api.get).toHaveBeenCalledWith('/groups', { params: undefined });
    expect(result).toEqual(mockGroups);
  });

  it('normalizes getGroups when returned wrapped in data', async () => {
    const mockGroups = [{ _id: 'g2', name: 'Campus Circle' }];
    api.get.mockResolvedValueOnce({ data: mockGroups });

    const result = await groupService.getGroups({ myGroups: 'true' });
    expect(result).toEqual(mockGroups);
    expect(result[0].name).toBe('Campus Circle');
  });

  it('normalizes getGroupById correctly', async () => {
    const mockGroup = { _id: 'g1', name: 'Tech Corridor', inviteCode: 'PUN123' };
    api.get.mockResolvedValueOnce(mockGroup);

    const result = await groupService.getGroupById('g1');
    expect(api.get).toHaveBeenCalledWith('/groups/g1');
    expect(result.inviteCode).toBe('PUN123');
  });

  it('normalizes createGroup payload and response', async () => {
    const newGroup = { name: 'Morning Riders', isPrivate: true };
    const created = { _id: 'g3', ...newGroup, inviteCode: 'NEW999' };
    api.post.mockResolvedValueOnce({ data: created });

    const result = await groupService.createGroup(newGroup);
    expect(api.post).toHaveBeenCalledWith('/groups', newGroup);
    expect(result).toEqual(created);
    expect(result._id).toBe('g3');
  });

  it('normalizes joinByCode request', async () => {
    const joined = { _id: 'g1', name: 'Tech Corridor' };
    api.post.mockResolvedValueOnce(joined);

    const result = await groupService.joinByCode('PUN123');
    expect(api.post).toHaveBeenCalledWith('/groups/join-by-code', { inviteCode: 'PUN123' });
    expect(result).toEqual(joined);
  });

  it('normalizes getGroupRides request', async () => {
    const mockRides = [{ _id: 'r10', departureTime: '09:00' }];
    api.get.mockResolvedValueOnce({ data: mockRides });

    const result = await groupService.getGroupRides('g1');
    expect(api.get).toHaveBeenCalledWith('/groups/g1/rides');
    expect(result).toEqual(mockRides);
  });
});
