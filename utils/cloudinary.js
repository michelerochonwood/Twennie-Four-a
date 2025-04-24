const cloudinary = require('cloudinary').v2;

// Configure using environment variables from Railway
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optional: helpful debug log during startup
console.log("✅ Cloudinary config loaded:");
console.log("cloud_name:", process.env.CLOUDINARY_NAME);
console.log("api_key:", process.env.CLOUDINARY_API_KEY ? '[REDACTED]' : 'undefined');
console.log("api_secret:", process.env.CLOUDINARY_API_SECRET ? '[REDACTED]' : 'undefined');

module.exports = {
  cloudinary,
  uploader: cloudinary.uploader
};
