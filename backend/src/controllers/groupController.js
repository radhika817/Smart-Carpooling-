import crypto from 'crypto';
import { CarpoolGroup } from '../models/CarpoolGroup.js';
import { Ride } from '../models/Ride.js';

/**
 * Create a new Carpool Group
 */
export const createGroup = async (req, res, next) => {
  try {
    const {
      name,
      description,
      organization,
      origin,
      destination,
      scheduleDescription,
      isPrivate,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    // Generate unique 6-character uppercase invite code (e.g. 'PUN7A2')
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const group = await CarpoolGroup.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      creator: req.user._id || req.user.id,
      organization: organization ? organization.trim() : (req.user.organization || ''),
      origin: origin || { address: '', coordinates: [0, 0] },
      destination: destination || { address: '', coordinates: [0, 0] },
      scheduleDescription: scheduleDescription ? scheduleDescription.trim() : '',
      isPrivate: Boolean(isPrivate),
      inviteCode,
      members: [
        {
          user: req.user._id || req.user.id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
    });

    const populated = await CarpoolGroup.findById(group._id)
      .populate('creator', 'name email phone profileImage organization')
      .populate('members.user', 'name email phone profileImage organization');

    return res.status(201).json({
      success: true,
      message: 'Carpool group created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List & search carpool groups
 */
export const listGroups = async (req, res, next) => {
  try {
    const { search, organization, myGroups } = req.query;
    const filter = {};

    if (myGroups === 'true' && req.user) {
      filter['members.user'] = req.user._id || req.user.id;
    }

    if (organization) {
      filter.organization = { $regex: organization, $options: 'i' };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'origin.address': { $regex: q, $options: 'i' } },
        { 'destination.address': { $regex: q, $options: 'i' } },
      ];
    }

    const groups = await CarpoolGroup.find(filter)
      .populate('creator', 'name email organization')
      .populate('members.user', 'name email organization profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed group info by ID
 */
export const getGroup = async (req, res, next) => {
  try {
    const group = await CarpoolGroup.findById(req.params.id)
      .populate('creator', 'name email phone organization profileImage')
      .populate('members.user', 'name email phone organization profileImage rating verificationStatus');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Carpool group not found.' });
    }

    return res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a group by ID (with inviteCode verification if private)
 */
export const joinGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { inviteCode } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const group = await CarpoolGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Carpool group not found.' });
    }

    // Check if already a member
    const alreadyMember = group.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'You are already a member of this carpool group.' });
    }

    // Check privacy invite code
    if (group.isPrivate) {
      if (!inviteCode || inviteCode.toUpperCase().trim() !== group.inviteCode) {
        return res.status(403).json({
          success: false,
          message: 'Invalid invite code. This carpool group is private and requires a valid invitation code.',
        });
      }
    }

    group.members.push({
      user: req.user._id || req.user.id,
      role: 'member',
      joinedAt: new Date(),
    });

    await group.save();

    const updated = await CarpoolGroup.findById(id)
      .populate('creator', 'name email organization')
      .populate('members.user', 'name email organization profileImage');

    return res.status(200).json({
      success: true,
      message: 'Successfully joined carpool group!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join group directly using an Invite Code
 */
export const joinByCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Invite code is required.' });
    }

    const cleanCode = inviteCode.toUpperCase().trim();
    const group = await CarpoolGroup.findOne({ inviteCode: cleanCode });

    if (!group) {
      return res.status(404).json({ success: false, message: 'No carpool group found with this invite code.' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const alreadyMember = group.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this carpool group.',
        data: group,
      });
    }

    group.members.push({
      user: req.user._id || req.user.id,
      role: 'member',
      joinedAt: new Date(),
    });

    await group.save();

    const updated = await CarpoolGroup.findById(group._id)
      .populate('creator', 'name email organization')
      .populate('members.user', 'name email organization profileImage');

    return res.status(200).json({
      success: true,
      message: `Joined "${group.name}" successfully!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave a carpool group
 */
export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const group = await CarpoolGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Carpool group not found.' });
    }

    group.members = group.members.filter((m) => m.user.toString() !== userId);
    await group.save();

    return res.status(200).json({
      success: true,
      message: 'You have left the carpool group.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List rides scheduled within this group
 */
export const getGroupRides = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rides = await Ride.find({ carpoolGroup: id, status: { $in: ['OPEN', 'BOOKING', 'IN_PROGRESS'] } })
      .populate([
        { path: 'driver', select: 'name email phone organization rating verificationStatus profileImage' },
        { path: 'vehicle', select: 'model registrationNumber type seats image' },
      ])
      .sort({ date: 1, departureTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: rides,
    });
  } catch (error) {
    next(error);
  }
};
