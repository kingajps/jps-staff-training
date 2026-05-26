const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Dummy user for demo – you'd use a database in production!
const USERNAME = "admin";
const PASSWORD_HASH = bcrypt.hashSync("password123", 10); // replace with a secure password

app.use(express.urlencoded({ extended: false })); // for form parsing
app.use(session({
    secret: 'your-super-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

function requireLogin(req, res, next) {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Serve login page
app.get('/login', (req, res) => {
    let loginHtml = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf-8');
    res.send(loginHtml.replace('<% if (error) { %>', '')
                      .replace('<%= error %>', req.query.error ? req.query.error : '')
                      .replace('<% } %>', ''));
});

// Handle login POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === USERNAME && bcrypt.compareSync(password, PASSWORD_HASH)) {
        req.session.authenticated = true;
        res.redirect('/');
    } else {
        res.redirect('/login?error=Invalid%20credentials');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Protect main page and static files
app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname, {
    // All static files are protected with the requireLogin middleware
    setHeaders: (res, filePath) => {
        // No-op
    }
}));

// Optionally, protect ALL other routes:
app.use(requireLogin);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
