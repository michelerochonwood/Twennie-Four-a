const express = require('express');
const router = express.Router();

// Define routes
router.get('/', (req, res) => {
    res.render('promo_views/main_home_page', {
        layout: 'mainlayout'
    });
});

router.get('/avail_memberships', (req, res) => {
    res.render('promo_views/avail_memberships', {
        layout: 'mainlayout'
    });
});

router.get('/topics', (req, res) => {
    res.render('promo_views/topics', {
        layout: 'mainlayout'
    });
});

router.get('/contributor_units', (req, res) => {
    res.render('promo_views/contributor_units', {
        layout: 'mainlayout'
    });
});

router.get('/member_access', (req, res) => {
    res.render('promo_views/member_access', {
        layout: 'mainlayout'
    });
});

router.get('/sample_articles', (req, res) => {
    res.render('promo_views/sample_articles', {
        layout: 'mainlayout'
    });
});

router.get('/sample_exercises', (req, res) => {
    res.render('promo_views/sample_exercises', {
        layout: 'mainlayout'
    });
});

router.get('/sample_interview', (req, res) => {
    res.render('promo_views/sample_interview', {
        layout: 'mainlayout'
    });
});

router.get('/sample_microcourse', (req, res) => {
    res.render('promo_views/sample_microcourse', {
        layout: 'mainlayout'
    });
});

router.get('/sample_microstudy', (req, res) => {
    res.render('promo_views/sample_microstudy', {
        layout: 'mainlayout'
    });
});

router.get('/sample_peercoach', (req, res) => {
    res.render('promo_views/sample_peercoach', {
        layout: 'mainlayout'
    });
});

router.get('/sample_promptset', (req, res) => {
    res.render('promo_views/sample_promptset', {
        layout: 'mainlayout'
    });
});

router.get('/sample_templates', (req, res) => {
    res.render('promo_views/sample_templates', {
        layout: 'mainlayout'
    });
});

router.get('/sample_video', (req, res) => {
    res.render('promo_views/sample_video', {
        layout: 'mainlayout'
    });
});

router.get('/what_is_twennie', (req, res) => {
    res.render('promo_views/whatistwennie_view', {
        layout: 'mainlayout'
    });
});

router.get('/about_twennie', (req, res) => {
    res.render('promo_views/about_twennie', {
        layout: 'mainlayout'
    });
});

router.get('/contribute', (req, res) => {
    res.render('promo_views/contribute', {
        layout: 'mainlayout'
    });
});

router.get('/microstudies', (req, res) => {
    res.render('promo_views/microstudies', {
        layout: 'mainlayout'
    });
});

router.get('/microcourses', (req, res) => {
    res.render('promo_views/microcourses', {
        layout: 'mainlayout'
    });
});

router.get('/peercoaching', (req, res) => {
    res.render('promo_views/peercoaching', {
        layout: 'mainlayout'
    });
});

router.get('/privacypolicy', (req, res) => {
    res.render('promo_views/privacypolicy', {
        layout: 'mainlayout'
    });
});

router.get('/termsconditions', (req, res) => {
    res.render('promo_views/termsconditions', {
        layout: 'mainlayout'
    });
});

router.get('/facilitation', (req, res) => {
    res.render('promo_views/facilitation', {
        layout: 'mainlayout'
    });
});


// Export the router
module.exports = router;
