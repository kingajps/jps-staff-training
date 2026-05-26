const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Dummy user for demo – you'd use a database in production!
const USERNAME = "admin";
const PASSWORD_HASH = "$2a$10$JjBX3AhWIJ8BEEeB9UnqaOhgqrFl85Bs8pVsmvndDEoslsNq3neP2"; // "password123"

app.use(express.urlencoded({ extended: false })); // for form parsing
app.use(session({
    secret: 'your-super-secret-key', // CHANGE THIS for real use!
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
    const error = req.query.error ? decodeURIComponent(req.query.error) : '';
    let loginHtml = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf-8');
    loginHtml = loginHtml.replace('%%ERROR%%', error);
    res.send(loginHtml);
});

// Handle login POST
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === USERNAME && bcrypt.compareSync(password, PASSWORD_HASH)) {
        req.session.authenticated = true;
        res.redirect('/');
    } else {
        res.redirect('/login?error=' + encodeURIComponent('Invalid credentials'));
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Protect main page
app.get('/', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Protect all other static files (css/js/images/etc)
app.use(requireLogin, express.static(__dirname));

// Handle 404
app.use((req, res) => {
    res.status(404).send('404 - Not found');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
