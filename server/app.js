const express = require('express');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const validate = require('./validation');
const { createStore } = require('./store');
const { query } = require('./database');

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

function createApp({ store = createStore(query), serveStatic = true } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(['/todos', '/notes', '/api'], (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(['/todos', '/notes'], validate);

  for (const kind of ['todos', 'notes']) {
    const label = kind === 'todos' ? 'Todo' : 'Note';
    app.get(`/${kind}`, asyncRoute(async (req, res) => res.json(await store.list(kind, req.query))));
    app.post(`/${kind}`, asyncRoute(async (req, res) => {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const record = { ...req.body, id: randomUUID(), title: req.body.title.trim() };
      if (record.category !== undefined) record.category = record.category.trim();
      if (record.content !== undefined) record.content = record.content.trim();
      if (kind === 'todos') record.completed = false;
      res.status(201).json(await store.create(kind, record));
    }));
    app.put(`/${kind}/:id`, asyncRoute(async (req, res) => {
      const patch = { ...req.body };
      for (const key of ['title', 'category', 'content']) {
        if (patch[key] !== undefined) patch[key] = patch[key].trim();
      }
      const record = await store.update(kind, req.params.id, patch);
      if (!record) return res.status(404).json({ error: `${label} not found` });
      res.json(record);
    }));
    app.delete(`/${kind}/:id`, asyncRoute(async (req, res) => {
      if (!await store.remove(kind, req.params.id)) return res.status(404).json({ error: `${label} not found` });
      res.status(204).end();
    }));
  }
  app.get('/api/health', asyncRoute(async (req, res) => {
    try {
      await store.health();
      res.json({ status: 'ok', storage: 'postgresql', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'unavailable', error: 'Database unavailable' });
    }
  }));
  app.use(['/api', '/todos', '/notes'], (req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  if (serveStatic) {
    app.use(express.static(path.join(__dirname, '../build')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../build/index.html')));
  } else {
    app.use((req, res) => res.status(404).json({ error: 'API endpoint not found' }));
  }
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status >= 400 && err.status < 500 ? err.status : 500;
    res.status(status).json({ error: status === 500 ? 'Unable to access saved data. Please retry.' :
      status === 413 ? 'Request body too large' : 'Invalid request' });
  });
  return app;
}
module.exports = { createApp };
