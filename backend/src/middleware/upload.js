import multer from 'multer';

// Use memory storage so file buffers can be uploaded to Cloudinary
const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ];

  const ext = (file.originalname || '').split('.').pop().toLowerCase();
  const allowedExtensions = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'];

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPEG, PNG, WebP, GIF, AVIF) are allowed.'), false);
  }
};

const videoFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/ogg',
    'video/mp4v-es',
    'video/x-m4v'
  ];

  const ext = (file.originalname || '').split('.').pop().toLowerCase();
  const allowedExtensions = ['mp4', 'webm', 'mov', 'mkv', 'ogg', 'm4v'];

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only valid video formats (MP4, WebM, MOV, MKV, OGG) are allowed. Max size 50MB.'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max image size
  },
  fileFilter: imageFileFilter
});

export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max video size
  },
  fileFilter: videoFileFilter
});

export const uploadPhoto = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max photo size
  },
  fileFilter: imageFileFilter
});

export default upload;
