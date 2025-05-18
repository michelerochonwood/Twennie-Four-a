const express = require('express');
const router = express.Router();
const bytopicController = require('../../controllers/bytopicController');

// 🔹 Define static routes BEFORE the dynamic topic route
router.get('/suggest-new-topic', bytopicController.showTopicSuggestionForm);
router.post('/submit-topic-suggestion', bytopicController.submitTopicSuggestion);

// 🔹 Dynamic route for viewing topic pages
router.get('/:id', bytopicController.getTopicView);

module.exports = router;
