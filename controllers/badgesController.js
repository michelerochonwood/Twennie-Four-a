const connectDB = require('../utils/db');




exports.showBadgesView = (req, res) => {
  
  // Render the badges view using the custom layout.
  res.render('badges_view', { layout: 'badgeslayout' });
};

exports.pickBadge = (req, res) => {
  const { badgePath, badgeName } = req.body;

  if (!badgePath || !badgeName) {
    return res.status(400).json({ error: 'Badge path and badge name are required.' });
  }

  // Store the chosen badge data in the session.
  req.session.selectedBadge = { image: badgePath, name: badgeName };

  // Respond with success.
  res.json({ success: true, selectedBadge: req.session.selectedBadge });
};

  
  
  