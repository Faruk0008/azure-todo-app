/**
 * routes/todos.js — To-Do CRUD API routes.
 *
 * All routes are protected — a valid session is required.
 * To-dos are stored in a tasks.json file (per-user, keyed by OID).
 * Data persists across server restarts.
 *
 *   GET    /todos          → list all todos for the logged-in user
 *   POST   /todos          → create a new todo
 *   PUT    /todos/:id      → update a todo (any field)
 *   DELETE /todos/:id      → delete a todo
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// ── File-Based Store ────────────────────────────────────────────────────────
// Structure: { "user-oid": [ { id, title, description, dueDate, priority, status, createdAt }, ... ] }

const DATA_FILE = path.join(__dirname, '..', 'tasks.json');

/**
 * Read the full data store from disk.
 * Returns an object keyed by user OID.
 */
function readStore() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error reading tasks.json:', err.message);
    }
    return {};
}

/**
 * Write the full data store to disk.
 */
function writeStore(store) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing tasks.json:', err.message);
    }
}

// ── Auth Middleware ─────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

router.use(requireAuth);

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get the user's unique key (OID from Entra ID, or email as fallback).
 */
function getUserKey(req) {
    return req.session.user.oid || req.session.user.email;
}

/**
 * Get todos for the current user from the store.
 */
function getUserTodos(req) {
    const store = readStore();
    const key = getUserKey(req);
    return store[key] || [];
}

/**
 * Save todos for the current user to the store.
 */
function saveUserTodos(req, todos) {
    const store = readStore();
    const key = getUserKey(req);
    store[key] = todos;
    writeStore(store);
}

/**
 * Validate priority value.
 */
function isValidPriority(p) {
    return ['low', 'medium', 'high'].includes(p);
}

/**
 * Validate status value.
 */
function isValidStatus(s) {
    return ['todo', 'inprogress', 'done'].includes(s);
}

// ── GET /todos ──────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    const todos = getUserTodos(req);
    res.json(todos);
});

// ── POST /todos ─────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
    const { title, description, dueDate, priority } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const todos = getUserTodos(req);
    const newTodo = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: title.trim(),
        description: (description || '').trim(),
        dueDate: dueDate || null,
        priority: isValidPriority(priority) ? priority : 'medium',
        status: 'todo',
        createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    saveUserTodos(req, todos);
    res.status(201).json(newTodo);
});

// ── PUT /todos/:id ──────────────────────────────────────────────────────────

router.put('/:id', (req, res) => {
    const todos = getUserTodos(req);
    const todo = todos.find(t => t.id === req.params.id);

    if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    // Update fields if provided
    if (req.body.title !== undefined && req.body.title.trim()) {
        todo.title = req.body.title.trim();
    }
    if (req.body.description !== undefined) {
        todo.description = req.body.description.trim();
    }
    if (req.body.dueDate !== undefined) {
        todo.dueDate = req.body.dueDate || null;
    }
    if (req.body.priority !== undefined && isValidPriority(req.body.priority)) {
        todo.priority = req.body.priority;
    }
    if (req.body.status !== undefined && isValidStatus(req.body.status)) {
        todo.status = req.body.status;
    }

    saveUserTodos(req, todos);
    res.json(todo);
});

// ── DELETE /todos/:id ───────────────────────────────────────────────────────

router.delete('/:id', (req, res) => {
    const todos = getUserTodos(req);
    const index = todos.findIndex(t => t.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    todos.splice(index, 1);
    saveUserTodos(req, todos);
    res.json({ success: true });
});

module.exports = router;
