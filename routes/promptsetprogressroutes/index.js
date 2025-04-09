const express = require('express');
const router = express.Router();
const promptsetprogressController = require('../../controllers/promptsetprogressController');
const isAuthenticated = require('../../middleware/ensureAuthenticated');

// ✅ Route for retrieving prompt progress (Works for both Leaders & Group Members)
router.get('/progress', isAuthenticated, promptsetprogressController.getPromptProgress);

module.exports = router;
