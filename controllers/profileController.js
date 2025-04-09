const MemberProfile = require("../models/profile_models/member_profile");
const LeaderProfile = require("../models/profile_models/leader_profile");
const GroupMemberProfile = require("../models/profile_models/groupmember_profile");
const GroupProfile = require("../models/profile_models/group_profile");
const path = require("path");
const fs = require("fs");
const Member = require("../models/member_models/member"); // ✅ Import Member model
const Leader = require("../models/member_models/leader");
const GroupMember = require("../models/member_models/group_member");
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const PromptSet = require('../models/unit_models/promptset');
const Interview = require('../models/unit_models/interview');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const Badge = require('../models/prompt_models/promptsetcompletion');




const topicMappings = {
    'AI in Consulting': 'aiinconsulting',
    'AI in Project Management': 'aiinprojectmanagement',
    'AI in Adult Learning': 'aiinadultlearning',
    'Project Management': 'projectmanagement',
    'Workplace Culture': 'workplaceculture',
    'The Pareto Principle': 'theparetoprinciple',
    'Career Development in Technical Services': 'careerdevelopmentintechnicalservices',
    'Soft Skills in Technical Environments': 'softskillsintechnicalenvironments',
    'Business Development in Technical Services': 'businessdevelopmentintechnicalservices',
    'Proposal Management': 'proposalmanagement',
    'Proposal Strategy': 'proposalstrategy',
    'Storytelling in Technical Marketing': 'storytellingintechnicalmarketing',
    'Client Experience': 'clientexperience',
    'Social Media, Advertising, and Other Mysteries': 'socialmediaadvertisingandothermysteries',
    'Emotional Intelligence': 'emotionalintelligence',
    'Diversity and Inclusion in Consulting': 'diversityandinclusioninconsulting',
    'People Before Profit': 'peoplebeforeprofit',
    'Non-Technical Roles in Technical Environments': 'nontechnicalrolesintechnicalenvironments',
    'Leadership in Technical Services': 'leadershipintechnicalservices',
    'The Advantage of Failure': 'theadvantageoffailure',
    'Social Entrepreneurship': 'socialentrepreneurship',
    'Employee Experience': 'employeeexperience',
    'Project Management Software': 'projectmanagementsoftware',
    'CRM Platforms': 'crmplatforms',
    'Client Feedback Software': 'clientfeedbacksoftware',
    'Mental Health in Consulting Environments': 'mentalhealthinconsultingenvironments',
    'Remote or Hybrid Work': 'remoteorhybridwork',
    'Four Day Work Week': 'fourdayworkweek',
    'The Power of Play in the Workplace': 'thepowerofplayintheworkplace',
    'Team Building in Technical Consulting': 'teambuildingintechnicalconsulting',
};

const topicViewMappings = {
    'aiinconsulting': 'single_topic_aiconsulting',
    'aiinadultlearning': 'single_topic_ailearn',
    'aiinprojectmanagement': 'single_topic_aiprojectmgmt',
    'businessdevelopmentintechnicalservices': 'single_topic_bd',
    'careerdevelopmentintechnicalservices': 'single_topic_careerdev',
    'clientexperience': 'single_topic_clientex',
    'clientfeedbacksoftware': 'single_topic_clientfeedback',
    'crmplatforms': 'single_topic_crm',
    'diversityandinclusioninconsulting': 'single_topic_diversity',
    'emotionalintelligence': 'single_topic_emotionali',
    'employeeexperience': 'single_topic_employeeex',
    'theadvantageoffailure': 'single_topic_failure',
    'fourdayworkweek': 'single_topic_fourday',
    'leadershipintechnicalservices': 'single_topic_leadership',
    'mentalhealthinconsultingenvironments': 'single_topic_mental',
    'nontechnicalrolesintechnicalenvironments': 'single_topic_nontechnical',
    'theparetoprinciple': 'single_topic_pareto',
    'peoplebeforeprofit': 'single_topic_peoplebefore',
    'thepowerofplayintheworkplace': 'single_topic_play',
    'projectmanagementsoftware': 'single_topic_pmsoftware',
    'projectmanagement': 'single_topic_projectmgmt',
    'proposalmanagement': 'single_topic_proposalmgmt',
    'proposalstrategy': 'single_topic_proposalstrat',
    'remoteorhybridwork': 'single_topic_remote',
    'socialentrepreneurship': 'single_topic_social',
    'socialmediaadvertisingandothermysteries': 'single_topic_socialmedia',
    'softskillsintechnicalenvironments': 'single_topic_softskills',
    'storytellingintechnicalmarketing': 'single_topic_storytelling',
    'teambuildingintechnicalconsulting': 'single_topic_teambuilding',
    'workplaceculture': 'single_topic_workplaceculture'
};

// ✅ Utility: Check Profile Ownership
const checkProfileOwnership = (req, profileOwnerId) => {
    return req.user?.id?.toString() === profileOwnerId?.toString();
};

function getAllTopics() {
    const topicsFilePath = path.join(__dirname, "../public/data/topics.json");
    if (!fs.existsSync(topicsFilePath)) {
        console.error("topics.json file is missing.");
        return [];
    }

    const topicsData = JSON.parse(fs.readFileSync(topicsFilePath, "utf8"));
    return topicsData.topics.map(topic => topic.title);
}

function getSubtopics(topicTitle) {
    const topicsFilePath = path.join(__dirname, "../public/data/topics.json");
    if (!fs.existsSync(topicsFilePath)) {
        console.error("topics.json file is missing.");
        return [];
    }

    const topicsData = JSON.parse(fs.readFileSync(topicsFilePath, "utf8"));
    const topic = topicsData.topics.find(t => t.title === topicTitle);
    return topic ? topic.subtopics : [];
}

async function resolveAuthorById(authorId) {
    let author = await GroupMember.findById(authorId).select('name profileImage') ||
                 await Leader.findById(authorId).select('groupLeaderName profileImage');
    return author ? { name: author.name || author.groupLeaderName, image: author.profileImage } : { name: 'Unknown Author', image: null };
}



// =========================
// ✅ MEMBER PROFILES
// =========================


const viewMemberProfile = async (req, res) => {
    try {
        const profile = await MemberProfile.findOne({ memberId: req.params.id });

        if (!profile) {
            return res.status(404).send("Profile not found.");
        }

        // ✅ Ensure all necessary data (Name, Image, Title, Organization, Biography, Goals)
        const profileData = {
            profileImage: profile.profileImage || "/images/default-avatar.png",
            name: profile.name || "No Name Provided",
            professionalTitle: profile.professionalTitle || "No Title Provided",
            organization: profile.organization || "No Organization Provided",
            biography: profile.biography || "",
            goals: profile.goals || "",
            topics: profile.topics || {}, // ✅ Keeps topic reference intact
            memberId: profile.memberId.toString()
        };

        // ✅ Ensure topics are passed correctly with subtopics fetched from `topics.json`
        const selectedTopics = {
            topic1: profile.topics?.topic1 ? {
                title: profile.topics.topic1,
                subtopics: getSubtopics(profile.topics.topic1) || [],
                slug: topicMappings[profile.topics.topic1] || "unknown-topic",
                viewName: profile.topics?.topic1 && topicMappings[profile.topics.topic1]
                ? topicViewMappings[topicMappings[profile.topics.topic1]]
                : "not_found"
            } : null,
            topic2: profile.topics?.topic2 ? {
                title: profile.topics.topic2,
                subtopics: getSubtopics(profile.topics.topic2) || [],
                slug: topicMappings[profile.topics.topic2] || "unknown-topic",
                viewName: profile.topics?.topic2 && topicMappings[profile.topics.topic2]
                ? topicViewMappings[topicMappings[profile.topics.topic2]]
                : "not_found"
            } : null,
            topic3: profile.topics?.topic3 ? {
                title: profile.topics.topic3,
                subtopics: getSubtopics(profile.topics.topic3) || [],
                slug: topicMappings[profile.topics.topic3] || "unknown-topic",
                viewName: profile.topics?.topic3 && topicMappings[profile.topics.topic3]
                ? topicViewMappings[topicMappings[profile.topics.topic3]]
                : "not_found"
            } : null
        };

        console.log("✅ Member Selected Topics:", selectedTopics);
        console.log("✅ Topic 1 View Name:", selectedTopics.topic1?.viewName);
        console.log("✅ Topic 2 View Name:", selectedTopics.topic2?.viewName);
        console.log("✅ Topic 3 View Name:", selectedTopics.topic3?.viewName);

        // ✅ Fetch Earned Badges for the Member
        const badgeRecords = await Badge.find({ memberId: profile.memberId }).populate("promptSetId").lean();

        // ✅ Format Earned Badges Data
        const memberBadges = await Promise.all(
            badgeRecords.map(async (record) => {
                return {
                    earnedBadge: {
                        image: record.earnedBadge.image || "/images/default-badge.png",
                        name: record.earnedBadge.name || "Unknown Badge"
                    },
                    promptSetTitle: record.promptSetId?.promptset_title || "Unknown Prompt Set",
                    mainTopic: record.promptSetId?.main_topic || "No topic",
                };
            })
        );

        console.log("✅ Member Earned Badges:", JSON.stringify(memberBadges, null, 2));

        // ✅ Ensure ALL data is correctly passed to the Handlebars view
        res.render("profile_views/member_profile", {
            layout: "profilelayout",
            member: {
                ...profileData,   // ✅ Ensure Name, Image, Title, and Organization are passed
                selectedTopics    // ✅ Ensure Topics and Subtopics are passed
            },
            memberBadges // ✅ Passes earned badges
        });

    } catch (error) {
        console.error("❌ Error fetching member profile:", error);
        res.status(500).send("Internal Server Error");
    }
};




const editMemberProfile = async (req, res) => {
    try {
        const profile = await MemberProfile.findOne({ memberId: req.params.id });

        if (!profile || !checkProfileOwnership(req, profile.memberId)) {
            return res.status(403).send("Unauthorized");
        }

        const allTopics = getAllTopics(); // ✅ Get all topics from topics.json
        console.log("✅ Available Topics:", allTopics);

        res.render("profile_views/memberprofileForm", {
            layout: "profilelayout",
            profile: {
                profileImage: profile.profileImage || "/images/default-avatar.png",
                name: profile.name || "No Name Provided",
                professionalTitle: profile.professionalTitle || "No Title Provided",
                organization: profile.organization || "No Organization Provided", // ✅ Ensures organization is pre-populated
                biography: profile.biography || "",
                goals: profile.goals || "",
                topics: profile.topics || {},
                memberId: profile.memberId
            },
            allTopics, // ✅ Pass all topics for dropdowns
            csrfToken: req.csrfToken ? req.csrfToken() : null
        });
    } catch (error) {
        console.error("Error loading member edit form:", error);
        res.status(500).send("Internal Server Error");
    }
};



// ✅ Update Member Profile & Redirect
const updateMemberProfile = async (req, res) => {
    try {
        console.log("🔄 Updating Member Profile...");
        console.log("Request Body:", req.body);

        let updateFields = {
            name: req.body.name,
            professionalTitle: req.body.professionalTitle,
            organization: req.body.organization || "No Organization Provided",
            biography: req.body.biography || "",
            goals: req.body.goals || "",
            topics: {
                topic1: req.body["topics[topic1]"] || req.body.topics?.topic1 || "Default Topic 1",
                topic2: req.body["topics[topic2]"] || req.body.topics?.topic2 || "Default Topic 2",
                topic3: req.body["topics[topic3]"] || req.body.topics?.topic3 || "Default Topic 3"
            },
            profileImage: req.body.profileImage || "/images/default-avatar.png"
        };

        console.log("📝 Fields to Update:", updateFields);

        // ✅ Ensure MemberProfile is updated
        const profile = await MemberProfile.findOneAndUpdate(
            { memberId: req.params.id },
            { $set: updateFields },
            { new: true }
        );

        if (!profile) {
            console.error("❌ Profile not found in `memberprofiles`.");
            return res.status(404).send("Profile not found.");
        }

        // ✅ Ensure Member collection is updated (Fixes `ReferenceError`)
        const memberUpdate = await Member.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { topics: updateFields.topics } },
            { new: true }
        );

        if (!memberUpdate) {
            console.error("❌ Member not found in `members`.");
            return res.status(404).send("Member not found.");
        }

        console.log("✅ Member Profile & Topics Updated Successfully:", profile, memberUpdate);

        return res.redirect(`/profile/member/${req.params.id}`);
    } catch (error) {
        console.error("❌ Error updating member profile & topics:", error);
        res.status(500).render("profile_views/memberprofileForm", {
            layout: "profilelayout",
            profile: req.body,
            errorMessage: "An error occurred while saving your profile. Please try again."
        });
    }
};


// =========================
// ✅ LEADER PROFILES
// =========================



const viewLeaderProfile = async (req, res) => {
    try {
        const profile = await LeaderProfile.findOne({ leaderId: req.params.id });
        const leader = await Leader.findOne({ _id: req.params.id }).populate("members");
        const group = await GroupProfile.findOne({ groupId: req.params.id }).populate("members");

        if (!profile) {
            return res.status(404).send("Profile not found.");
        }

        const profileData = {
            profileImage: profile.profileImage || "/images/default-avatar.png",
            name: profile.name || "No Name Provided",
            professionalTitle: profile.professionalTitle || "No Title Provided",
            biography: profile.biography || "",
            goals: profile.goals || "",
            groupLeadershipGoals: profile.groupLeadershipGoals || "",
            topics: profile.topics || {}, 
            leaderId: profile.leaderId.toString()
        };

        // ✅ Fetch Leader's Library Units (Articles, Videos, etc.)
        const [leaderArticles, leaderVideos, leaderPromptSets, leaderInterviews, leaderExercises, leaderTemplates] = await Promise.all([
            Article.find({ 'author.id': req.params.id }).lean(),
            Video.find({ 'author.id': req.params.id }).lean(),
            PromptSet.find({ 'author.id': req.params.id }).lean(),
            Interview.find({ 'author.id': req.params.id }).lean(),
            Exercise.find({ 'author.id': req.params.id }).lean(),
            Template.find({ 'author.id': req.params.id }).lean(),
        ]);

        const leaderUnits = [
            ...leaderArticles.map((unit) => ({ unitType: 'article', title: unit.article_title, status: unit.status, mainTopic: unit.main_topic, _id: unit._id })),
            ...leaderVideos.map((unit) => ({ unitType: 'video', title: unit.video_title, status: unit.status, mainTopic: unit.main_topic, _id: unit._id })),
            ...leaderPromptSets.map((unit) => ({ unitType: 'promptset', title: unit.promptset_title, status: unit.status, mainTopic: unit.main_topic, _id: unit._id })),
            ...leaderInterviews.map((unit) => ({ unitType: 'interview', title: unit.interview_title, status: unit.status, mainTopic: unit.main_topic, _id: unit._id })),
            ...leaderExercises.map((unit) => ({ unitType: 'exercise', title: unit.exercise_title, status: unit.status, mainTopic: unit.main_topic, _id: unit._id })),
            ...leaderTemplates.map((unit) => ({ unitType: 'template', title: unit.template_title, status: unit.status, mainTopic: unit.main_topic, _id: unit._id })),
        ];

        console.log("✅ Leader Units Found:", JSON.stringify(leaderUnits, null, 2));

        // ✅ Fetch Earned Badges for the Leader
        const badgeRecords = await Badge.find({ memberId: leader._id }).populate("promptSetId").lean();

        // ✅ Format Earned Badges Data
        const leaderBadges = await Promise.all(
            badgeRecords.map(async (record) => {
                return {
                    earnedBadge: {
                        image: record.earnedBadge.image || "/images/default-badge.png",
                        name: record.earnedBadge.name || "Unknown Badge"
                    },
                    promptSetTitle: record.promptSetId?.promptset_title || "Unknown Prompt Set",
                    mainTopic: record.promptSetId?.main_topic || "No topic",
                };
            })
        );

        console.log("✅ Leader Earned Badges:", JSON.stringify(leaderBadges, null, 2));

        // ✅ Ensure topics are passed correctly with subtopics fetched from `topics.json`
        const selectedTopics = {
            topic1: profile.topics?.topic1 ? {
                title: profile.topics.topic1,
                subtopics: getSubtopics(profile.topics.topic1) || [],
                slug: topicMappings[profile.topics.topic1] || "unknown-topic",
                viewName: topicViewMappings[topicMappings[profile.topics.topic1]] || "not_found"
            } : null,
            topic2: profile.topics?.topic2 ? {
                title: profile.topics.topic2,
                subtopics: getSubtopics(profile.topics.topic2) || [],
                slug: topicMappings[profile.topics.topic2] || "unknown-topic",
                viewName: topicViewMappings[topicMappings[profile.topics.topic2]] || "not_found"
            } : null,
            topic3: profile.topics?.topic3 ? {
                title: profile.topics.topic3,
                subtopics: getSubtopics(profile.topics.topic3) || [],
                slug: topicMappings[profile.topics.topic3] || "unknown-topic",
                viewName: topicViewMappings[topicMappings[profile.topics.topic3]] || "not_found"
            } : null
        };

        console.log("✅ Selected Topics for Leader:", JSON.stringify(selectedTopics));

        res.render("profile_views/leader_profile", {
            layout: "profilelayout",
            leader: {
                ...profileData,
                selectedTopics
            },
            leaderUnits, // ✅ Leader's library units are now passed correctly
            leaderBadges, // ✅ Leader's earned badges are now passed correctly
            group: group || {}, 
            groupMembers: leader?.members || [] 
        });

    } catch (error) {
        console.error("❌ Error fetching leader profile:", error);
        res.status(500).send("Internal Server Error");
    }
};



const updateLeaderProfile = async (req, res) => {
    try {
        console.log("🔄 Updating Leader Profile...");
        console.log("Request Body:", req.body);

        let updateFields = {
            name: req.body.name,
            professionalTitle: req.body.professionalTitle,
            biography: req.body.biography || "",
            goals: req.body.goals || "",
            groupLeadershipGoals: req.body.groupLeadershipGoals || "",
            topics: {
                topic1: req.body["topics[topic1]"] || req.body.topics?.topic1 || "Default Topic 1",
                topic2: req.body["topics[topic2]"] || req.body.topics?.topic2 || "Default Topic 2",
                topic3: req.body["topics[topic3]"] || req.body.topics?.topic3 || "Default Topic 3"
            },
            profileImage: req.body.profileImage || "/images/default-avatar.png"
        };

        console.log("📝 Fields to Update:", updateFields);

        // ✅ Ensure LeaderProfile is updated
        const profile = await LeaderProfile.findOneAndUpdate(
            { leaderId: req.params.id },
            { $set: updateFields },
            { new: true }
        );

        if (!profile) {
            console.error("❌ Profile not found in `leaderprofiles`.");
            return res.status(404).send("Profile not found.");
        }

        // ✅ Ensure Leader collection is updated
        const leaderUpdate = await Leader.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { name: updateFields.name, professionalTitle: updateFields.professionalTitle, topics: updateFields.topics } },
            { new: true }
        );

        if (!leaderUpdate) {
            console.error("❌ Leader not found in `leaders`.");
            return res.status(404).send("Leader not found.");
        }

        console.log("✅ Leader Profile & Topics Updated Successfully:", profile, leaderUpdate);

        return res.redirect(`/profile/leader/${req.params.id}`);
    } catch (error) {
        console.error("❌ Error updating leader profile & topics:", error);
        res.status(500).render("profile_views/leaderprofileForm", {
            layout: "profilelayout",
            profile: req.body,
            errorMessage: "An error occurred while saving your profile. Please try again."
        });
    }
};

const editLeaderProfile = async (req, res) => {
    try {
        const profile = await LeaderProfile.findOne({ leaderId: req.params.id });
        const leader = await Leader.findOne({ _id: req.params.id });

        if (!profile || !checkProfileOwnership(req, profile.leaderId)) {
            return res.status(403).send("Unauthorized");
        }

        const allTopics = getAllTopics(); // ✅ Get all topics from topics.json
        console.log("✅ Available Topics:", allTopics);

        res.render("profile_views/leaderprofileForm", {
            layout: "profilelayout",
            profile: {
                profileImage: profile.profileImage || "/images/default-avatar.png",
                name: profile.name || "No Name Provided",
                groupName: leader?.groupName || "No Group Name Provided",
                professionalTitle: profile.professionalTitle || "No Title Provided",
                biography: profile.biography || "",
                goals: profile.goals || "",
                groupLeadershipGoals: profile.groupLeadershipGoals || "", // ✅ Specific to leaders
                topics: profile.topics || {},
                leaderId: profile.leaderId
            },
            allTopics, // ✅ Pass all topics for dropdowns
            csrfToken: req.csrfToken ? req.csrfToken() : null
        });
    } catch (error) {
        console.error("Error loading leader edit form:", error);
        res.status(500).send("Internal Server Error");
    }
};




const viewGroupMemberProfile = async (req, res) => {
    try {
        const profile = await GroupMemberProfile.findOne({ groupMemberId: req.params.id });
        const groupMember = await GroupMember.findOne({ _id: req.params.id });
        const group = await GroupProfile.findOne({ groupId: groupMember?.groupId }).populate("members");
        const leader = await Leader.findOne({ _id: group?.groupId }); // ✅ Fetch the leader's registration record

        if (!profile || !groupMember || !leader) {
            return res.status(404).send("Profile not found.");
        }

        // ✅ Ensure all necessary profile data is included
        const profileData = {
            profileImage: profile.profileImage || "/images/default-avatar.png",
            name: profile.name || "No Name Provided",
            professionalTitle: profile.professionalTitle || "No Title Provided",
            biography: profile.biography || "No biography available.",
            goals: profile.goals || "No goals set.",
            topics: leader.topics || {}, // ✅ Uses topics from the leader
            groupMemberId: profile.groupMemberId.toString()
        };

        // ✅ Ensure topics are passed correctly with subtopics fetched from `topics.json`
        const selectedTopics = {
            topic1: leader.topics?.topic1 ? {
                title: leader.topics.topic1,
                subtopics: getSubtopics(leader.topics.topic1) || [],
                slug: topicMappings[leader.topics.topic1] || "unknown-topic",
                viewName: topicMappings[leader.topics.topic1] 
                    ? topicViewMappings[topicMappings[leader.topics.topic1]] 
                    : "not_found"
            } : null,
            topic2: leader.topics?.topic2 ? {
                title: leader.topics.topic2,
                subtopics: getSubtopics(leader.topics.topic2) || [],
                slug: topicMappings[leader.topics.topic2] || "unknown-topic",
                viewName: topicMappings[leader.topics.topic2] 
                    ? topicViewMappings[topicMappings[leader.topics.topic2]] 
                    : "not_found"
            } : null,
            topic3: leader.topics?.topic3 ? {
                title: leader.topics.topic3,
                subtopics: getSubtopics(leader.topics.topic3) || [],
                slug: topicMappings[leader.topics.topic3] || "unknown-topic",
                viewName: topicMappings[leader.topics.topic3] 
                    ? topicViewMappings[topicMappings[leader.topics.topic3]] 
                    : "not_found"
            } : null
        };

        console.log("✅ Selected Topics Sent to Group Member Profile View:", selectedTopics);
        console.log("✅ Group Member Data Sent to Profile View:", profileData);

        // ✅ Fetch Earned Badges for the Group Member
        const badgeRecords = await Badge.find({ memberId: groupMember._id }).populate("promptSetId").lean();

        // ✅ Format Earned Badges Data
        const memberBadges = await Promise.all(
            badgeRecords.map(async (record) => {
                return {
                    earnedBadge: {
                        image: record.earnedBadge.image || "/images/default-badge.png",
                        name: record.earnedBadge.name || "Unknown Badge"
                    },
                    promptSetTitle: record.promptSetId?.promptset_title || "Unknown Prompt Set",
                    mainTopic: record.promptSetId?.main_topic || "No topic",
                };
            })
        );

        console.log("✅ Group Member Earned Badges:", JSON.stringify(memberBadges, null, 2));

        // ✅ Fetch Completed Prompt Sets for the Group Member
        const completedRecords = await Badge.find({ memberId: groupMember._id }).populate("promptSetId").lean();


        // ✅ Format Completed Prompt Sets Data
        const completedPromptSets = completedRecords.map(record => ({
            promptSetTitle: record.promptSetId?.promptset_title || "Unknown Prompt Set",
            completionDate: record.completedAt ? new Date(record.completedAt).toDateString() : "Unknown Date",
            badgeEarned: record.earnedBadge ? record.earnedBadge.name : "No Badge Earned"
        }));

        console.log("✅ Group Member Completed Prompt Sets:", JSON.stringify(completedPromptSets, null, 2));

        // ✅ Render the group member profile with all necessary data
        res.render("profile_views/groupmember_profile", {
            layout: "profilelayout",
            groupMember: {
                ...profileData,
                selectedTopics
            },
            memberBadges, // ✅ Passes earned badges
            completedPromptSets, // ✅ Passes completed prompt sets
            group: group || {}, // ✅ Ensures group data is passed
            groupMembers: group?.members || [] // ✅ Ensures group members are available
        });

    } catch (error) {
        console.error("❌ Error fetching group member profile:", error);
        res.status(500).send("Internal Server Error");
    }
};





const editGroupMemberProfile = async (req, res) => {
    try {
        const profile = await GroupMemberProfile.findOne({ groupMemberId: req.params.id });
        const groupMember = await GroupMember.findOne({ _id: req.params.id });
        const group = await GroupProfile.findOne({ groupId: groupMember?.groupId }).populate("members");
        const leader = await Leader.findOne({ _id: group?.groupId }); // ✅ Fetch the leader's registration record

        if (!profile || !groupMember || !leader || !checkProfileOwnership(req, profile.groupMemberId)) {
            return res.status(403).send("Unauthorized");
        }

        const allTopics = getAllTopics(); // ✅ Get all topics from topics.json
        console.log("✅ Available Topics:", allTopics);

        // ✅ Extract topics from leader's record
        const groupTopics = leader.topics || {};

        res.render("profile_views/groupmemberprofileForm", {
            layout: "profilelayout",
            profile: {
                profileImage: profile.profileImage || "/images/default-avatar.png",
                name: profile.name || "No Name Provided",
                professionalTitle: profile.professionalTitle || "No Title Provided",
                biography: profile.biography || "",
                goals: profile.goals || "",
                topics: profile.topics || {}, // ✅ Personal topics
                groupMemberId: profile.groupMemberId
            },
            groupTopics, // ✅ Pass the group topics explicitly
            allTopics, // ✅ Pass all available topics for dropdown options
            csrfToken: req.csrfToken ? req.csrfToken() : null
        });
    } catch (error) {
        console.error("Error loading group member edit form:", error);
        res.status(500).send("Internal Server Error");
    }
};




const updateGroupMemberProfile = async (req, res) => {
    try {
        console.log("🔄 Updating Group Member Profile...");
        console.log("Request Body:", req.body);

        let updateFields = {
            name: req.body.name,
            professionalTitle: req.body.professionalTitle,
            biography: req.body.biography || "",
            goals: req.body.goals || "",
            topics: {
                topic1: req.body["topics[topic1]"] || req.body.topics?.topic1 || "Default Topic 1",
                topic2: req.body["topics[topic2]"] || req.body.topics?.topic2 || "Default Topic 2",
                topic3: req.body["topics[topic3]"] || req.body.topics?.topic3 || "Default Topic 3"
            },
            profileImage: req.body.profileImage || "/images/default-avatar.png"
        };

        console.log("📝 Fields to Update:", updateFields);

        // ✅ Ensure GroupMemberProfile is updated
        const profile = await GroupMemberProfile.findOneAndUpdate(
            { groupMemberId: req.params.id },
            { $set: updateFields },
            { new: true }
        );

        if (!profile) {
            console.error("❌ Profile not found in `groupmemberprofiles`.");
            return res.status(404).send("Profile not found.");
        }

        console.log("✅ Group Member Profile Updated Successfully:", profile);

        return res.redirect(`/profile/groupmember/${req.params.id}`);
    } catch (error) {
        console.error("❌ Error updating group member profile:", error);
        res.status(500).render("profile_views/groupmemberprofileForm", {
            layout: "profilelayout",
            profile: req.body,
            errorMessage: "An error occurred while saving your profile. Please try again."
        });
    }
};


// =========================
// ✅ GROUP PROFILES
// =========================


const viewGroupProfile = async (req, res) => {
    try {
        const leader = await Leader.findOne({ _id: req.params.id }).populate("members");
        const groupProfile = await GroupProfile.findOne({ groupId: req.params.id });

        if (!leader || !groupProfile) {
            return res.status(404).send("Group not found.");
        }

        console.log("✅ Leader Data:", JSON.stringify(leader, null, 2));

        const groupData = {
            groupImage: leader.profileImage || "/images/defaultgroupavatar.jpg",
            groupName: leader.groupName || "No Group Name Provided",
            organization: leader.organization || "No Organization Provided",
            biography: groupProfile.biography || "No biography available.",
            goals: groupProfile.groupGoals || "No goals set.",
            topics: leader.topics || {},
            leaderId: leader._id.toString()
        };

        // ✅ Fetch Leader's Name Using `resolveAuthorById`
        const leaderData = await resolveAuthorById(leader._id);
        const groupLeader = {
            _id: leader._id,
            name: leaderData.name || leader.groupLeaderName || "Unknown Leader",
            profileImage: leader.profileImage || "/images/default-avatar.png",
            professionalTitle: leader.professionalTitle || "No Title Provided"
        };

        console.log("✅ Group Leader Data:", JSON.stringify(groupLeader, null, 2));

        // ✅ Restore `selectedTopics` for Group Profile
        const selectedTopics = {
            topic1: leader.topics?.topic1 ? {
                title: leader.topics.topic1,
                subtopics: getSubtopics(leader.topics.topic1) || [],
                slug: topicMappings[leader.topics.topic1] || "unknown-topic",
                viewName: topicMappings[leader.topics.topic1] 
                    ? topicViewMappings[topicMappings[leader.topics.topic1]] 
                    : "not_found"
            } : null,
            topic2: leader.topics?.topic2 ? {
                title: leader.topics.topic2,
                subtopics: getSubtopics(leader.topics.topic2) || [],
                slug: topicMappings[leader.topics.topic2] || "unknown-topic",
                viewName: topicMappings[leader.topics.topic2] 
                    ? topicViewMappings[topicMappings[leader.topics.topic2]] 
                    : "not_found"
            } : null,
            topic3: leader.topics?.topic3 ? {
                title: leader.topics.topic3,
                subtopics: getSubtopics(leader.topics.topic3) || [],
                slug: topicMappings[leader.topics.topic3] || "unknown-topic",
                viewName: topicMappings[leader.topics.topic3] 
                    ? topicViewMappings[topicMappings[leader.topics.topic3]] 
                    : "not_found"
            } : null
        };

        console.log("✅ Selected Topics for Group:", JSON.stringify(selectedTopics, null, 2));

        // ✅ Fetch Leader's Units
        const [leaderArticles, leaderVideos, leaderPromptSets, leaderInterviews, leaderExercises, leaderTemplates] = await Promise.all([
            Article.find({ 'author.id': leader._id }).lean(),
            Video.find({ 'author.id': leader._id }).lean(),
            PromptSet.find({ 'author.id': leader._id }).lean(),
            Interview.find({ 'author.id': leader._id }).lean(),
            Exercise.find({ 'author.id': leader._id }).lean(),
            Template.find({ 'author.id': leader._id }).lean(),
        ]);

        // ✅ Fetch Group Members' Units
        const groupMemberIds = leader.members.map(member => member._id);
        const [memberArticles, memberVideos, memberPromptSets, memberInterviews, memberExercises, memberTemplates] = await Promise.all([
            Article.find({ 'author.id': { $in: groupMemberIds } }).lean(),
            Video.find({ 'author.id': { $in: groupMemberIds } }).lean(),
            PromptSet.find({ 'author.id': { $in: groupMemberIds } }).lean(),
            Interview.find({ 'author.id': { $in: groupMemberIds } }).lean(),
            Exercise.find({ 'author.id': { $in: groupMemberIds } }).lean(),
            Template.find({ 'author.id': { $in: groupMemberIds } }).lean(),
        ]);

        // ✅ Format Units with Author Name
        const formatUnits = async (units, unitType) => {
            return Promise.all(units.map(async (unit) => {
                const authorData = await resolveAuthorById(unit.author?.id);
                return {
                    unitType,
                    title: unit.article_title || unit.video_title || unit.promptset_title || unit.interview_title || unit.exercise_title || unit.template_title,
                    status: unit.status,
                    mainTopic: unit.main_topic,
                    _id: unit._id,
                    author: authorData.name || "Unknown Author"
                };
            }));
        };

        // ✅ Combine & Process Leader & Group Member Units
        const groupLibraryUnits = [
            ...(await formatUnits(leaderArticles, "article")),
            ...(await formatUnits(leaderVideos, "video")),
            ...(await formatUnits(leaderPromptSets, "promptset")),
            ...(await formatUnits(leaderInterviews, "interview")),
            ...(await formatUnits(leaderExercises, "exercise")),
            ...(await formatUnits(leaderTemplates, "template")),
            ...(await formatUnits(memberArticles, "article")),
            ...(await formatUnits(memberVideos, "video")),
            ...(await formatUnits(memberPromptSets, "promptset")),
            ...(await formatUnits(memberInterviews, "interview")),
            ...(await formatUnits(memberExercises, "exercise")),
            ...(await formatUnits(memberTemplates, "template"))
        ];

        console.log("✅ Group Library Units:", JSON.stringify(groupLibraryUnits, null, 2));

        // ✅ Fetch Earned Badges for Leader & Group Members
        const badgeRecords = await Badge.find({ memberId: { $in: [leader._id, ...groupMemberIds] } }).populate("promptSetId").lean();

        // ✅ Format Earned Badges with Member Name & Badge Name
        const groupBadges = await Promise.all(
            badgeRecords.map(async (record) => {
                const memberData = await resolveAuthorById(record.memberId);
                return {
                    earnedBadge: {
                        image: record.earnedBadge.image || "/images/default-badge.png",
                        name: record.earnedBadge.name || "Unknown Badge"
                    },
                    earnedBy: memberData.name || "Unknown Member",
                    promptSetTitle: record.promptSetId?.promptset_title || "Unknown Prompt Set",
                    mainTopic: record.promptSetId?.main_topic || "No topic",
                    purpose: record.promptSetId?.purpose || "No purpose provided"
                };
            })
        );

        console.log("✅ Group Earned Badges:", JSON.stringify(groupBadges, null, 2));

        res.render("profile_views/group_profile", {
            layout: "profilelayout",
            group: {
                ...groupData,
                selectedTopics // ✅ Topics are now restored
            },
            groupLeader, // ✅ Leader's data restored
            groupLibraryUnits, // ✅ Library units restored
            groupBadges, // ✅ Earned badges restored
            isGroupLeader: req.user && req.user.id === leader._id.toString(),
            groupMembers: leader.members || []
        });

    } catch (error) {
        console.error("❌ Error fetching group profile:", error);
        res.status(500).send("Internal Server Error");
    }
};











const editGroupProfile = async (req, res) => {
    try {
        const leader = await Leader.findOne({ _id: req.params.id });

        if (!leader || req.user.id !== leader._id.toString()) {
            return res.status(403).send("Unauthorized");
        }

        const allTopics = getAllTopics(); // ✅ Get all topics from topics.json
        console.log("✅ Available Topics:", allTopics);

        res.render("profile_views/groupprofileForm", {
            layout: "profilelayout",
            profile: {
                profileImage: leader.profileImage || "/images/defaultgroupavatar.jpg",
                groupName: leader.groupName || "No Group Name Provided",
                organization: leader.organization || "No Organization Provided",
                biography: leader.biography || "No biography available.",
                goals: leader.goals || "No goals set.",
                topics: leader.topics || {}, // ✅ Uses topics from the leader
                leaderId: leader._id.toString()
            },
            allTopics, // ✅ Pass all topics for dropdowns
            csrfToken: req.csrfToken ? req.csrfToken() : null
        });
    } catch (error) {
        console.error("Error loading group edit form:", error);
        res.status(500).send("Internal Server Error");
    }
};


const updateGroupProfile = async (req, res) => {
    try {
        console.log("🔄 Updating Group Profile...");
        console.log("Request Body:", req.body);

        let updateFields = {
            groupName: req.body.groupName,
            organization: req.body.organization || "No Organization Provided",
            biography: req.body.biography || "No biography available.",
            goals: req.body.goals || "No goals set.",
            topics: {
                topic1: req.body["topics[topic1]"] || req.body.topics?.topic1 || "Default Topic 1",
                topic2: req.body["topics[topic2]"] || req.body.topics?.topic2 || "Default Topic 2",
                topic3: req.body["topics[topic3]"] || req.body.topics?.topic3 || "Default Topic 3"
            },
            profileImage: req.body.profileImage || "/images/defaultgroupavatar.jpg"
        };

        console.log("📝 Fields to Update:", updateFields);

        // ✅ Ensure Leader (Group) is updated
        const leaderUpdate = await Leader.findOneAndUpdate(
            { _id: req.params.id },
            { $set: updateFields },
            { new: true }
        );

        if (!leaderUpdate) {
            console.error("❌ Group not found in `leaders`.");
            return res.status(404).send("Group not found.");
        }

        // ✅ Ensure GroupProfile is updated
        const groupProfileUpdate = await GroupProfile.findOneAndUpdate(
            { groupId: req.params.id },
            { 
                $set: {
                    groupName: updateFields.groupName,
                    organization: updateFields.organization,
                    biography: updateFields.biography,
                    groupGoals: updateFields.goals,
                    groupTopics: updateFields.topics,
                    groupImage: updateFields.profileImage
                }
            },
            { new: true }
        );

        if (!groupProfileUpdate) {
            console.error("❌ Group profile not found in `groupprofiles`.");
            return res.status(404).send("Group profile not found.");
        }

        console.log("✅ Group Profile & GroupProfile Updated Successfully:", leaderUpdate, groupProfileUpdate);
        console.log("🔍 Incoming Request Body:", req.body);

        return res.redirect(`/profile/group/${req.params.id}`);
    } catch (error) {
        console.error("❌ Error updating group profile:", error);
        res.status(500).render("profile_views/groupprofileForm", {
            layout: "profilelayout",
            profile: req.body,
            errorMessage: "An error occurred while saving your group profile. Please try again."
        });
    }
};




// =========================
// ✅ EXPORT ALL FUNCTIONS
// =========================

module.exports = {
    viewMemberProfile,
    viewLeaderProfile,
    viewGroupMemberProfile,
    viewGroupProfile,
    editMemberProfile,
    updateMemberProfile,
    editLeaderProfile,
    updateLeaderProfile,
    editGroupMemberProfile,
    updateGroupMemberProfile,
    editGroupProfile,
    updateGroupProfile
};






















