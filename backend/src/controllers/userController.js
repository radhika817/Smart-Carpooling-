import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import * as uploadService from '../services/upload/uploadService.js';

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

    user.markModified('verificationStatus');
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

/**
 * Upload Government / Student ID document:
 * Automatically verifies govtId status and stores the document in private storage.
 */
export const uploadIdDocument = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    let docResult;

    if (req.file) {
      // Multipart upload through backend
      docResult = await uploadService.uploadPrivateDocument({
        fileBuffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        userId: user._id,
      });
    } else if (req.body.publicId) {
      // Client direct Cloudinary signed upload
      docResult = {
        publicId: req.body.publicId,
        storageType: 'cloudinary',
        url: req.body.secureUrl || req.body.url,
        originalName: req.body.originalName || 'id_document',
        fileType: req.body.fileType || 'image/jpeg',
        fileSize: Number(req.body.fileSize || 0),
        uploadedAt: new Date(),
      };
    } else {
      const error = new Error('Please select an ID document file to upload');
      error.statusCode = 400;
      throw error;
    }

    // Clean up any old private file if one existed
    if (user.govtIdDocument && user.govtIdDocument.publicId && user.govtIdDocument.publicId !== docResult.publicId) {
      await uploadService.deletePrivateDocument(user.govtIdDocument);
    }

    user.govtIdDocument = docResult;
    user.verificationStatus.govtId = true; // Automatically mark verified per requirement #3
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'ID document uploaded and verified successfully',
      data: {
        verificationStatus: user.verificationStatus,
        govtIdDocument: {
          storageType: user.govtIdDocument.storageType,
          originalName: user.govtIdDocument.originalName,
          fileType: user.govtIdDocument.fileType,
          fileSize: user.govtIdDocument.fileSize,
          uploadedAt: user.govtIdDocument.uploadedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get private ID document:
 * Strictly verifies that the requesting user is the document owner or an administrator.
 */
export const getIdDocument = async (req, res, next) => {
  try {
    const requesterId = (req.user._id || req.user.id).toString();
    const targetUserId = (req.params.userId || requesterId).toString();

    // Strict Authorization Check: Only owner or admin may view
    if (requesterId !== targetUserId && req.user.role !== 'admin') {
      const error = new Error('Forbidden: You do not have permission to view this private identity document');
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findById(targetUserId);
    if (!user || !user.govtIdDocument || !user.govtIdDocument.publicId) {
      const error = new Error('No private ID document on file');
      error.statusCode = 404;
      throw error;
    }

    const access = await uploadService.getPrivateDocumentAccess(user.govtIdDocument);

    if (access.type === 'redirect') {
      return res.redirect(access.url);
    }

    if (access.type === 'file') {
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Type', access.fileType || 'application/octet-stream');
      return res.sendFile(access.filePath);
    }

    const error = new Error('Unable to access document');
    error.statusCode = 500;
    throw error;
  } catch (error) {
    next(error);
  }
};

/**
 * Remove private ID document and reset verification status.
 */
export const deleteIdDocument = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.govtIdDocument) {
      await uploadService.deletePrivateDocument(user.govtIdDocument);
    }

    user.govtIdDocument = undefined;
    user.verificationStatus.govtId = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'ID document removed and verification reset',
      data: {
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

