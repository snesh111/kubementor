import multer from 'multer';
import { detectFileType } from '../validators/projectFileValidator.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const fileType = detectFileType(file.originalname);

  if (fileType !== 'unknown') {
    cb(null, true);
  } else {
    cb(
      new Error(
        'File type not supported. Only .yaml, .yml, and Dockerfile files are accepted.'
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;
