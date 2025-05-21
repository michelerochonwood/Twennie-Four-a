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

      if (!memberId || !promptSetId || !notes) {
        return res.status(400).render('unit_views/error', {
          layout: 'unitviewlayout',
          title: 'Error',
          errorMessage: 'Missing notes, user, or prompt set ID.',
        });
      }

      console.log(`📝 Submitting notes for member ${memberId}, promptSetId: ${promptSetId}`);

      const user =
        (await Leader.findById(memberId)) ||
        (await GroupMember.findById(memberId)) ||
        (await Member.findById(memberId));

      if (!user) {
        return res.status(404).render('unit_views/error', {
          layout: 'unitviewlayout',
          title: 'Error',
          errorMessage: 'User not found.',
        });
      }

      const membershipType = user.membershipType || "member";

      const promptSet = await PromptSet.findById(promptSetId);
      if (!promptSet) {
        return res.status(404).render('unit_views/error', {
          layout: 'unitviewlayout',
          title: 'Prompt Set Not Found',
          errorMessage: 'The prompt set could not be found.',
        });
      }

      const registration = await PromptSetRegistration.findOne({ memberId, promptSetId });
      const targetDate = registration?.targetCompletionDate?.toDateString?.() || 'Not Set';

      let progress = await PromptSetProgress.findOne({ memberId, promptSetId });

      if (!progress) {
        progress = new PromptSetProgress({
          memberId,
          promptSetId,
          currentPromptIndex: 1,
          completedPrompts: [],
          notes: []
        });
      }

      if (!Array.isArray(progress.completedPrompts)) progress.completedPrompts = [];
      if (!Array.isArray(progress.notes)) progress.notes = [];

      const currentPrompt = progress.currentPromptIndex;

      if (!progress.completedPrompts.includes(currentPrompt)) {
        progress.completedPrompts.push(currentPrompt);
      }

      progress.notes.push(notes);

      const isFinalPrompt = currentPrompt === 20;
      progress.currentPromptIndex = Math.min(currentPrompt + 1, 20); // Cap at 20
      await progress.save();

      console.log("✅ Progress saved:", {
        currentPrompt: currentPrompt,
        nextPromptIndex: progress.currentPromptIndex,
        completed: progress.completedPrompts.length
      });

      const remainingPrompts = 20 - progress.completedPrompts.length;

      let timeRemaining = 'TBD';
      if (registration?.targetCompletionDate) {
        const now = new Date();
        const deadline = new Date(registration.targetCompletionDate);
        const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
        const weeksLeft = Math.ceil(daysLeft / 7);
        timeRemaining = weeksLeft > 0 ? `${weeksLeft} week${weeksLeft === 1 ? '' : 's'}` : 'less than a week';
      }

      if (isFinalPrompt && progress.completedPrompts.length >= 20) {
        console.log("🎯 Final prompt completed. Marking prompt set as complete.");
        await markPromptSetAsCompleted(memberId, promptSetId, progress.notes);

        return res.redirect(`/promptsetcomplete/success?promptSetId=${promptSetId}`);
      }

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
      res.status(500).render('unit_views/error', {
        layout: 'unitviewlayout',
        title: 'Error',
        errorMessage: 'An error occurred while submitting your notes.',
      });
    }
  }
};


























