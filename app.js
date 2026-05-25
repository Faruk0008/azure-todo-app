/**
 * app.js — Main entry point for the To-Do web application.
 * 
 * Sets up Express with session middleware, serves static views,
 * and mounts authentication + to-do API routes.
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,          // Set to true if behind HTTPS in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));

// Serve static files from /public (for CSS, client JS, etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));

// ── Routes ──────────────────────────────────────────────────────────────────

// Mount auth routes at /auth
app.use('/auth', authRoutes);

// Mount to-do API routes at /todos  (protected — auth checked inside)
app.use('/todos', todoRoutes);

// ── Page Routes ─────────────────────────────────────────────────────────────

// Home / Login page
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Dashboard — only for authenticated users
app.get('/dashboard', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API endpoint to get the current user's info (consumed by dashboard JS)
app.get('/api/me', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.session.user);
});

// ── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`✅ To-Do app running at http://localhost:${PORT}`);
});
