const router = require('express').Router();
const passport = require('passport');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const connection = require('../config/database');
const User = connection.models.User;

function isAuth(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).render('error', {data: { errorType: 'You are not authorized to view this resource' }});
    }
}

function hashUser(username) {
    const hash = crypto.createHash('sha256').update(username).digest('hex');
    return hash;
}

function genPassword(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    
    return {
      salt: salt,
      hash: genHash
    };
}

router.post('/login', passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: 'login-success' }));

router.post('/register', async (req, res, next) => {
    const saltHash = genPassword(req.body.pw);    
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    const foldername = hashUser(req.body.uname).slice(0, 7);
    const newUser = new User({
        username: req.body.uname,
        hash: hash,
        salt: salt,
        folder: foldername,
    });
    const fullPath = __dirname + '/../uploads/' + foldername;
    try {
        await fs.promises.mkdir(fullPath);
    } catch (err) {
        if(err.code === 'EEXIST'){
            res.status(409).render('error', {data: {errorType: `Username already exists`}});
            return next(err);
        } else {
            res.status(500).render('error', {data: {errorType: 'Error while creating directory'}});
            return next(err);
        }
    }
    newUser.save()
        .then((user) => {
           // console.log(user);
        });
    res.set("Content-Security-Policy", "script-src 'sha256-HKHu8KzWy+uFQ5xdfwaa0tCXOadFl9TeeAR/XBFTSbw='")
    res.render('success', {message: 'Registered Successfully!', redirect: '/login'});
});

const upload = multer({
    storage: multer.diskStorage({
        destination: async (req, file, callback) => {
            const user = await User.findById(req.session.passport.user);
            callback(null, __dirname + `/../uploads/${user.folder}`);
        },
        filename: (req, file, callback) => {
            callback(null, file.originalname);
        }
    }),
    fileFilter: async (req, file, callback) => {
        const ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif' && ext !== '.txt') {
            return callback(new Error('Only image and txt files are allowed.'));
        }
        const mime = file.mimetype;
        if(mime !== 'image/jpeg' && mime !== 'text/plain' && mime !== 'image/png' && mime !== 'image/gif') {
            return callback(new Error('Only image and txt mimetypes are allowed.'));
        }
        callback(null, true);
    },
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MiB
    }
});
router.post('/upload', isAuth, upload.single('uploaded_file'), async (req, res, next) => {
    const user = await User.findById(req.session.passport.user);
    if (!user) {
        return res.status(404).render('error', {data: {errorType: "User not found"}});
    }    
    res.set("Content-Security-Policy", "script-src 'sha256-MSnSmGZTR0J+A2zO+oWr29zXYQp+frnwJyJJwQgaJkM='")
    res.render('success', {message: 'Uploaded Successfully!', redirect: '/dashboard'});
});

router.get('/', (req, res, next) => {
    if (req.isAuthenticated()) {
        res.redirect('dashboard');
    }
    res.render('home');
});

router.get('/login', (req, res, next) => {
    res.render('login');
});

router.get('/register', (req, res, next) => {
    res.render('register');
});

router.get('/dashboard', isAuth, (req, res, next) => {
    res.render('dashboard');
});

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.set("Content-Security-Policy", "script-src 'sha256-Qx9mL2K9oky7Tu8gS1KRgL3vhyhzv1Ixi3oXyswWXAw='")
        res.render('success', {message: 'Logged-out Successfully!', redirect: '/'});
    });
    
});

router.get('/login-success', isAuth, (req, res, next) => {
    res.set("Content-Security-Policy", "script-src 'sha256-MSnSmGZTR0J+A2zO+oWr29zXYQp+frnwJyJJwQgaJkM='")
    res.render('success', {message: 'Logged-in Successfully!', redirect: '/dashboard'});
});

router.get('/login-failure', (req, res, next) => {
    res.render('error', {data: {errorType: "Incorrect Username/Password"}});
});

router.get('/upload', isAuth, (req, res, next) => {
    res.render('upload');
});

router.get('/files', isAuth, async (req, res, next) => {
    const user = await User.findById(req.session.passport.user);
    fileNames = await fs.promises.readdir(__dirname + '/../uploads/' + user.folder);
    res.render('files', {fileNames: fileNames});
});

router.get('/view/:fileName', isAuth, async (req, res) => {
    const user = await User.findById(req.session.passport.user);
    const root = path.resolve(__dirname + "/../");
    let content;
    try {
        if (req.params.fileName.endsWith(".txt")) {
            content = fs.readFileSync(root + '/uploads/'+ user.folder + "/" + req.params.fileName.slice(1))
        } else {
            content = fs.readFileSync(root + '/uploads/'+ user.folder + "/" + req.params.fileName.slice(1))
            const base64enc = Buffer.from(content).toString('base64');
            content = base64enc;
        }
        res.render('view', {content: content, fileName: req.params.fileName.slice(1)})
    } catch (error) {
        res.render('error', {data: {errorType: "No such file or directory!"}});
    }
})

router.get('/download/:fileName', isAuth, async (req, res, next) => {
    const user = await User.findById(req.session.passport.user);
    const fileToDownload = path.resolve(__dirname + "/../") + '/uploads/'+ user.folder + "/" + req.params.fileName.slice(1);
    res.download(fileToDownload, req.params.fileName.slice(1), (err) => {
        if(err) {
            return next(err);
        }
    })
})

router.get('/view', isAuth, (req, res) => {
    res.render('error', {data: {errorType: "Blank File Name"}})
})

router.get('/download', isAuth, (req, res) => {
    res.render('error', {data: {errorType: "Blank File Name"}})
})

module.exports = router;