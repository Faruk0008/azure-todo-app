/**
 * routes/todos.js — To-Do CRUD API routes.
 *
 * All routes are protected — a valid session is required.
 * To-dos are stored in-memory (per-user, keyed by email).
 * Data resets when the server restarts.
 *
 *   GET    /todos          → list all todos for the logged-in user
 *   POST   /todos          → create a new todo
 *   PUT    /todos/:id      → toggle complete / update a todo
 *   DELETE /todos/:id      → delete a todo
 */

const express = require('express');
const router = express.Router();

// ── In-Memory Store ─────────────────────────────────────────────────────────
// Structure:  { "user@email.com": [ { id, text, completed, createdAt }, ... ] }
const store = {};

// ── Auth Middleware ─────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

router.use(requireAuth);

// ── Helpers ─────────────────────────────────────────────────────────────────

function getUserTodos(email) {
    if (!store[email]) {
        store[email] = [];
    }
    return store[email];
}

// ── GET /todos ──────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    const todos = getUserTodos(req.session.user.email);
    res.json(todos);
});

// ── POST /todos ─────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const todos = getUserTodos(req.session.user.email);
    const newTodo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// ── PUT /todos/:id ──────────────────────────────────────────────────────────

router.put('/:id', (req, res) => {
    const todos = getUserTodos(req.session.user.email);
    const todo = todos.find(t => t.id === req.params.id);

    if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    // Toggle completed, or update text if provided
    if (req.body.completed !== undefined) {
        todo.completed = req.body.completed;
    }
    if (req.body.text !== undefined && req.body.text.trim()) {
        todo.text = req.body.text.trim();
    }

    res.json(todo);
});

// ── DELETE /todos/:id ───────────────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    const todos = getUserTodos(req.session.user.email);
    const index = todos.findIndex(t => t.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    todos.splice(index, 1);
    res.json({ success: true });
});

module.exports = router;
