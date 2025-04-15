const PromptSet = require('../models/unit_models/promptset');
const PromptSetCompletion = require('../models/prompt_models/promptsetcompletion');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member'); // ✅ Added Member model





module.exports = {
    // ✅ Mark a Prompt Set as Completed for Leaders, Group Members, and Members
    markPromptSetAsCompleted: async (memberId, promptSetId, notes) => {

        try {
            console.log(`Marking prompt set ${promptSetId} as completed for member ${memberId}`);

            // ✅ Check if the user is a Leader, Group Member, or Member
            let user = await Leader.findById(memberId) || 
                       await GroupMember.findById(memberId) || 
                       await Member.findById(memberId);

            if (!user) {
                console.error(`❌ User not found for ID: ${memberId}`);
                return;
            }

            const membershipType = user.membershipType || "member"; // ✅ Default to "member" if not set
            console.log(`User identified as: ${membershipType}`);

            // ✅ Ensure the completion record does not already exist
            const existingCompletion = await PromptSetCompletion.findOne({ memberId, promptSetId });
            if (existingCompletion) {
                console.warn(`⚠️ Completion record already exists for ${membershipType} ${memberId}, promptSetId ${promptSetId}`);
                return;
            }

            // ✅ Fetch the prompt set details
            const promptSet = await PromptSet.findById(promptSetId);
            if (!promptSet) {
                console.error(`❌ Prompt Set not found for ID: ${promptSetId}`);
                return;
            }

            // ✅ Save the completion record
            const completion = new PromptSetCompletion({
                memberId,
                memberType: membershipType,
                promptSetId,
                earnedBadge: "placeholder-badge",
                notes
            });

            await completion.save();
            console.log(`✅ Completion record saved for ${membershipType} - ${promptSet.promptset_title}`);

        } catch (error) {
            console.error("❌ Error saving completion record:", error);
        }
    },

    // ✅ Fetch All Completed Prompt Sets for a Member (Leader, Group Member, or Member)
    getCompletedPromptSets: async (req, res) => {

        try {
            const memberId = req.user?.id;
            if (!memberId) {
                console.error("❌ Unauthorized access attempt.");
                return res.status(401).json({ success: false, errorMessage: "Unauthorized. Please log in." });
            }

            console.log(`Fetching completed prompt sets for member: ${memberId}`);

            // ✅ Fetch completed prompt sets for the user
            const completedSets = await PromptSetCompletion.find({ memberId }).populate('promptSetId');

            if (!completedSets.length) {
                console.log(`ℹ️ No completed prompt sets found for ${memberId}`);
                return res.json({ success: true, completedPromptSets: [] });
            }

            res.json({ success: true, completedPromptSets: completedSets });

        } catch (error) {
            console.error("❌ Error fetching completed prompt sets:", error);
            res.status(500).json({ success: false, errorMessage: "Failed to fetch completed prompt sets." });
        }
    },

    // ✅ Render the Completion Success Page with Correct Data
    promptsetCompleteSuccess: async (req, res) => {

        try {
            console.log("📌 Rendering prompt set completion success page");

            // ✅ Extract parameters from the request
            const { promptSetId } = req.query;

            if (!promptSetId) {
                console.error("❌ No promptSetId provided for completion success.");
                return res.status(400).render('error', { 
                    title: "Error", 
                    errorMessage: "Invalid request. No prompt set ID provided."
                });
            }

            // ✅ Fetch the prompt set details from MongoDB
            const promptSet = await PromptSet.findById(promptSetId);
            if (!promptSet) {
                console.error(`❌ Prompt Set not found for ID: ${promptSetId}`);
                return res.status(404).render('error', { 
                    title: "Error", 
                    errorMessage: "Prompt set not found."
                });
            }

            console.log(`✅ Found prompt set: ${promptSet.promptset_title}`);

            // ✅ Determine Dashboard Path for All User Types
            let dashboardPath = '/dashboard';
            if (req.user?.membershipType === 'leader') {
                dashboardPath = '/dashboard/leader';
            } else if (req.user?.membershipType === 'group_member') {
                dashboardPath = '/dashboard/groupmember';
            } else {
                dashboardPath = '/dashboard/member'; // ✅ Ensure members redirect properly
            }

            // ✅ Render the completion success page
            res.render('prompt_views/promptsetcompletesuccess', {
                layout: 'unitviewlayout',
                title: promptSet.promptset_title || "Unknown Title",
                purpose: promptSet.purpose || "No description available",
                badge: "placeholder-badge",
                dashboard: dashboardPath
            });

        } catch (error) {
            console.error("❌ Error rendering completion success page:", error);
            res.status(500).render('error', { 
                title: "Error", 
                errorMessage: "Failed to load completion success page."
            });
        }
    }
};





















