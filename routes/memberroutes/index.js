const express = require('express');
const router = express.Router();
const memberController = require('../../controllers/memberController');

// Member form routes
router.get('/form', memberController.showMemberForm);
router.post('/form', memberController.createMember);

// Choose membership (landing)
router.get('/choose', (req, res) => {
  res.render('member_form_views/choose_membership', {
    layout: 'memberformlayout'
  });
});

// Success and Cancel endpoints for Stripe
router.get('/payment/success', (req, res) => {
  res.send('Payment successful! You’ll be registered shortly.');
});

router.get('/payment/cancel', (req, res) => {
  res.send('Payment canceled. You can try again anytime.');
});

// Fallback success page for non-paid registrations
router.get('/register_success', (req, res) => {
  const username = req.session.user?.username || 'User';
  res.render('member_form_views/register_success', {
    layout: 'memberformlayout',
    title: 'Registration Successful',
    username
  });
});

module.exports = router;
