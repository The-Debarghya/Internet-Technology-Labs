const express = require('express');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const routes = require('./routes');
const MongoStore = require('connect-mongo');
require('dotenv').config();

var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));


const sessionStore = MongoStore.create({mongoUrl: process.env.DB_STRING});

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Equals 1 day 
    }
}));

app.use(helmet());
require('ejs');
app.set('view engine', 'ejs');
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads'));
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).send('File size exceeded. Maximum allowed size is 5MB');
    }
    next(err);
});
app.use(routes);
app.all('*', (req, res) => {
    res.status(404);
})

app.listen(3000, () => {
    console.log("Server is up and running at ::3000")
});