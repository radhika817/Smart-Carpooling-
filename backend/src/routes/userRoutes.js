import express from 'express';
import multer from 'multer';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP) and PDFs are accepted'), false);
    }
  },
});

router.get('/profile', requireAuth, userController.getProfile);
router.get('/emergency-contacts', requireAuth, userController.getEmergencyContacts);
router.post('/emergency-contacts', requireAuth, userController.addEmergencyContact);
router.delete('/emergency-contacts/:contactId', requireAuth, userController.deleteEmergencyContact);
router.post('/verify', requireAuth, userController.updateVerification);

// ID Document Verification & Private Vault Access
router.post('/verify/id-document', requireAuth, upload.single('document'), userController.uploadIdDocument);
router.get('/id-document', requireAuth, userController.getIdDocument);
router.get('/:userId/id-document', requireAuth, userController.getIdDocument);
router.delete('/id-document', requireAuth, userController.deleteIdDocument);

router.get('/:id', userController.getProfile);

export default router;
