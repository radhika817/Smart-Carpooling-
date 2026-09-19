import { User } from '../models/User.js';
import { Ride } from '../models/Ride.js';
import { SosAlert } from '../models/SosAlert.js';
import { CarpoolGroup } from '../models/CarpoolGroup.js';

/**
 * High-level system overview KPIs for the admin console
 */
export const getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      driverCount,
      passengerCount,
      totalRides,
      activeRides,
      completedRides,
      activeSosCount,
      totalGroups,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'passenger' }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: { $in: ['DRIVER_ARRIVING', 'IN_PROGRESS'] } }),
      Ride.countDocuments({ status: 'COMPLETED' }),
      SosAlert.countDocuments({ status: 'ACTIVE' }),
      CarpoolGroup.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        driverCount,
        passengerCount,
        totalRides,
        activeRides,
        completedRides,
        activeSosCount,
        totalGroups,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List & search platform users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { search, role, organization, isSuspended, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (organization) {
      filter.organization = { $regex: organization, $options: 'i' };
    }

    if (isSuspended !== undefined && isSuspended !== '') {
      filter.isSuspended = isSuspended === 'true';
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend or unsuspend a user account
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isSuspended, reason } = req.body;

    // Guardrail: Suicide prevention — admin cannot suspend their own account
    if (req.user._id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Guardrail: You cannot suspend your own active administrator account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isSuspended = Boolean(isSuspended);
    user.suspendedReason = isSuspended ? reason || 'Administrative suspension' : '';
    user.suspendedAt = isSuspended ? new Date() : null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account ${user.isSuspended ? 'suspended' : 'reactivated'} successfully.`,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Promote or demote user role
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['passenger', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    // Guardrail: Admin cannot demote their own account
    if (req.user._id.toString() === id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Security Guardrail: You cannot remove the admin role from your own account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role changed to ${role} successfully.`,
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Override user verification status
 */
export const updateUserVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (verificationStatus) {
      user.verificationStatus = {
        ...user.verificationStatus,
        ...verificationStatus,
      };
      user.markModified('verificationStatus');
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'User verification status updated by administrator.',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List platform rides with administrative filtering
 */
export const getRides = async (req, res, next) => {
  try {
    const { status, date, organization, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (date) {
      filter.date = date;
    }
    if (organization) {
      filter['communityScope.organization'] = { $regex: organization, $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .populate([
          { path: 'driver', select: 'name email phone organization rating' },
          { path: 'vehicle', select: 'model registrationNumber type' },
          { path: 'carpoolGroup', select: 'name organization' },
        ])
        .sort({ date: -1, departureTime: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ride.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        rides,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin cancellation of any ride with reason
 */
export const cancelRide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    ride.status = 'CANCELLED';
    ride.notes = `${ride.notes ? ride.notes + ' | ' : ''}[ADMIN CANCELLED]: ${reason || 'Administrative intervention'}`;
    await ride.save();

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled by administrator.',
      data: ride.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all SOS incidents across platform
 */
export const getSosAlerts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const alerts = await SosAlert.find(filter)
      .populate([
        { path: 'triggeredBy', select: 'name email phone role organization' },
        {
          path: 'ride',
          select: 'startLocation destination driver vehicle date departureTime status',
          populate: { path: 'driver', select: 'name phone email' },
        },
      ])
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark SOS incident as resolved
 */
export const resolveSosAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await SosAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'SOS Alert not found.' });
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    await alert.save();

    return res.status(200).json({
      success: true,
      message: 'SOS incident marked as resolved.',
      data: alert.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};
