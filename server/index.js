const express = require('express');
const path = require('path');
const { randomUUID: uuidv4 } = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

app.disable('x-powered-by');

// Serve static React build files in production
app.use(express.static(path.join(__dirname, '../build')));

// In-memory data store
let todos = [
  {
    id: '1',
    title: 'Explore the new Notes feature',
    completed: false,
    priority: 'high',
    dueDate: '2026-09-30',
    category: 'Work',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Review AGENTS.md rules and guidelines',
    completed: true,
    priority: 'medium',
    dueDate: '2026-10-01',
    category: 'Dev',
    createdAt: new Date().toISOString()
  }
];

let notes = [
  {
    id: '1',
    title: 'Welcome Note',
    content: 'Capture your thoughts, ideas, and quick scratchpad notes right alongside your todos!',
    color: '#e0f2fe',
    category: 'Ideas',
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Sprint Planning Checklist',
    content: '1. Review backlog items\n2. Set priority tags\n3. Assign deadlines',
    color: '#fef3c7',
    category: 'Work',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Validate the whole request before any mutation, so rejected updates are atomic.
app.use(['/todos', '/notes'], (req, res, next) => {
  const fail = message => res.status(400).json({ error: message });
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value !== 'string') return fail(`${key} must be a single string`);
  }
  if (req.query.completed !== undefined && !['true', 'false'].includes(req.query.completed)) {
    return fail('completed must be true or false');
  }
  if (!['POST', 'PUT'].includes(req.method)) return next();
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Body must be a JSON object');
  for (const key of ['title', 'category', 'content', 'priority', 'color']) {
    if (body[key] !== undefined && typeof body[key] !== 'string') return fail(`${key} must be a string`);
  }
  if (body.title !== undefined && (!body.title.trim() || body.title.length > 200)) return fail('Title must contain 1–200 characters');
  if (body.category !== undefined && (!body.category.trim() || body.category.length > 100)) return fail('Category must contain 1–100 characters');
  if (body.content !== undefined && body.content.length > 20000) return fail('Content must not exceed 20000 characters');
  for (const key of ['completed', 'isPinned']) {
    if (body[key] !== undefined && typeof body[key] !== 'boolean') return fail(`${key} must be a boolean`);
  }
  if (body.color !== undefined && !/^#[0-9a-f]{6}$/i.test(body.color)) return fail('Color must be a six-digit hex color');
  if (body.dueDate !== undefined && body.dueDate !== null) {
    const date = body.dueDate;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      return fail('dueDate must be a valid YYYY-MM-DD date or null');
    }
  }
  if (body.priority !== undefined) {
    body.priority = ['low', 'medium', 'high'].includes(body.priority.toLowerCase()) ? body.priority.toLowerCase() : 'medium';
  }
  next();
});

// -------------------------------------------------------------
// TODOS API ENDPOINTS
// -------------------------------------------------------------

// GET /todos - Fetch all todos
app.get('/todos', (req, res) => {
  const { priority, category, search, completed } = req.query;
  let filtered = [...todos];

  if (priority) {
    filtered = filtered.filter(t => t.priority === priority);
  }
  if (category) {
    filtered = filtered.filter(t => t.category?.toLowerCase() === category.toLowerCase());
  }
  if (completed !== undefined) {
    const isComp = completed === 'true';
    filtered = filtered.filter(t => t.completed === isComp);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(t => t.title.toLowerCase().includes(s));
  }

  res.json(filtered);
});

// POST /todos - Create a new todo
app.post('/todos', (req, res) => {
  const { title, priority = 'medium', dueDate = null, category = 'General' } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }

  const validPriorities = ['low', 'medium', 'high'];
  const sanitizedPriority = validPriorities.includes(priority?.toLowerCase())
    ? priority.toLowerCase()
    : 'medium';

  const newTodo = {
    id: uuidv4(),
    title: title.trim(),
    completed: false,
    priority: sanitizedPriority,
    dueDate,
    category: category.trim(),
    createdAt: new Date().toISOString()
  };

  todos.unshift(newTodo);
  res.status(201).json(newTodo);
});

// PUT /todos/:id - Update todo status / details
app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex(t => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const { title, completed, priority, dueDate, category } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    todos[todoIndex].title = title.trim();
  }

  if (completed !== undefined) {
    todos[todoIndex].completed = Boolean(completed);
  } else if (req.body && Object.keys(req.body).length === 0) {
    // Quick toggle if empty payload sent
    todos[todoIndex].completed = !todos[todoIndex].completed;
  }

  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (validPriorities.includes(priority.toLowerCase())) {
      todos[todoIndex].priority = priority.toLowerCase();
    }
  }

  if (dueDate !== undefined) todos[todoIndex].dueDate = dueDate;
  if (category !== undefined) todos[todoIndex].category = category.trim();

  res.json(todos[todoIndex]);
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = todos.length;
  todos = todos.filter(t => t.id !== id);

  if (todos.length === initialLength) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  res.status(204).send();
});

// -------------------------------------------------------------
// NOTES API ENDPOINTS
// -------------------------------------------------------------

// GET /notes - Fetch all notes
app.get('/notes', (req, res) => {
  const { category, search } = req.query;
  let filtered = [...notes];

  if (category) {
    filtered = filtered.filter(n => n.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(n => n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s));
  }

  // Sort pinned notes to the top
  filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  res.json(filtered);
});

// POST /notes - Create a new note
app.post('/notes', (req, res) => {
  const { title, content, color = '#fef3c7', category = 'General', isPinned = false } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Note title is required' });
  }

  const newNote = {
    id: uuidv4(),
    title: title.trim(),
    content: (content || '').trim(),
    color: color || '#fef3c7',
    category: (category || 'General').trim(),
    isPinned: Boolean(isPinned),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.unshift(newNote);
  res.status(201).json(newNote);
});

// PUT /notes/:id - Update note
app.put('/notes/:id', (req, res) => {
  const { id } = req.params;
  const noteIndex = notes.findIndex(n => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const { title, content, color, category, isPinned } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Note title cannot be empty' });
    }
    notes[noteIndex].title = title.trim();
  }

  if (content !== undefined) notes[noteIndex].content = content.trim();
  if (color !== undefined) notes[noteIndex].color = color;
  if (category !== undefined) notes[noteIndex].category = category.trim();
  if (isPinned !== undefined) notes[noteIndex].isPinned = Boolean(isPinned);
  notes[noteIndex].updatedAt = new Date().toISOString();

  res.json(notes[noteIndex]);
});

// DELETE /notes/:id - Delete a note
app.delete('/notes/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = notes.length;
  notes = notes.filter(n => n.id !== id);

  if (notes.length === initialLength) {
    return res.status(404).json({ error: 'Note not found' });
  }

  res.status(204).send();
});

// -------------------------------------------------------------
// HEALTH CHECK & FALLBACK ROUTE
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(['/api', '/todos', '/notes'], (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Fallback to React index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error' :
    status === 413 ? 'Request body too large' : 'Invalid request' });
});

// Export app for test runner
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
