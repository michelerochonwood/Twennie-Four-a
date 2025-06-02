// controllers/changemembershipController.js

const CancelledMember = require('../models/member_models/cancelledmember');
const Member = require('../models/member_models/member');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');

module.exports = {
  showChangeMembershipForm: (req, res) => {
    if (!req.user) {
      return res.status(401).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Unauthorized',
        errorMessage: 'You must be logged in to change your membership.'
      });
    }

    res.render('change_membership/change_membership', {
      layout: 'memberformlayout',
      csrfToken: req.csrfToken(),
      user: req.user
    });
  },

  cancelMembership: async (req, res) => {
    try {
      const user = req.user;
      const reason = req.body.reason || '';

      if (!user) {
        return res.status(401).render('member_form_views/error', {
          layout: 'memberformlayout',
          title: 'Unauthorized',
          errorMessage: 'You must be logged in to cancel your membership.'
        });
      }

      const CancelRecord = new CancelledMember({
        originalId: user._id,
        name: user.name || user.groupLeaderName,
        username: user.username,
        email: user.email || user.groupLeaderEmail,
        membershipType: user.membershipType,
        accessLevel: user.accessLevel || null,
        wasLeader: user.membershipType === 'leader',
        reason
      });

      await CancelRecord.save();

      // Deactivate account
      if (user.membershipType === 'member') {
        await Member.findByIdAndUpdate(user._id, { isActive: false });
      } else if (user.membershipType === 'leader') {
        await Leader.findByIdAndUpdate(user._id, { isActive: false });
      } else if (user.membershipType === 'group_member') {
        await GroupMember.findByIdAndUpdate(user._id, { isActive: false });
      }

      // Destroy session
      req.session.destroy(() => {
        res.render('change_membership/cancel_success', {
          layout: 'memberformlayout',
          title: 'Membership Cancelled'
        });
      });

    } catch (err) {
      console.error('❌ Error cancelling membership:', err);
      res.status(500).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Error Cancelling Membership',
        errorMessage: 'An error occurred while cancelling your membership. Please try again.'
      });
    }
  }
};