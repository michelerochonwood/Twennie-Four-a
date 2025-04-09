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
                return res.redirect(`/promptsetcomplete/promptsetcompletesuccess?promptSetId=${promptSetId}`);
            }

            // ✅ If not final prompt, redirect to success page
            res.redirect('/promptsetnotes/notessuccess');

        } catch (error) {
            console.error("❌ Error saving prompt notes:", error);
            res.status(500).json({ error: "Internal server error." });
        }
    }
};























