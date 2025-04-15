const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const { validateLeaderData } = require('../utils/validateLeader');
const { validateGroupMemberData } = require('../utils/validateGroupMember');
const LeaderProfile = require('../models/profile_models/leader_profile');

const GroupProfile = require('../models/profile_models/group_profile');
const bcrypt = require('bcrypt');





module.exports = {
    // Render the leader form
    showLeaderForm: (req, res) => {
        
        try {
            const csrfToken = req.csrfToken ? req.csrfToken() : null;
            res.render('member_form_views/form_leader', {
                layout: 'memberformlayout',
                title: 'Leader Membership Form',
                csrfToken,
            });
        } catch (err) {
            console.error('Error rendering leader form:', err.message);
            res.status(500).render('member_form_views/error', {
                layout: 'mainlayout',
                title: 'Error',
                errorMessage: 'An error occurred while loading the leader form.',
            });
        }
    },

    // Handle leader form submission
    createLeader: async (req, res) => {

        try {
            const {
                groupName,
                groupLeaderName,
                professionalTitle,
                organization,
                username,
                groupLeaderEmail,
                password,
                groupSize,
                topic1,
                topic2,
                topic3,
                members,
                registration_code,
            } = req.body;

            console.log('Parsed members:', members);

            // Validate leader data
            const leaderErrors = validateLeaderData(req.body);
            if (leaderErrors.length > 0) {
                console.error('Leader validation errors:', leaderErrors);
                return res.status(400).render('member_form_views/form_leader', {
                    layout: 'memberformlayout',
                    title: 'Leader Membership Form',
                    csrfToken: req.csrfToken ? req.csrfToken() : null,
                    errorMessage: leaderErrors.join(" "),
                });
            }

            // Create the leader document
            const hashedPassword = await bcrypt.hash(password, 10);

            const leader = new Leader({
                groupName,
                groupLeaderName,
                professionalTitle,
                organization,
                username,
                groupLeaderEmail,
                password: hashedPassword, // ✅ hashed password
                groupSize,
                topics: { topic1, topic2, topic3 },
                members: [],
                registration_code,
            });
            
            const savedLeader = await leader.save();
            console.log('✅ Leader saved successfully:', savedLeader);
            
            // ✅ Automatically create a profile for the leader
            const leaderProfile = new LeaderProfile({
                leaderId: savedLeader._id,
                name: savedLeader.groupLeaderName,
                professionalTitle: savedLeader.professionalTitle,
                profileImage: "/images/default-avatar.png",
                biography: "",
                goals: "",
                groupLeadershipGoals: "",
                topics: {
                    topic1: topic1 || "Default Topic 1",
                    topic2: topic2 || "Default Topic 2",
                    topic3: topic3 || "Default Topic 3"
                }
            });
            
            await leaderProfile.save();
            console.log(`✅ Leader Profile Created: ${leaderProfile._id}`);
            
            // ✅ Automatically create a profile for the group
            const groupProfile = new GroupProfile({
                groupId: savedLeader._id, // Link to the Leader document
                groupName: savedLeader.groupName,
                groupLeaderName: savedLeader.groupLeaderName,
                organization: savedLeader.organization,
                groupSize: savedLeader.groupSize,
                groupGoals: "",
                groupTopics: {
                    topic1: topic1 || "Default Topic 1",
                    topic2: topic2 || "Default Topic 2",
                    topic3: topic3 || "Default Topic 3"
                },
                members: [], // Initially empty
                groupImage: "/images/default-group.png"
            });
            
            await groupProfile.save();
            console.log(`✅ Group Profile Created: ${groupProfile._id}`);

            // Validate each group member
            const memberErrors = [];
            members.forEach((member, index) => {
                const errors = validateGroupMemberData({
                    groupId: savedLeader._id.toString(),
                    groupName,
                    ...member,
                    username: `member_${index}_${groupName.toLowerCase().replace(/\s+/g, '_')}`,
                    password: 'defaultPassword123', // Default password for debugging
                    topics: { topic1, topic2, topic3 },
                });
                if (errors.length > 0) {
                    memberErrors.push(`Member ${index + 1}: ${errors.join(", ")}`);
                }
            });

            if (memberErrors.length > 0) {
                console.error('Group member validation errors:', memberErrors);
                return res.status(400).render('member_form_views/form_leader', {
                    layout: 'memberformlayout',
                    title: 'Leader Membership Form',
                    csrfToken: req.csrfToken ? req.csrfToken() : null,
                    errorMessage: memberErrors.join(" "),
                });
            }

            console.log('Validation passed. Proceeding to save members.');

            // Create group member documents and update members field
            const groupMemberPromises = members.map(async (member, index) => {
                const groupMember = new GroupMember({
                    groupId: savedLeader._id,
                    groupName,
                    name: member.name,
                    email: member.email,
                    username: `member_${index}_${groupName.toLowerCase().replace(/\s+/g, '_')}`,
                    password: await bcrypt.hash('defaultPassword123', 10), // ✅ hashed default
                    topics: { topic1, topic2, topic3 },
                });

                const savedMember = await groupMember.save();
                savedLeader.members.push(savedMember._id); // Add member ID to leader's members array
                return savedMember;
            });

            await Promise.all(groupMemberPromises);
            await savedLeader.save();
            console.log('All group members saved successfully.');

            // Set session for the new leader
            req.session.user = {
                id: savedLeader._id,
                username: savedLeader.username,
                membershipType: savedLeader.membershipType,
            };

            // Redirect to success page
            res.render('member_form_views/register_success', {
                layout: 'memberformlayout',
                title: 'Registration Successful',
                username: savedLeader.username,
                user: savedLeader,
                dashboardLink: "/dashboard/leader"
            });
        } catch (err) {
            console.error('Error creating leader or group members:', err.message);
            res.status(500).render('member_form_views/error', {
                layout: 'mainlayout',
                title: 'Error',
                errorMessage: 'An error occurred while creating the leader or group members.',
            });
        }
    },

    // Render the add group member form
    showAddGroupMemberForm: async (req, res) => {

        console.log('Rendering view: member_form_views/add_group_member');
        console.log(`showAddGroupMemberForm called with leaderId: ${req.params.leaderId}`);
        try {
            const { leaderId } = req.params;
    
            console.log(`Fetching leader with ID: ${leaderId}`);
    
            const leader = await Leader.findById(leaderId).lean();
    
            if (!leader) {
                return res.status(404).render('member_form_views/error', {
                    layout: 'mainlayout',
                    title: 'Leader Not Found',
                    errorMessage: 'The specified leader does not exist.',
                });
            }
    
            console.log('Leader fetched for add group member form:', leader);
    
            res.render('member_form_views/add_group_member', {
                layout: 'memberformlayout',
                title: 'Add Group Member',
                leader,
                csrfToken: req.csrfToken ? req.csrfToken() : null,
            });
        } catch (err) {
            console.error('Error rendering add group member form:', err.message);
            res.status(500).render('member_form_views/error', {
                layout: 'mainlayout',
                title: 'Error',
                errorMessage: 'An unexpected error occurred while loading the group member form.',
            });
        }
    },
    
    
    

    // Handle submission of the add group member form
    addGroupMember: async (req, res) => {

        try {
            const { leaderId } = req.params;
            const { name, email } = req.body;
    
            const leader = await Leader.findById(leaderId);
    
            if (!leader) {
                return res.status(404).render('member_form_views/error', {
                    layout: 'mainlayout',
                    title: 'Leader Not Found',
                    errorMessage: 'The specified leader does not exist.',
                });
            }
    
            const groupMember = new GroupMember({
                groupId: leader._id,
                groupName: leader.groupName,
                name,
                email,
                username: `member_${leader.members.length}_${leader.groupName.toLowerCase().replace(/\s+/g, '_')}`,
                password: 'defaultPassword123',
                topics: leader.topics,
            });
    
            const savedMember = await groupMember.save();
            leader.members.push(savedMember._id);
            await leader.save();
    
            // Redirect to the dashboard
            res.redirect('/dashboard');
        } catch (err) {
            console.error('Error adding group member:', err.message);
            res.status(500).render('member_form_views/error', {
                layout: 'mainlayout',
                title: 'Error',
                errorMessage: 'An error occurred while adding the group member.',
            });
        }
    },
    

    // Function to update members for existing leaders
    updateMembers: async () => {

        try {
            const leaders = await Leader.find();
            for (const leader of leaders) {
                const groupMembers = await GroupMember.find({ groupId: leader._id });
                leader.members = groupMembers.map((member) => member._id);
                await leader.save();
                console.log(`Updated members for leader: ${leader.groupName}`);
            }
            console.log('Update complete!');
        } catch (err) {
            console.error('Error updating members:', err.message);
        }
    },
};

