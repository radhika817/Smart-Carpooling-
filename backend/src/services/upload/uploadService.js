import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local private storage directory (outside public assets)
const PRIVATE_STORAGE_DIR = path.resolve(__dirname, '../../../uploads/private/id_documents');

// Ensure directory exists
if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
  fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
}

// Check Cloudinary configuration
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Generates signed Cloudinary upload params for private (authenticated) uploads.
 */
export const generateSignedUploadParams = ({ folder = 'smartride_private/id_documents', type = 'authenticated' } = {}) => {
  if (!isCloudinaryConfigured()) {
    return {
      isCloudinaryConfigured: false,
      message: 'Cloudinary credentials not configured on server; using secure local private vault',
    };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    folder,
    timestamp,
    type,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  return {
    isCloudinaryConfigured: true,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    type,
  };
};

/**
 * Uploads a document securely:
 * - If Cloudinary configured: stores with type: 'authenticated' (private, no public URL delivery).
 * - Otherwise: stores in private backend vault with a cryptographically random UUID filename.
 */
export const uploadPrivateDocument = async ({ fileBuffer, originalName, mimeType, userId }) => {
  if (isCloudinaryConfigured()) {
    // Cloudinary authenticated upload
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'smartride_private/id_documents',
          type: 'authenticated', // Restricts delivery to signed requests only
          resource_type: 'auto',
          tags: [`user_${userId}`, 'id_verification', 'private'],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            publicId: result.public_id,
            storageType: 'cloudinary',
            url: result.secure_url,
            originalName: originalName || 'id_document',
            fileType: mimeType || result.format || 'application/octet-stream',
            fileSize: fileBuffer.length,
            uploadedAt: new Date(),
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // Local private storage fallback
  const ext = path.extname(originalName || '').toLowerCase() || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
  const safeFilename = `${crypto.randomUUID()}${ext}`;
  const targetPath = path.join(PRIVATE_STORAGE_DIR, safeFilename);

  await fs.promises.writeFile(targetPath, fileBuffer);

  return {
    publicId: safeFilename,
    storageType: 'local',
    url: `/api/users/id-document`,
    originalName: originalName || 'id_document',
    fileType: mimeType || 'application/octet-stream',
    fileSize: fileBuffer.length,
    uploadedAt: new Date(),
  };
};

/**
 * Retrieves the private document for authorized viewers (owner or admin).
 */
export const getPrivateDocumentAccess = async (govtIdDocument) => {
  if (!govtIdDocument || !govtIdDocument.publicId) {
    const error = new Error('No document found');
    error.statusCode = 404;
    throw error;
  }

  if (govtIdDocument.storageType === 'cloudinary') {
    if (isCloudinaryConfigured()) {
      // Generate a short-lived (1 hour) signed private download URL
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      const signedUrl = cloudinary.utils.private_download_url(
        govtIdDocument.publicId,
        govtIdDocument.fileType?.includes('pdf') ? 'pdf' : 'jpg',
        {
          type: 'authenticated',
          expires_at: expiresAt,
        }
      );
      return { type: 'redirect', url: signedUrl };
    }
  }

  // Local storage
  const filePath = path.join(PRIVATE_STORAGE_DIR, govtIdDocument.publicId);
  if (!fs.existsSync(filePath)) {
    const error = new Error('Document file not found in private vault');
    error.statusCode = 404;
    throw error;
  }

  return {
    type: 'file',
    filePath,
    fileType: govtIdDocument.fileType,
    originalName: govtIdDocument.originalName,
  };
};

/**
 * Deletes a private document.
 */
export const deletePrivateDocument = async (govtIdDocument) => {
  if (!govtIdDocument || !govtIdDocument.publicId) return;

  try {
    if (govtIdDocument.storageType === 'cloudinary' && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(govtIdDocument.publicId, { type: 'authenticated' });
    } else if (govtIdDocument.storageType === 'local') {
      const filePath = path.join(PRIVATE_STORAGE_DIR, govtIdDocument.publicId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch (err) {
    console.warn('Could not delete private file:', err.message);
  }
};
