const express = require('express');
const router = express.Router();
const badgesController = require('../../controllers/badgesController');

// Route to view badges
router.get('/', badgesController.showBadgesView);

// Route to pick a badge
router.post('/pick', badgesController.pickBadge);

module.exports = router;



