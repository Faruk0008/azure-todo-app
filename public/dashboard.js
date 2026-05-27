/**
 * public/dashboard.js — Client-side logic for the Kanban-style To-Do dashboard.
 *
 * Handles:
 *   • Fetching & displaying the logged-in user's info
 *   • CRUD operations on tasks via the /todos API
 *   • Kanban board rendering (To Do / In Progress / Done)
 *   • Filtering by priority, searching by title, sorting
 *   • Add/Edit modal, Delete confirmation
 *   • Toast notifications
 *   • Overdue task highlighting
 */

(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────────────────

    const userNameEl       = document.getElementById('user-name');
    const userEmailEl      = document.getElementById('user-email');
    const userAvatar       = document.getElementById('user-avatar');

    const statTotal        = document.getElementById('stat-total');
    const statProgress     = document.getElementById('stat-progress');
    const statOverdue      = document.getElementById('stat-overdue');

    // Toolbar
    const searchInput      = document.getElementById('search-input');
    const filterPriority   = document.getElementById('filter-priority');
    const sortBy           = document.getElementById('sort-by');
    const btnAddTask       = document.getElementById('btn-add-task');

    // Kanban columns
    const cardsTodo        = document.getElementById('cards-todo');
    const cardsInprogress  = document.getElementById('cards-inprogress');
    const cardsDone        = document.getElementById('cards-done');
    const countTodo        = document.getElementById('count-todo');
    const countInprogress  = document.getElementById('count-inprogress');
    const countDone        = document.getElementById('count-done');
    const emptyTodo        = document.getElementById('empty-todo');
    const emptyInprogress  = document.getElementById('empty-inprogress');
    const emptyDone        = document.getElementById('empty-done');

    // Task Modal
    const taskModalOverlay = document.getElementById('task-modal-overlay');
    const modalTitle       = document.getElementById('modal-title');
    const taskForm         = document.getElementById('task-form');
    const fieldTitle       = document.getElementById('field-title');
    const fieldDescription = document.getElementById('field-description');
    const fieldDueDate     = document.getElementById('field-duedate');
    const fieldPriority    = document.getElementById('field-priority');
    const fieldStatus      = document.getElementById('field-status');
    const statusGroup      = document.getElementById('status-group');
    const fieldEditId      = document.getElementById('field-edit-id');
    const btnSubmit        = document.getElementById('btn-submit');
    const modalClose       = document.getElementById('modal-close');
    const btnCancel        = document.getElementById('btn-cancel');

    // Delete Modal
    const deleteModalOverlay = document.getElementById('delete-modal-overlay');
    const deleteTaskName     = document.getElementById('delete-task-name');
    const deleteTaskId       = document.getElementById('delete-task-id');
    const deleteCancel       = document.getElementById('delete-cancel');
    const deleteConfirm      = document.getElementById('delete-confirm');

    // Toast
    const toastContainer   = document.getElementById('toast-container');

    // ── State ───────────────────────────────────────────────────────────

    let tasks = [];

    // ── Init ────────────────────────────────────────────────────────────

    fetchUser();
    fetchTasks();

    // ── Event Listeners ─────────────────────────────────────────────────

    searchInput.addEventListener('input', render);
    filterPriority.addEventListener('change', render);
    sortBy.addEventListener('change', render);

    btnAddTask.addEventListener('click', () => openModal());
    modalClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    taskModalOverlay.addEventListener('click', (e) => {
        if (e.target === taskModalOverlay) closeModal();
    });

    deleteCancel.addEventListener('click', closeDeleteModal);
    deleteModalOverlay.addEventListener('click', (e) => {
        if (e.target === deleteModalOverlay) closeDeleteModal();
    });

    taskForm.addEventListener('submit', handleFormSubmit);
    deleteConfirm.addEventListener('click', handleDeleteConfirm);

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
        }
    });

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

    // ── Fetch Tasks ─────────────────────────────────────────────────────

    async function fetchTasks() {
        try {
            const res = await fetch('/todos');
            if (!res.ok) throw new Error();
            tasks = await res.json();
            render();
        } catch {
            console.error('Failed to fetch tasks');
        }
    }

    // ── Create Task ─────────────────────────────────────────────────────

    async function createTask(data) {
        try {
            const res = await fetch('/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error();
            const newTask = await res.json();
            tasks.push(newTask);
            render();
            showToast('Task added ✓');
        } catch {
            showToast('Failed to add task ✗', true);
        }
    }

    // ── Update Task ─────────────────────────────────────────────────────

    async function updateTask(id, data) {
        try {
            const res = await fetch(`/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error();
            const updated = await res.json();
            const index = tasks.findIndex(t => t.id === id);
            if (index !== -1) tasks[index] = updated;
            render();
            showToast('Task updated ✓');
        } catch {
            showToast('Failed to update task ✗', true);
        }
    }

    // ── Delete Task ─────────────────────────────────────────────────────

    async function deleteTask(id) {
        try {
            const res = await fetch(`/todos/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            tasks = tasks.filter(t => t.id !== id);
            render();
            showToast('Task deleted ✓');
        } catch {
            showToast('Failed to delete task ✗', true);
        }
    }

    // ── Change Status (Quick Action) ────────────────────────────────────

    async function changeStatus(id, newStatus) {
        await updateTask(id, { status: newStatus });
    }

    // ── Modal Logic ─────────────────────────────────────────────────────

    function openModal(task = null) {
        taskForm.reset();
        fieldEditId.value = '';

        if (task) {
            // Edit mode
            modalTitle.textContent = 'Edit Task';
            btnSubmit.textContent = 'Save Changes';
            fieldTitle.value = task.title;
            fieldDescription.value = task.description || '';
            fieldDueDate.value = task.dueDate || '';
            fieldPriority.value = task.priority;
            fieldStatus.value = task.status;
            fieldEditId.value = task.id;
            statusGroup.style.display = 'block';
        } else {
            // Add mode
            modalTitle.textContent = 'Add Task';
            btnSubmit.textContent = 'Add Task';
            statusGroup.style.display = 'none';
        }

        taskModalOverlay.classList.add('active');
        fieldTitle.focus();
    }

    function closeModal() {
        taskModalOverlay.classList.remove('active');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const data = {
            title: fieldTitle.value.trim(),
            description: fieldDescription.value.trim(),
            dueDate: fieldDueDate.value || null,
            priority: fieldPriority.value
        };

        const editId = fieldEditId.value;

        if (editId) {
            data.status = fieldStatus.value;
            await updateTask(editId, data);
        } else {
            await createTask(data);
        }

        closeModal();
    }

    // ── Delete Modal Logic ──────────────────────────────────────────────

    function openDeleteModal(task) {
        deleteTaskName.textContent = task.title;
        deleteTaskId.value = task.id;
        deleteModalOverlay.classList.add('active');
    }

    function closeDeleteModal() {
        deleteModalOverlay.classList.remove('active');
    }

    async function handleDeleteConfirm() {
        const id = deleteTaskId.value;
        if (id) {
            await deleteTask(id);
        }
        closeDeleteModal();
    }

    // ── Toast Notifications ─────────────────────────────────────────────

    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = 'toast' + (isError ? ' toast--error' : '');
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('toast--visible'));

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // ── Render ──────────────────────────────────────────────────────────

    function render() {
        const query = searchInput.value.toLowerCase().trim();
        const priorityFilter = filterPriority.value;
        const sortField = sortBy.value;

        // Filter
        let filtered = tasks.filter(t => {
            if (query && !t.title.toLowerCase().includes(query)) return false;
            if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortField === 'dueDate') {
                const aDate = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
                const bDate = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
                return aDate - bDate;
            }
            // Default: sort by createdAt (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Split into columns
        const todoTasks = filtered.filter(t => t.status === 'todo');
        const inprogressTasks = filtered.filter(t => t.status === 'inprogress');
        const doneTasks = filtered.filter(t => t.status === 'done');

        // Render columns
        renderColumn(cardsTodo, todoTasks, emptyTodo, countTodo);
        renderColumn(cardsInprogress, inprogressTasks, emptyInprogress, countInprogress);
        renderColumn(cardsDone, doneTasks, emptyDone, countDone);

        // Update stats
        const overdueCount = tasks.filter(t => isOverdue(t)).length;
        const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;
        statTotal.textContent = tasks.length;
        statProgress.textContent = inProgressCount;
        statOverdue.textContent = overdueCount;
    }

    function renderColumn(container, columnTasks, emptyEl, countEl) {
        container.innerHTML = '';
        countEl.textContent = columnTasks.length;

        if (columnTasks.length === 0) {
            emptyEl.style.display = 'block';
        } else {
            emptyEl.style.display = 'none';
        }

        columnTasks.forEach((task, i) => {
            const card = createCard(task, i);
            container.appendChild(card);
        });
    }

    function createCard(task, index) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.style.animationDelay = `${index * 0.05}s`;

        if (isOverdue(task)) {
            card.classList.add('task-card--overdue');
        }
        if (task.status === 'done') {
            card.classList.add('task-card--done');
        }

        // Priority badge
        const badge = document.createElement('span');
        badge.className = `priority-badge priority-badge--${task.priority}`;
        badge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        // Title
        const title = document.createElement('h3');
        title.className = 'task-card__title';
        title.textContent = task.title;

        // Description snippet
        const desc = document.createElement('p');
        desc.className = 'task-card__desc';
        desc.textContent = task.description
            ? (task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description)
            : '';

        // Meta row (due date + created at)
        const meta = document.createElement('div');
        meta.className = 'task-card__meta';

        if (task.dueDate) {
            const due = document.createElement('span');
            due.className = 'task-card__due';
            if (isOverdue(task)) due.classList.add('task-card__due--overdue');
            due.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${formatDueDate(task.dueDate)}`;
            meta.appendChild(due);
        }

        const created = document.createElement('span');
        created.className = 'task-card__created';
        created.textContent = formatRelativeDate(task.createdAt);
        meta.appendChild(created);

        // Actions row
        const actions = document.createElement('div');
        actions.className = 'task-card__actions';

        // Status dropdown
        const statusSelect = document.createElement('select');
        statusSelect.className = 'task-card__status-select';
        statusSelect.id = `status-${task.id}`;
        ['todo', 'inprogress', 'done'].forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s === 'todo' ? 'To Do' : s === 'inprogress' ? 'In Progress' : 'Done';
            if (s === task.status) opt.selected = true;
            statusSelect.appendChild(opt);
        });
        statusSelect.addEventListener('change', () => changeStatus(task.id, statusSelect.value));

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-card__btn task-card__btn--edit';
        editBtn.id = `edit-${task.id}`;
        editBtn.title = 'Edit task';
        editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        editBtn.addEventListener('click', () => openModal(task));

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'task-card__btn task-card__btn--delete';
        delBtn.id = `del-${task.id}`;
        delBtn.title = 'Delete task';
        delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
        delBtn.addEventListener('click', () => openDeleteModal(task));

        actions.append(statusSelect, editBtn, delBtn);

        // Assemble card
        const topRow = document.createElement('div');
        topRow.className = 'task-card__top';
        topRow.append(title, badge);

        card.append(topRow);
        if (desc.textContent) card.appendChild(desc);
        card.appendChild(meta);
        card.appendChild(actions);

        return card;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function isOverdue(task) {
        if (!task.dueDate || task.status === 'done') return false;
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due < today;
    }

    function formatDueDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatRelativeDate(iso) {
        const d = new Date(iso);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000)        return 'just now';
        if (diff < 3600000)      return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000)     return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000)    return `${Math.floor(diff / 86400000)}d ago`;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

})();
