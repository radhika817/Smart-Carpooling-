import * as analyticsService from '../services/analytics/analyticsService.js';

export const getPersonalAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const analytics = await analyticsService.getPersonalAnalytics(userId);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAdminAnalytics();

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};
