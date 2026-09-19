import * as safetyService from '../services/safety/safetyService.js';

export const triggerSos = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const { coordinates, address } = req.body;
    const userId = req.user._id || req.user.id;

    const result = await safetyService.triggerSos({
      rideId,
      userId,
      coordinates,
      address,
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency SOS activated successfully. Emergency contacts and ride members notified.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const generateShareLink = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const { durationHours = 4 } = req.body;
    const userId = req.user._id || req.user.id;

    const result = await safetyService.generateShareLink({
      rideId,
      userId,
      durationHours: Number(durationHours) || 4,
    });

    return res.status(200).json({
      success: true,
      message: 'Time-boxed tracking link generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicTracking = async (req, res, next) => {
  try {
    const { shareToken } = req.params;
    const telemetry = await safetyService.getPublicTracking(shareToken);

    return res.status(200).json({
      success: true,
      data: telemetry,
    });
  } catch (error) {
    next(error);
  }
};
