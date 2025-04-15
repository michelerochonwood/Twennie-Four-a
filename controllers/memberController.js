const Member = require('../models/member_models/member');
const { validateMemberData } = require('../utils/validateMember');
const MemberProfile = require('../models/profile_models/member_profile');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  showMemberForm: (req, res) => {
    res.render('member_form_views/member_form', {
      layout: 'memberformlayout',
      title: 'Individual Membership Form',
      csrfToken: res.locals.csrfToken,
    });
  },

  createMember: async (req, res) => {
    try {
      const {
        name,
        professionalTitle,
        organization,
        industry,
        username,
        email,
        password,
        topic1,
        topic2,
        topic3,
        accessLevel
      } = req.body;

      console.log('Received registration data:', { name, username, email, accessLevel });

      // Validate form data
      const errors = validateMemberData(req.body);
      if (errors.length > 0) {
        console.warn('Validation errors:', errors);
        return res.status(400).render('member_form_views/member_form', {
          layout: 'memberformlayout',
          title: 'Individual Membership Form',
          errors,
          data: req.body,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newMember = new Member({
        name,
        professionalTitle,
        organization,
        industry,
        username,
        email,
        password: hashedPassword,
        topics: { topic1, topic2, topic3 },
        accessLevel: accessLevel || 'free_individual',
        membershipType: 'member',
      });

      await newMember.save();
      console.log('✅ Member saved:', newMember._id);

      const memberProfile = new MemberProfile({
        memberId: newMember._id,
        name: newMember.name,
        professionalTitle: newMember.professionalTitle,
        profileImage: "/images/default-avatar.png",
        biography: "",
        goals: "",
        topics: {
          topic1: topic1 || "Default Topic 1",
          topic2: topic2 || "Default Topic 2",
          topic3: topic3 || "Default Topic 3"
        }
      });

      await memberProfile.save();
      console.log(`✅ Member Profile Created: ${memberProfile._id}`);

      // Set session
      req.session.user = {
        id: newMember._id,
        username: newMember.username,
        membershipType: newMember.membershipType,
      };

      // If member chose paid membership, redirect to Stripe
      if (accessLevel === 'paid_individual') {
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
                unit_amount: 1500, // $15.00 in cents
              },
              quantity: 1,
            },
          ],
          success_url: `${process.env.BASE_URL}/member/payment/success`,
          cancel_url: `${process.env.BASE_URL}/member/payment/cancel`,
        });

        return res.redirect(303, session.url);
      }

      // Otherwise, show success page for free/contributor memberships
      res.render("member_form_views/register_success", {
        layout: "memberformlayout",
        title: "Registration Successful",
        username: newMember.username,
        user: newMember,
        dashboardLink: "/dashboard/member"
      });

    } catch (err) {
      console.error('❌ Error creating member:', err);
      res.status(500).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Registration Error',
        errorMessage: 'An error occurred while creating the member. Please try again.',
      });
    }
  }
};

