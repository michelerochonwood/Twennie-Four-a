const Member = require('../models/member_models/member');
const { validateMemberData } = require('../utils/validateMember');
const MemberProfile = require('../models/profile_models/member_profile'); // Import MemberProfile
const bcrypt = require('bcrypt');


module.exports = {
    showMemberForm: (req, res) => {
        res.render('member_form_views/member_form', {
            layout: 'memberformlayout',
            title: 'Individual Membership Form',
        });
    },

    createMember: async (req, res) => {
        try {
            const { name, professionalTitle, organization, industry, username, email, password, topic1, topic2, topic3 } = req.body;
    
            console.log('Received registration data:', { name, username, email });
    
            const errors = validateMemberData(req.body);
            if (errors.length > 0) {
                console.warn('Validation errors:', errors);
                return res.status(400).render('member_form_views/member_form', {
                    layout: 'memberformlayout',
                    title: 'Individual Membership Form',
                    errors,
                    data: req.body,
                });
            }
    
            // ✅ Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const newMember = new Member({
                name,
                professionalTitle,
                organization,
                industry,
                username,
                email,
                password: hashedPassword,
                topics: { topic1, topic2, topic3 },
                accessLevel: 'free_individual', // default, or get from form logic
                membershipType: 'member',
            });
            
            await newMember.save();
            console.log('✅ Member saved successfully:', newMember);
            
            const memberProfile = new MemberProfile({
                memberId: newMember._id,
                name: newMember.name,
                professionalTitle: newMember.professionalTitle,
                profileImage: "/images/default-avatar.png",
                biography: "",
                goals: "",
                topics: {
                    topic1: topic1 || "Default Topic 1",
                    topic2: topic2 || "Default Topic 2",
                    topic3: topic3 || "Default Topic 3"
                }
            });
            
            await memberProfile.save();
            console.log(`✅ Member Profile Created: ${memberProfile._id}`);
    
            req.session.user = {
                id: newMember._id,
                username: newMember.username,
                membershipType: newMember.membershipType,
            };
    
            res.render("member_form_views/register_success", {
                layout: "memberformlayout",
                title: "Registration Successful",
                username: newMember.username,
                user: newMember,
                dashboardLink: "/dashboard/member"
            });
        } catch (err) {
            console.error('Error creating member:', err);
            res.status(500).render('member_form_views/error', {
                layout: 'memberformlayout',
                title: 'Registration Error',
                errorMessage: 'An error occurred while creating the member. Please try again.',
            });
        }
    }
};
