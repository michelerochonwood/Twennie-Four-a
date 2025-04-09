const ensureAuthenticated = (req, res, next) => {
    console.log('🔍 Middleware: Checking Authentication');
    console.log('   Session:', req.session);
    console.log('   req.isAuthenticated():', req.isAuthenticated());
    console.log('   req.user:', req.user);

    // ✅ If user is authenticated and user data is present, allow access
    if (req.isAuthenticated() && req.user && req.user._id) {
        console.log('✅ Authenticated user:', {
            id: req.user._id,
            membershipType: req.user.membershipType || 'Unknown Type',
        });

        // ✅ Restore `req.user` if it is missing from request but exists in session
        if (!req.user && req.session.passport && req.session.passport.user) {
            console.warn("⚠️ Restoring user from session...");
            req.user = req.session.passport.user;
        }

        // ✅ Fix session loss by ensuring `req.session.user` persists
        if (!req.session.user) {
            console.warn("⚠️ Session user data is missing, restoring session...");
            req.session.regenerate((err) => {
                if (err) {
                    console.error("❌ Session regeneration error:", err);
                    return res.redirect('/auth/login');
                }
                req.session.user = { 
                    id: req.user._id, 
                    username: req.user.username, 
                    membershipType: req.user.membershipType 
                };
                req.session.save((saveErr) => {
                    if (saveErr) {
                        console.error("❌ Session save error:", saveErr);
                        return res.redirect('/auth/login');
                    }
                    console.log("✅ Session successfully restored.");
                    return next();
                });
            });
        } else {
            return next(); // ✅ Proceed if session is already valid
        }
    }

    // 🚨 Authentication failed, log reason and redirect
    if (!req.isAuthenticated()) {
        console.warn('🚨 Access Denied: User Not Authenticated.');
    } else if (!req.user || !req.user._id) {
        console.error('🚨 Access Denied: User is authenticated but missing required user ID.');
    }

    res.redirect('/auth/login'); // 🚨 Redirect to login if authentication fails
};

module.exports = ensureAuthenticated;





