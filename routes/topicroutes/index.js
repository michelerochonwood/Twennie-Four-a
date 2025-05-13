const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const bytopicController = require('../../controllers/bytopicController'); // Assuming it's in the controllers folder
const { ensureAuthenticated } = require('../middleware/auth'); // If using login protection

// Helper function to check if a view exists
const viewExists = (viewPath) => {
    const fullPath = path.join(process.cwd(), 'views', `${viewPath}.hbs`);
    console.log(`[viewExists] Resolved path: ${fullPath}`);
    return fs.existsSync(fullPath);
};

// GET: Show the topic suggestion form
router.get('/topics/suggest', ensureAuthenticated, bytopicController.showTopicSuggestionForm);

// POST: Submit the topic suggestion
router.post('/topics/suggest', ensureAuthenticated, bytopicController.submitTopicSuggestion);

// Dynamic route for single topics
router.get('/single_topic_:topicName', (req, res) => {
    const topicName = req.params.topicName;
    const viewPath = `topic_views/single_topic_${topicName}`;

    console.log(`Attempting to render: ${viewPath}`);
    if (viewExists(viewPath)) {
        console.log(`[viewExists] File exists: ${viewPath}`);
        res.render(viewPath, { layout: 'mainlayout' });
    } else {
        console.error(`[viewExists] File not found: ${viewPath}`);
        res.status(404).send('View template not found');
    }
});

module.exports = router;

