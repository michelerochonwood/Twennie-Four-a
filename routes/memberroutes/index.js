const express = require('express');
const router = express.Router();

const memberController = require('../../controllers/memberController');

// Member Routes
router.get('/form', memberController.showMemberForm);
router.post('/form', memberController.createMember);

// New route for the choose membership gateway
router.get('/choose', (req, res) => {
    res.render('member_form_views/choose_membership', {
      layout: 'memberformlayout'
    });
  });

  router.get('/register_success', (req, res) => {
    const username = req.session.user?.username || 'User'; // Retrieve username from session or use a fallback
    res.render('member_form_views/register_success', {
        layout: 'memberformlayout',
        title: 'Registration Successful',
        username
    });
});

module.exports = router;