const PromptSet = require('../models/unit_models/promptset');
const PromptSetProgress = require('../models/prompt_models/promptsetprogress');
const PromptSetRegistration = require('../models/prompt_models/promptsetregistration');
const { markPromptSetAsCompleted } = require('../controllers/promptsetcompletionController');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member');

module.exports = {
  submitPromptNotes: async (req, res) => {
    try {
      const { notes, promptSetId } = req.body;
      const memberId = req.user?.id;

      if (!memberId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
      }

      if (!notes || !promptSetId) {
        return res.status(400).json({ error: "Notes and promptSetId are required." });
      }

      console.log(`📝 Submitting notes for member ${memberId}, promptSetId: ${promptSetId}`);

      const user =
        (await Leader.findById(memberId)) ||
        (await GroupMember.findById(memberId)) ||
        (await Member.findById(memberId));

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const membershipType = user.membershipType || "member";
      console.log(`👤 User type: ${membershipType}`);

      const promptSet = await PromptSet.findById(promptSetId);
      if (!promptSet) {
        return res.status(404).render('unit_views/error', {
          layout: 'unitviewlayout',
          title: 'Prompt Set Not Found',
          errorMessage: `The prompt set could not be found after note submission.`,
        });
      }

      // ✅ Fetch registration to get target date
      const registration = await PromptSetRegistration.findOne({ memberId, promptSetId });

      let progress = await PromptSetProgress.findOne({ memberId, promptSetId });

      if (!progress) {
        console.warn(`⚠️ No progress record found for ${memberId}. Creating new.`);
        progress = new PromptSetProgress({
          memberId,
          promptSetId,
          currentPromptIndex: 0,
          completedPrompts: [],
          notes: []
        });
        await progress.save();
      }

      if (!Array.isArray(progress.completedPrompts)) progress.completedPrompts = [];
      if (!Array.isArray(progress.notes)) progress.notes = [];

      if (!progress.completedPrompts.includes(progress.currentPromptIndex)) {
        progress.completedPrompts.push(progress.currentPromptIndex);
      }

      progress.notes.push(notes);
      progress.currentPromptIndex = Math.min(progress.currentPromptIndex + 1, 20);
      await progress.save();

      console.log(`✅ Progress saved:`, {
        completedPrompts: progress.completedPrompts,
        currentPromptIndex: progress.currentPromptIndex
      });

      const remainingPrompts = 20 - progress.completedPrompts.length;
      const targetDate = registration?.targetCompletionDate?.toDateString?.() || 'not set';

      // Optional enhancement (estimate remaining time from targetDate)
      let timeRemaining = 'TBD';
      if (registration?.targetCompletionDate) {
        const now = new Date();
        const deadline = new Date(registration.targetCompletionDate);
        const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
        timeRemaining = `${daysLeft} days`;
      }

      // ✅ Final Prompt Case
      if (progress.completedPrompts.length === 20) {
        console.log(`🎉 All 20 prompts complete. Marking as completed.`);

        await markPromptSetAsCompleted(memberId, promptSetId, progress.notes);

        return res.render('prompt_views/notessuccess', {
          layout: 'unitviewlayout',
          title: 'Notes Posted',
          remainingPrompts: 0,
          targetDate,
          timeRemaining,
          badgeName: promptSet.badge?.name || 'a Twennie Badge',
          badgeImage: promptSet.badge?.image || '/images/default-badge.png',
          dashboard:
            membershipType === 'leader'
              ? '/dashboard/leader'
              : membershipType === 'group_member'
              ? '/dashboard/groupmember'
              : '/dashboard/member'
        });
      }

      // ✅ In-progress (1–19) prompts
      return res.render('prompt_views/notessuccess', {
        layout: 'unitviewlayout',
        title: 'Notes Posted',
        remainingPrompts,
        targetDate,
        timeRemaining,
        badgeName: promptSet.badge?.name || 'a Twennie Badge',
        badgeImage: promptSet.badge?.image || '/images/default-badge.png',
        dashboard:
          membershipType === 'leader'
            ? '/dashboard/leader'
            : membershipType === 'group_member'
            ? '/dashboard/groupmember'
            : '/dashboard/member'
      });

    } catch (error) {
      console.error("❌ Error saving prompt notes:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

























