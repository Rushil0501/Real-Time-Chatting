import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadSingleFile } from '../middleware/upload.js';
import { AppError } from '../utils/AppError.js';
import * as uploadController from '../controllers/upload.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(AppError.badRequest(`Upload error: ${err.message}`));
    }
    if (err) {
      return next(AppError.badRequest(err.message));
    }
    next();
  });
}, uploadController.uploadFile);

export default router;
