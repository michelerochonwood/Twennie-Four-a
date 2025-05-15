const PromptSetProgress = require('../models/prompt_models/promptsetprogress');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member');

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
        console.log(`✅ New progress initialized for user ${memberId}, starting at Prompt 1`);
      } else if (progress.currentPromptIndex === 0) {
        progress.currentPromptIndex = 1;
        await progress.save();
        console.log(`🔁 Progress updated to skip Prompt 0 for user ${memberId}`);
      } else {
        console.log(`ℹ️ User ${memberId} already started this set at Prompt ${progress.currentPromptIndex}`);
      }

      // Determine dashboard path
      const leader = await Leader.findById(memberId);
      const groupMember = await GroupMember.findById(memberId);

      const dashboardPath = leader
        ? '/dashboard/leader'
        : groupMember
        ? '/dashboard/groupmember'
        : '/dashboard/member';

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

