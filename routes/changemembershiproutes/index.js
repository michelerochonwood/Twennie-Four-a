// routes/changemembership/index.js

const express = require('express');
const router = express.Router();
const changeMembershipController = require('../../controllers/changemembershipController');
const { ensureAuthenticated } = require('../../middleware/auth');

router.get('/', ensureAuthenticated, changeMembershipController.showChangeMembershipForm);
router.post('/cancel', ensureAuthenticated, changeMembershipController.cancelMembership);

module.exports = router;