const express = require('express');
const path = require('path');
const { create } = require('express-handlebars');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csrf = require('csrf');
const multer = require('multer');
const fs = require('fs');
const moment = require('moment');
const passport = require('passport'); // Imported once, globally
const MongoStore = require('connect-mongo');

// Importing CORs.
const cors = require('cors');

dotenv.config();

// Handlebars setup
const hbs = create({
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: 'mainlayout',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
    helpers: { // Correctly defined helpers property
        replace: (string, find, replace) => {
            if (typeof string !== 'string') return '';
            return string.split(find).join(replace);
        },
        formatContent: (content) => {
            return content ? content.replace(/\n/g, '<br>') : '';
        },
        ifEquals: (a, b, options) => {
            return a === b ? options.fn(this) : options.inverse(this);
        },
        toLowerCase: (str) => {
            return typeof str === 'string' ? str.toLowerCase() : '';
        },
        formatDate: (date) => {
            return date ? moment(date).format('MMMM D, YYYY') : '';
        },
        eq: (v1, v2) => v1 === v2,
        ne: (v1, v2) => v1 !== v2,
        and: (v1, v2) => v1 && v2,
        or: (v1, v2) => v1 || v2,
        includes: (array, value) => Array.isArray(array) && array.includes(value),
        ifIncludes: (array, value, options) => {
            if (Array.isArray(array) && array.includes(value)) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        range: (start, end) => {
            const result = [];
            for (let i = start; i < end; i++) {
                result.push(i);
            }
            return result;
        },
        concat: (str1, str2) => `${str1}${str2}`,
        lt: (a, b) => a < b,
        getUnitTypeIcon: (unitType) => {
            const icons = {
                article: '/icons/article.svg',
                video: '/icons/video.svg',
                interview: '/icons/interview.svg',
                promptset: '/icons/promptset.svg',
                exercise: '/icons/exercise.svg',
                template: '/icons/template.svg',
            };
            return icons[unitType] || '/icons/default.svg'; // Default icon if no match
        },
        capitalize: (str) => {
            if (typeof str !== 'string') return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        json: function(context) {
            return JSON.stringify(context, null, 2);
        },
        increment: function(value) {
            return parseInt(value) + 1;
        }
    }
});


// Debug registered partials
hbs.getPartials().then((partials) => {
    console.log('Registered Partials:', Object.keys(partials));
});


const app = express();

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Serve static files (including images from public/images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Logging for all incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - User: ${req.session?.user?.username || 'Guest'}`);
    next();
});



// Session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'defaultsecret',
        resave: true, // Prevents unnecessary session overwrites
        saveUninitialized: false, // Only save sessions when needed
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI, // MongoDB connection string
            collectionName: 'sessions', // Stores sessions in the 'sessions' collection
            ttl: 7 * 24 * 60 * 60, // Sessions last 7 days
            autoRemove: 'interval',
            autoRemoveInterval: 10 // Removes expired sessions every 10 minutes
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production', // Secure cookies in production
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: 'lax',
        },
    })
);

// CSRF Protection setup
const csrfTokens = new csrf();
//const disableCSRF = process.env.NODE_ENV !== 'production';





app.use((req, res, next) => {
    if (!req.session.csrfSecret) {
        req.session.csrfSecret = csrfTokens.secretSync();
    }

    try {
        res.locals.csrfToken = csrfTokens.create(req.session.csrfSecret);
        next();
    } catch (err) {
        console.error('CSRF token generation error:', err.message);
        res.locals.csrfToken = null;
        next(err);
    }
});

app.use((req, res, next) => {
    if (req.method !== 'POST') {
        return next();
    }

    const token = req.body._csrf || req.headers['x-csrf-token'];
    if (!csrfTokens.verify(req.session.csrfSecret, token)) {
        console.warn('Invalid CSRF token');
        return res.status(403).render('member_form_views/error', {
            layout: 'memberformlayout',
            title: 'Forbidden',
            errorMessage: 'Invalid CSRF token.',
        });
    }

    next();
});

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads');
        fs.existsSync(uploadPath) || fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        cb(null, `${Date.now()}${fileExtension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
    },
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Passport.js configuration
require('./config/passport-config')(passport); // Import Passport logic from `passport-config.js`

app.use(passport.initialize());
app.use(passport.session());

// Global middleware for session and user data
app.use((req, res, next) => {
    console.log('Session data:', req.session);
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});


// Ensure necessary directories exist
['public/uploads/profiles', 'public/uploads/groups'].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

    const Member = require("./models/member_models/member");
    const Leader = require("./models/member_models/leader");
    const GroupMember = require("./models/member_models/group_member");
    
    app.use(async (req, res, next) => {
        if (req.session?.user?.id) {
            try {
                let membershipType = req.session.user.membershipType; // Default to session value
    
                // ✅ Fetch membershipType from the database to ensure accuracy
                const member = await Member.findById(req.session.user.id);
                const leader = await Leader.findById(req.session.user.id);
                const groupMember = await GroupMember.findById(req.session.user.id);
    
                if (member) {
                    membershipType = "member";
                } else if (leader) {
                    membershipType = "leader";
                } else if (groupMember) {
                    membershipType = "groupmember";
                }
    
                req.session.user.membershipType = membershipType; // ✅ Update session with correct value
                res.locals.dashboardLink = `/dashboard/${membershipType}`;
                console.log(`✅ dashboardLink set: ${res.locals.dashboardLink}`);
    
            } catch (err) {
                console.error("❌ Error retrieving membershipType from the database:", err);
                res.locals.dashboardLink = "/dashboard"; // Default fallback
            }
        } else {
            res.locals.dashboardLink = "/dashboard";
        }
        next();
    });

    
// Routes import and setup
const promoRoutes = require('./routes/promoroutes/promoroutes');
const memberRoutes = require('./routes/memberroutes');
const groupmemberRoutes = require('./routes/groupmemberroutes');
const leaderDashboardRoutes = require('./routes/leaderdashboardRoutes');
const groupMemberDashboardRoutes = require('./routes/groupmemberdashboardRoutes');
const memberDashboardRoutes = require('./routes/memberdashboardRoutes');
const leaderRoutes = require('./routes/leaderroutes');
const loginRoutes = require('./routes/loginroutes');
const profileRoutes = require('./routes/profileroutes');
const topicRoutes = require('./routes/topicroutes');
const unitFormRoutes = require('./routes/unitformroutes');
const unitviewRoutes = require('./routes/unitviewroutes');
const bytopicRoutes = require('./routes/bytopicroutes');
const tagRoutes = require('./routes/tagroutes');
const promptsetregistrationRoutes = require('./routes/promptsetregistrationroutes');
const promptsetassignRoutes = require('./routes/promptsetassignroutes');
const promptsetnotesRoutes = require('./routes/promptsetnotesroutes'); // New route for prompt notes
const promptsetcompleteRoutes = require('./routes/promptsetcompleteroutes');
const membertopicRoutes = require('./routes/membertopicroutes');
const badgesRoutes = require('./routes/badgesroutes');
const notesRoutes = require('./routes/notesroutes');
const reportingRoutes = require('./routes/reportingroutes');
const latestRoutes = require('./routes/latestroutes'); // Import latest routes



// Use routes
app.use('/', promoRoutes); // Promo and homepage routes
app.use('/member', memberRoutes); // General member routes
app.use('/member/group', groupmemberRoutes); // Group member routes
app.use('/dashboard/leader', leaderDashboardRoutes); // Leader dashboard routes
app.use('/dashboard/groupmember', groupMemberDashboardRoutes); // Group member dashboard routes
app.use('/dashboard/member', memberDashboardRoutes); // Member dashboard routes
app.use('/leader', leaderRoutes); // Leader routes
app.use('/auth', loginRoutes); // Authentication routes
app.use('/profile', profileRoutes); // Profile-related routes
app.use('/topics', topicRoutes); // Hardcoded topic-specific routes
app.use('/unitform', unitFormRoutes); // Unit form routes
app.use('/unitviews', unitviewRoutes); // Unit views for all users
app.use('/bytopic', bytopicRoutes); // Library units by topic routes
app.use('/tags', tagRoutes);
app.use('/promptsetregistration', promptsetregistrationRoutes);
app.use('/promptsetassign', promptsetassignRoutes);
app.use('/promptsetnotes', promptsetnotesRoutes); // New route for prompt notes
app.use('/promptsetcomplete', promptsetcompleteRoutes);
app.use('/membertopics', membertopicRoutes);
app.use('/badges/', badgesRoutes);
app.use('/notes', notesRoutes);
app.use("/reports", require("./routes/reportingroutes"));
app.use('/latest', latestRoutes); // Use the latest items route
// Setting up CORS middleware before the defined routes, to allow any requests to be processed correctly (This is needed for the "IonIcons Hamburger Menu").
app.use(cors());



// 404 Error handler
app.use((req, res) => {
    console.warn(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).render('member_form_views/error', {
        layout: 'memberformlayout',
        title: 'Page Not Found',
        errorMessage: 'The page you are looking for does not exist.',
    });
});

// General error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    const layout = req.originalUrl.startsWith('/member') ? 'memberformlayout' : 'mainlayout';
    res.status(500).render('member_form_views/error', {
        layout,
        title: 'Server Error',
        errorMessage: process.env.NODE_ENV === 'development' ? err.message : 'An internal server error occurred.',
    });
});

module.exports = app;




