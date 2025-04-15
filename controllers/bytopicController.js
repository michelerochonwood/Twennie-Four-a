const fs = require('fs');
const path = require('path');
const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview');
const Promptset = require('../models/unit_models/promptset');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member');




async function resolveAuthorById(authorId) {
    try {
        let author = await Leader.findById(authorId).select('groupLeaderName profileImage');
        if (author) return { name: author.groupLeaderName, image: author.profileImage };

        author = await GroupMember.findById(authorId).select('name profileImage');
        if (author) return { name: author.name, image: author.profileImage };

        author = await Member.findById(authorId).select('username profileImage');
        if (author) return { name: author.username, image: author.profileImage };
    } catch (error) {
        console.error('Error resolving author:', error);
    }
    return { name: 'Unknown Author', image: '/images/default-avatar.png' };
}

exports.getTopicView = async (req, res) => {

    const normalizedTopic = req.params.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const topicsFilePath = path.join(__dirname, '../public/data/topics.json');

    try {
        if (!fs.existsSync(topicsFilePath)) {
            console.error('Topics file is missing.');
            return res.status(404).send('Topics file is missing.');
        }

        const topicsData = JSON.parse(fs.readFileSync(topicsFilePath, 'utf8'));
        if (!Array.isArray(topicsData.topics)) {
            throw new Error('Invalid topics.json format: "topics" should be an array.');
        }

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

        const originalTopicTitle = Object.keys(topicMappings).find(
            (title) => topicMappings[title] === normalizedTopic
        );

        if (!originalTopicTitle) {
            console.error(`Topic not found for normalized title: ${normalizedTopic}`);
            return res.status(404).send('Topic not found.');
        }

        console.log(`Resolved Topic Title: ${originalTopicTitle}`);

        const topic = topicsData.topics.find((t) => t.title === originalTopicTitle);
        if (!topic) {
            console.error(`Topic data missing for title: ${originalTopicTitle}`);
            return res.status(404).send('Topic data not found.');
        }

        // Search for units where the topic is in main_topic or secondary_topics
        const queryCondition = { 
            $or: [
                { main_topic: topic.title }, 
                { secondary_topics: topic.title }  // Replaced sub_topics with secondary_topics
            ]
        };
        console.log(`Query Condition:`, JSON.stringify(queryCondition, null, 2));

        const [articles, videos, interviews, promptsets, exercises, templates] = await Promise.all([
            Article.find(queryCondition).lean(),
            Video.find(queryCondition).lean(),
            Interview.find(queryCondition).lean(),
            Promptset.find(queryCondition).lean(),
            Exercise.find(queryCondition).lean(),
            Template.find(queryCondition).lean(),
        ]);

        console.log(`Found Articles: ${articles.length}`);
        console.log(`Found Videos: ${videos.length}`);
        console.log(`Found Interviews: ${interviews.length}`);
        console.log(`Found Promptsets: ${promptsets.length}`);
        console.log(`Found Exercises: ${exercises.length}`);
        console.log(`Found Templates: ${templates.length}`);

        const allUnits = [
            ...articles.map((unit) => ({ title: unit.article_title, ...unit, type: 'article' })),
            ...videos.map((unit) => ({ title: unit.video_title, ...unit, type: 'video' })),
            ...interviews.map((unit) => ({ title: unit.interview_title, ...unit, type: 'interview' })),
            ...promptsets.map((unit) => ({
                title: unit.promptset_title,
                ...unit,
                type: 'promptset',
                targetAudience: unit.target_audience,
                characteristics: unit.characteristics,
                purpose: unit.purpose,
                suggestedFrequency: unit.suggested_frequency,
            })),
            ...exercises.map((unit) => ({ title: unit.exercise_title, ...unit, type: 'exercise' })),
            ...templates.map((unit) => ({ title: unit.template_title, ...unit, type: 'template' })),
        ];

        console.log(`Total Processed Units: ${allUnits.length}`);

        const libraryUnits = await Promise.all(
            allUnits.map(async (unit) => {
                const author = unit.author?.id
                    ? await resolveAuthorById(unit.author.id)
                    : { name: 'Unknown Author', image: '/images/default-avatar.png' };
                return {
                    ...unit,
                    authorName: author.name,
                    authorImage: author.image || '/images/default-avatar.png',
                };
            })
        );

        res.render('bytopic_views/bytopic_view', {
            layout: 'bytopiclayout',
            title: topic.title,
            shortSummary: topic.shortSummary,
            longSummary: topic.longSummary,
            libraryUnits: libraryUnits || [],
        });
    } catch (error) {
        console.error('Error loading topic or units:', error);
        return res.status(500).send('An internal error occurred.');
    }
};




















