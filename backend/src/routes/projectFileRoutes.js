import express from 'express';
import {
  uploadFile,
  getProjectFiles,
  getFileDetails,
  replaceFile,
  deleteFile,
} from '../controllers/projectFileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

// mergeParams: true allows access to :projectId from parent router
const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post('/', upload.single('file'), uploadFile);
router.get('/', getProjectFiles);
router.get('/:fileId', getFileDetails);
router.put('/:fileId', upload.single('file'), replaceFile);
router.delete('/:fileId', deleteFile);

export default router;
