// badgesroutes.js
const express = require('express');
const router = express.Router();
const badgesController = require('../../controllers/badgesController');

// When mounted at '/badges/', this route will be '/badges/'
router.get('/', badgesController.showBadgesView);

// This route will be '/badges/pick'
router.post('/pick', badgesController.pickBadge);

module.exports = router;



