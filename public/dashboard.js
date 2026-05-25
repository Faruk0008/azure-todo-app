/**
 * public/dashboard.js — Client-side logic for the To-Do dashboard.
 *
 * Handles:
 *   • Fetching & displaying the logged-in user's info
 *   • CRUD operations on todos via the /todos API
 *   • Filtering (All / Pending / Completed)
 *   • Updating stats counters
 */

(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────────────────

    const userNameEl   = document.getElementById('user-name');
    const userEmailEl  = document.getElementById('user-email');
    const userAvatar   = document.getElementById('user-avatar');

    const addForm      = document.getElementById('add-form');
    const todoInput    = document.getElementById('todo-input');
    const todoListEl   = document.getElementById('todo-list');
    const emptyState   = document.getElementById('empty-state');

    const statTotal    = document.getElementById('stat-total');
    const statDone     = document.getElementById('stat-done');
    const statPending  = document.getElementById('stat-pending');

    const filterBtns   = document.querySelectorAll('.filter-btn');

    // ── State ───────────────────────────────────────────────────────────

    let todos = [];
    let currentFilter = 'all';

    // ── Init ────────────────────────────────────────────────────────────

    fetchUser();
    fetchTodos();

    // ── Fetch User Info ─────────────────────────────────────────────────

    async function fetchUser() {
        try {
            const res = await fetch('/api/me');
            if (!res.ok) {
                window.location.href = '/';
                return;
            }
            const user = await res.json();
            userNameEl.textContent  = user.name || 'User';
            userEmailEl.textContent = user.email || '';
            userAvatar.textContent  = (user.name || 'U').charAt(0).toUpperCase();
        } catch {
            window.location.href = '/';
        }
    }

    // ── Fetch Todos ─────────────────────────────────────────────────────

    async function fetchTodos() {
        try {
            const res = await fetch('/todos');
            if (!res.ok) throw new Error();
            todos = await res.json();
            render();
        } catch {
            console.error('Failed to fetch todos');
        }
    }

    // ── Add Todo ────────────────────────────────────────────────────────

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (!text) return;

        try {
            const res = await fetch('/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error();
            const newTodo = await res.json();
            todos.push(newTodo);
            todoInput.value = '';
            render();
            todoInput.focus();
        } catch {
            console.error('Failed to add todo');
        }
    });

    // ── Toggle Complete ─────────────────────────────────────────────────

    async function toggleComplete(id) {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const res = await fetch(`/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !todo.completed })
            });
            if (!res.ok) throw new Error();
            const updated = await res.json();
            Object.assign(todo, updated);
            render();
        } catch {
            console.error('Failed to update todo');
        }
    }

    // ── Delete Todo ─────────────────────────────────────────────────────

    async function deleteTodo(id) {
        try {
            const res = await fetch(`/todos/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            todos = todos.filter(t => t.id !== id);
            render();
        } catch {
            console.error('Failed to delete todo');
        }
    }

    // ── Filter ──────────────────────────────────────────────────────────

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    // ── Render ──────────────────────────────────────────────────────────

    function render() {
        // Update stats
        const doneCount    = todos.filter(t => t.completed).length;
        const pendingCount = todos.length - doneCount;
        statTotal.textContent   = todos.length;
        statDone.textContent    = doneCount;
        statPending.textContent = pendingCount;

        // Filter
        let visible = todos;
        if (currentFilter === 'pending')   visible = todos.filter(t => !t.completed);
        if (currentFilter === 'completed') visible = todos.filter(t => t.completed);

        // Empty state
        if (visible.length === 0) {
            emptyState.classList.add('visible');
            if (todos.length === 0) {
                emptyState.textContent = '🎉 No tasks yet — add one above!';
            } else if (currentFilter === 'pending') {
                emptyState.textContent = '✅ All tasks completed!';
            } else {
                emptyState.textContent = '📋 No completed tasks yet.';
            }
        } else {
            emptyState.classList.remove('visible');
        }

        // Build list
        todoListEl.innerHTML = '';
        visible.forEach((todo, i) => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            li.style.animationDelay = `${i * 0.04}s`;

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-check';
            checkbox.checked = todo.completed;
            checkbox.id = `check-${todo.id}`;
            checkbox.addEventListener('change', () => toggleComplete(todo.id));

            // Text
            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = todo.text;

            // Timestamp
            const time = document.createElement('span');
            time.className = 'todo-time';
            time.textContent = formatDate(todo.createdAt);

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'todo-delete';
            delBtn.id = `del-${todo.id}`;
            delBtn.title = 'Delete task';
            delBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>`;
            delBtn.addEventListener('click', () => deleteTodo(todo.id));

            li.append(checkbox, span, time, delBtn);
            todoListEl.appendChild(li);
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function formatDate(iso) {
        const d = new Date(iso);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000)        return 'just now';
        if (diff < 3600000)      return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000)     return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

})();
