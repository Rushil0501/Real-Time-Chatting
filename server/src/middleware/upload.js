import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { uploadConfig } from '../services/storageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, '..', '..', uploadConfig.dir);

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 16);
    cb(null, `${nanoid(24)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
  cb(null, true);
}

export const uploadSingleFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: uploadConfig.maxSizeBytes, files: 1 },
}).single('file');
