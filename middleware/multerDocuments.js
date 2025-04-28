const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Word, Excel, and PowerPoint files are allowed"), false);
    }
  }
});

const uploadDocs = (req, res, next) => {
  const singleUpload = upload.single('template_file');

  singleUpload(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err);
      return res.status(400).render('unit_form_views/error', {
        layout: 'unitformlayout',
        title: 'Upload Error',
        errorMessage: err.message || 'Error uploading template file.'
      });
    }

    if (!req.body) {
      console.warn('⚠️ Warning: req.body was empty. Forcing empty object.');
      req.body = {}; // Patch empty body to prevent CSRF crash
    }

    next();
  });
};

module.exports = uploadDocs;
