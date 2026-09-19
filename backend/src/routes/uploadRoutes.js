import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as uploadService from '../services/upload/uploadService.js';

const router = express.Router();

router.use(requireAuth);

/**
 * GET /api/upload/sign
 * Returns Cloudinary signed upload parameters for private authenticated uploads.
 */
router.get('/sign', (req, res, next) => {
  try {
    const { folder = 'smartride_private/id_documents', type = 'authenticated' } = req.query;
    const signedParams = uploadService.generateSignedUploadParams({ folder, type });

    return res.status(200).json({
      success: true,
      data: signedParams,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
