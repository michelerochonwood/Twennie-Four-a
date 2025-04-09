const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview');
const PromptSet = require('../models/unit_models/promptset');
const Exercise = require('../models/unit_models/exercise');
const Template = require('../models/unit_models/template');
const Leader = require('../models/member_models/leader');
const GroupMember = require('../models/member_models/group_member');
const Member = require('../models/member_models/member');
const moment = require('moment');

// Function to get the correct icon for unit type
function getUnitTypeIcon(type) {
    const icons = {
        article: '/icons/article.svg',
        video: '/icons/video.svg',
        interview: '/icons/interview.svg',
        promptset: '/icons/promptset.svg',
        exercise: '/icons/exercise.svg',
        template: '/icons/template.svg'
    };
    return icons[type] || '/icons/default-icon.svg';
}

// Helper function to resolve author details
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

exports.getLatestLibraryItems = async (req, res) => {
    try {
        // Fetch all six library unit types, sorted by updated_at (most recent first)
        const articles = await Article.find().sort({ updated_at: -1 }).lean();
        const interviews = await Interview.find().sort({ updated_at: -1 }).lean();
        const videos = await Video.find().sort({ updated_at: -1 }).lean();
        const exercises = await Exercise.find().sort({ updated_at: -1 }).lean();
        const promptSets = await PromptSet.find().sort({ updated_at: -1 }).lean();
        const templates = await Template.find().sort({ updated_at: -1 }).lean();

        // Merge all results into one array
        let allLibraryUnits = [
            ...articles.map((unit) => ({ title: unit.article_title, ...unit, type: 'article' })),
            ...videos.map((unit) => ({ title: unit.video_title, ...unit, type: 'video' })),
            ...interviews.map((unit) => ({ title: unit.interview_title, ...unit, type: 'interview' })),
            ...promptSets.map((unit) => ({
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

        // Sort all units by `updated_at` (most recent first)
        allLibraryUnits.sort((a, b) => b.updated_at - a.updated_at);

        // Categorize items into time-based sections
        const todayItems = [];
        const thisWeekItems = [];
        const lastMonthItems = [];
        const olderItems = [];

        const today = moment().startOf('day');
        const oneWeekAgo = moment().subtract(7, 'days').startOf('day');
        const oneMonthAgo = moment().subtract(1, 'month').startOf('day');

        // Process each unit and categorize based on updated_at
        const libraryUnits = await Promise.all(
            allLibraryUnits.map(async (unit) => {
                const updatedDate = moment(unit.updated_at);
                const author = unit.author?.id
                    ? await resolveAuthorById(unit.author.id)
                    : { name: 'Unknown Author', image: '/images/default-avatar.png' };

                // Enrich the unit with author data and icon path
                const enrichedUnit = {
                    ...unit,
                    authorName: author.name,
                    authorImage: author.image || '/images/default-avatar.png',
                    unitTypeIcon: getUnitTypeIcon(unit.type) // Corrected function call
                };

                // Categorize by date range
                if (updatedDate.isSameOrAfter(today)) {
                    todayItems.push(enrichedUnit);
                } else if (updatedDate.isSameOrAfter(oneWeekAgo)) {
                    thisWeekItems.push(enrichedUnit);
                } else if (updatedDate.isSameOrAfter(oneMonthAgo)) {
                    lastMonthItems.push(enrichedUnit);
                } else {
                    olderItems.push(enrichedUnit);
                }

                return enrichedUnit;
            })
        );

        // Render the latest view with categorized data
        res.render('latest_view/latest_view', {
            layout: 'bytopiclayout',
            todayItems,
            thisWeekItems,
            lastMonthItems,
            olderItems,
        });

    } catch (error) {
        console.error('Error fetching latest library items:', error);
        res.status(500).send('Server Error');
    }
};



