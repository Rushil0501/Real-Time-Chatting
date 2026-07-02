import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import { buildAttachmentFromFile } from '../services/storageService.js';

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest('No file uploaded');
  }
  const attachment = buildAttachmentFromFile(req.file);
  res.status(201).json({ attachment });
});
