const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const authRoutes = require('./routes/auth');
const isAuthenticated = require('./middleware/auth');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());

const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collection: 'users',
    ttl: 2 * 60 * 60
});

app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    store: sessionStore
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.session.user || null;
    res.locals.temp_success_msg = req.cookies.temp_success_msg || null;
    if (res.locals.temp_success_msg) {
        res.clearCookie('temp_success_msg');
    }
    next();
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connecté'))
    .catch(err => console.log(err));

app.use('/auth', authRoutes);

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

app.get('/', (req, res) => {
    res.render('home');
});

app.listen(PORT, () => {
    console.log(`Le serveur tourne sur le port : ${PORT}`);
});
