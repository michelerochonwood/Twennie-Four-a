const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Helper function to check if a view exists
const viewExists = (viewPath) => {
    const fullPath = path.join(process.cwd(), 'views', `${viewPath}.hbs`);
    console.log(`[viewExists] Resolved path: ${fullPath}`);
    return fs.existsSync(fullPath);
};

// Dynamic route for single topics
router.get('/single_topic_:topicName', (req, res) => {
    const topicName = req.params.topicName; // Extract topic name from URL
    const viewPath = `topic_views/single_topic_${topicName}`; // Construct view path

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
