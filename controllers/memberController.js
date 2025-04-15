const Member = require('../models/member_models/member');
const { validateMemberData } = require('../utils/validateMember');
const MemberProfile = require('../models/profile_models/member_profile');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

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

      // ✅ Validate input
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

      // ✅ Secure password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Create Member
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

      // ✅ Create Profile
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

      // ✅ Store session
      req.session.user = {
        id: newMember._id,
        username: newMember.username,
        membershipType: newMember.membershipType,
      };

      // ✅ Redirect to Stripe if paid
      if (accessLevel === 'paid_individual') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'cad',
                unit_amount: 1700, // $17.00 CAD in cents
                recurring: { interval: 'month' },
                product_data: {
                  name: 'Twennie Paid Individual Membership',
                },
                tax_behavior: 'exclusive', // GST/HST will be added on top
              },
              quantity: 1,
            },
          ],
          automatic_tax: { enabled: true }, // ✅ Enable GST/HST calculations
          billing_address_collection: 'required', // ✅ Ensures province is collected
          success_url: `${baseUrl}/member/payment/success`,
          cancel_url: `${baseUrl}/member/payment/cancel`,
        });
      
        return res.redirect(303, session.url);
      }
      

      // ✅ Free or Contributor — show success
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


