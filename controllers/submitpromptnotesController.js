const PromptSetProgress = require('../models/prompt_models/promptsetprogress');
const { markPromptSetAsCompleted } = require('../controllers/promptsetcompletionController');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member'); // ✅ Added Member model





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

            console.log(`Submitting notes for member ${memberId}, promptSetId: ${promptSetId}`);

            // ✅ Check if the user is a Leader, GroupMember, or Member
            let user = await Leader.findById(memberId) || 
                       await GroupMember.findById(memberId) || 
                       await Member.findById(memberId); // ✅ Supports Members

            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            const membershipType = user.membershipType || "member"; // Default to "member" if no type found
            console.log(`User type: ${membershipType}`);

            // ✅ Find or create progress document using `promptSetId`
            let progress = await PromptSetProgress.findOne({ memberId, promptSetId });

            if (!progress) {
                console.warn(`No existing progress record found for ${memberId}, initializing new record.`);
                progress = new PromptSetProgress({
                    memberId,
                    promptSetId,
                    currentPromptIndex: 0,
                    completedPrompts: [],
                    notes: []
                });
                await progress.save();
            }

            // ✅ Ensure arrays are initialized
            if (!Array.isArray(progress.completedPrompts)) progress.completedPrompts = [];
            if (!Array.isArray(progress.notes)) progress.notes = [];

            // ✅ Add current prompt index to completedPrompts only if not already completed
            if (!progress.completedPrompts.includes(progress.currentPromptIndex)) {
                progress.completedPrompts.push(progress.currentPromptIndex);
            }

            // ✅ Append notes
            progress.notes.push(notes);

            // ✅ Advance to next prompt, but **not past 21**
            progress.currentPromptIndex = Math.min(progress.currentPromptIndex + 1, 20);

            // ✅ Save updates
            await progress.save();

            console.log(`✅ Updated Progress Data for ${membershipType}:`, {
                completedPrompts: progress.completedPrompts,
                currentPromptIndex: progress.currentPromptIndex
            });

            // ✅ Check if the prompt set is completed
            if (progress.completedPrompts.length === 20) {  
                console.log(`All 20 prompts completed for ${membershipType} ${memberId}, promptSetId ${promptSetId}.`);

                // ✅ Mark as completed
                await markPromptSetAsCompleted(memberId, promptSetId, progress.notes);

                console.log(`✅ Redirecting ${membershipType} to completion success page with promptSetId: ${promptSetId}`);
const promptSet = await PromptSet.findById(promptSetId);
if (!promptSet) {
  return res.status(404).render('unit_views/error', {
    layout: 'unitviewlayout',
    title: 'Prompt Set Not Found',
    errorMessage: `The prompt set could not be found after note submission.`,
  });
}

const remainingPrompts = 20 - progress.completedPrompts.length;
const targetDate = progress.targetCompletionDate?.toDateString?.() || 'not set';
const timeRemaining = 'TBD'; // You can compute this if you want

res.render('unit_views/notes_success', {
  layout: 'unitviewlayout',
  title: 'Notes Posted',
  remainingPrompts,
  targetDate,
  timeRemaining,
  badgeName: promptSet.badge?.name || 'a Twennie Badge',
  badgeImage: promptSet.badge?.image || '/images/default-badge.png',
  dashboard: membershipType === 'leader' ? '/dashboard/leader'
            : membershipType === 'group_member' ? '/dashboard/groupmember'
            : '/dashboard/member'
});

            }

            // ✅ If not final prompt, redirect to success page
const promptSet = await PromptSet.findById(promptSetId);
if (!promptSet) {
  return res.status(404).render('unit_views/error', {
    layout: 'unitviewlayout',
    title: 'Prompt Set Not Found',
    errorMessage: `The prompt set could not be found after note submission.`,
  });
}

const remainingPrompts = 20 - progress.completedPrompts.length;
const targetDate = progress.targetCompletionDate?.toDateString?.() || 'not set';
const timeRemaining = 'TBD';

res.render('unit_views/notes_success', {
  layout: 'unitviewlayout',
  title: 'Notes Posted',
  remainingPrompts,
  targetDate,
  timeRemaining,
  badgeName: promptSet.badge?.name || 'a Twennie Badge',
  badgeImage: promptSet.badge?.image || '/images/default-badge.png',
  dashboard: membershipType === 'leader'
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























