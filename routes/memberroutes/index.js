const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const memberController = require('../../controllers/memberController');
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

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

router.get('/payment/success', (req, res) => {
  res.send('Payment successful! You’ll be registered shortly.');
});

router.get('/payment/cancel', (req, res) => {
  res.send('Payment canceled. You can try again anytime.');
})


router.post('/payment', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Twennie Paid Individual Membership',
            },
            unit_amount: 1500, // $15.00 (in cents)
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/member/payment/success`,
      cancel_url: `${baseUrl}/member/payment/cancel`,
      
    });

    res.redirect(303, session.url); // redirects to Stripe checkout
  } catch (err) {
    console.error('Stripe payment error:', err);
    res.status(500).send('An error occurred with Stripe');
  }
});

module.exports = router;