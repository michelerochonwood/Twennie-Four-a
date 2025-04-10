const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/profileController");
const ensureAuthenticated = require("../../middleware/ensureAuthenticated");
const upload = require('../../middleware/multer');
const cloudinary = require('../../utils/cloudinary');

// ✅ Public Profile Routes
router.get("/member/:id", profileController.viewMemberProfile);
router.get("/leader/:id", profileController.viewLeaderProfile);
router.get("/groupmember/:id", profileController.viewGroupMemberProfile);
router.get("/group/:id", profileController.viewGroupProfile);

// ✅ Private Profile Edit Routes
router.get("/member/:id/edit", ensureAuthenticated, profileController.editMemberProfile);
router.post("/member/:id/update", ensureAuthenticated, upload.single("profileImage"), profileController.updateMemberProfile);

router.get("/leader/:id/edit", ensureAuthenticated, profileController.editLeaderProfile);
router.post("/leader/:id/update", ensureAuthenticated, upload.single("profileImage"), profileController.updateLeaderProfile);

router.get("/groupmember/:id/edit", ensureAuthenticated, profileController.editGroupMemberProfile);
router.post("/groupmember/:id/update", ensureAuthenticated, upload.single("profileImage"), profileController.updateGroupMemberProfile);

router.get("/group/:id/edit", ensureAuthenticated, profileController.editGroupProfile);
router.post("/group/:id/update", ensureAuthenticated, upload.single("profileImage"), profileController.updateGroupProfile);

// (Optional test route — delete if unused)
router.post('/upload-profile', upload.single('profileImage'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const base64 = buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'twennie_profiles',
    });

    res.status(200).json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).send('Image upload failed');
  }
});

module.exports = router;

















