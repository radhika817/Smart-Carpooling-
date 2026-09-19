import { User } from '../models/User.js';
import { Review } from '../models/Review.js';

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id || req.user.id;
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const reviews = await Review.find({ toUser: userId })
      .populate('fromUser', 'name role profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: {
        user,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmergencyContacts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('emergencyContacts');

    return res.status(200).json({
      success: true,
      data: {
        contacts: user?.emergencyContacts || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addEmergencyContact = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, phone, relationship = 'Family' } = req.body;

    if (!name || !phone) {
      const error = new Error('Contact name and phone number are required');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.emergencyContacts) {
      user.emergencyContacts = [];
    }

    if (user.emergencyContacts.length >= 5) {
      const error = new Error('Maximum of 5 emergency contacts allowed');
      error.statusCode = 400;
      throw error;
    }

    user.emergencyContacts.push({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        contacts: user.emergencyContacts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmergencyContact = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    user.emergencyContacts = user.emergencyContacts.filter(
      (c) => c._id.toString() !== contactId.toString()
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Emergency contact removed successfully',
      data: {
        contacts: user.emergencyContacts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVerification = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { email, phone, organization, govtId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (email !== undefined) user.verificationStatus.email = Boolean(email);
    if (phone !== undefined) user.verificationStatus.phone = Boolean(phone);
    if (organization !== undefined) user.verificationStatus.organization = Boolean(organization);
    if (govtId !== undefined) user.verificationStatus.govtId = Boolean(govtId);

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: {
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
