const PromptSetProgress = require('../models/prompt_models/promptsetprogress');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member');
const PromptSetRegistration = require('../models/prompt_models/promptsetregistration');

module.exports = {
  startPromptSet: async (req, res) => {
    try {
      const { promptSetId } = req.body;
      const memberId = req.user?.id;

      if (!memberId || !promptSetId) {
        return res.status(400).render('unit_views/error', {
          layout: 'unitviewlayout',
          title: 'Error',
          errorMessage: 'Missing user or prompt set information.',
        });
      }

      let progress = await PromptSetProgress.findOne({ memberId, promptSetId });

      if (!progress) {
        progress = new PromptSetProgress({
          memberId,
          promptSetId,
          currentPromptIndex: 1,
          completedPrompts: [],
          notes: []
        });
        await progress.save();
        console.log(`✅ Initialized progress for user ${memberId}, starting at Prompt 1`);
      } else {
        console.log(`ℹ️ Progress already exists for user ${memberId}`);
      }

      // Determine dashboard path based on user type
      const leader = await Leader.findById(memberId);
      const groupMember = await GroupMember.findById(memberId);
      const member = await Member.findById(memberId);

      let dashboardPath = '/dashboard/member';
      if (leader) dashboardPath = '/dashboard/leader';
      else if (groupMember) dashboardPath = '/dashboard/groupmember';

      res.redirect(dashboardPath);

    } catch (error) {
      console.error("❌ Error starting prompt set:", error);
      res.status(500).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Error',
        errorMessage: 'An error occurred while starting your prompt set. Please try again.',
      });
    }
  }
};
