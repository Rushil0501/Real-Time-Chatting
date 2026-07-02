import { env } from '../config/env.js';

// Storage is abstracted behind this module so a future swap to S3/MinIO only
// requires changing this file (and the multer disk destination in middleware/upload.js).
// Current implementation: local disk under UPLOAD_DIR, served statically from /uploads.

function kindFromMimeType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

export function buildAttachmentFromFile(file) {
  return {
    url: `${'/uploads'}/${file.filename}`,
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    kind: kindFromMimeType(file.mimetype),
  };
}

export function absoluteUploadUrl(req, relativeUrl) {
  return `${req.protocol}://${req.get('host')}${relativeUrl}`;
}

export const uploadConfig = {
  dir: env.UPLOAD_DIR,
  maxSizeBytes: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
};
