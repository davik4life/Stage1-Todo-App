const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../index');

test('API Endpoint Tests - Todos & Notes Ecosystem', async (t) => {
  let createdTodoId;
  let createdNoteId;

  await t.test('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  // --- TODOS TESTS ---
  await t.test('GET /todos returns list of todos', async () => {
    const res = await request(app).get('/todos');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body));
  });

  await t.test('POST /todos successfully creates a new todo with priority & category', async () => {
    const newTodo = {
      title: 'Automated Test Todo',
      priority: 'high',
      category: 'Testing',
      dueDate: '2026-12-31'
    };
    const res = await request(app).post('/todos').send(newTodo);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, 'Automated Test Todo');
    assert.strictEqual(res.body.priority, 'high');
    assert.strictEqual(res.body.completed, false);
    createdTodoId = res.body.id;
  });

  await t.test('POST /todos fails validation when title is empty', async () => {
    const res = await request(app).post('/todos').send({ title: '   ' });
    assert.strictEqual(res.status, 400);
    assert(res.body.error);
  });

  await t.test('PUT /todos/:id updates completion status and properties', async () => {
    const res = await request(app)
      .put(`/todos/${createdTodoId}`)
      .send({ completed: true, priority: 'low' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.completed, true);
    assert.strictEqual(res.body.priority, 'low');
  });

  await t.test('DELETE /todos/:id removes the todo', async () => {
    const res = await request(app).delete(`/todos/${createdTodoId}`);
    assert.strictEqual(res.status, 204);

    const getRes = await request(app).get('/todos');
    const exists = getRes.body.some(t => t.id === createdTodoId);
    assert.strictEqual(exists, false);
  });

  await t.test('DELETE /todos/:id returns 404 for nonexistent id', async () => {
    const res = await request(app).delete('/todos/non-existent-id-999');
    assert.strictEqual(res.status, 404);
  });

  // --- NOTES TESTS ---
  await t.test('GET /notes returns list of notes', async () => {
    const res = await request(app).get('/notes');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body));
  });

  await t.test('POST /notes successfully creates a new note', async () => {
    const newNote = {
      title: 'API Test Note',
      content: 'Testing note creation functionality',
      category: 'Documentation',
      color: '#e0f2fe',
      isPinned: true
    };
    const res = await request(app).post('/notes').send(newNote);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.title, 'API Test Note');
    assert.strictEqual(res.body.isPinned, true);
    createdNoteId = res.body.id;
  });

  await t.test('POST /notes fails when title is missing', async () => {
    const res = await request(app).post('/notes').send({ content: 'No title provided' });
    assert.strictEqual(res.status, 400);
    assert(res.body.error);
  });

  await t.test('PUT /notes/:id updates note details and pin status', async () => {
    const res = await request(app)
      .put(`/notes/${createdNoteId}`)
      .send({ title: 'Updated Test Note', isPinned: false });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.title, 'Updated Test Note');
    assert.strictEqual(res.body.isPinned, false);
  });

  await t.test('DELETE /notes/:id removes the note', async () => {
    const res = await request(app).delete(`/notes/${createdNoteId}`);
    assert.strictEqual(res.status, 204);

    const getRes = await request(app).get('/notes');
    const exists = getRes.body.some(n => n.id === createdNoteId);
    assert.strictEqual(exists, false);
  });
});

test('Validation rejects malformed inputs without partial writes', async () => {
  for (const route of ['/todos', '/notes']) {
    const created = await request(app).post(route).send({ title: 'Unchanged' });
    assert.equal(created.status, 201);
    for (const invalid of [
      { title: null }, { title: ' ' }, { category: 42 }, { category: '' },
      { priority: {} }, { completed: 'false' }, { isPinned: 'false' },
      { content: [] }, { color: 'red' }, { dueDate: '2026-02-30' }, { dueDate: {} }
    ]) {
      const res = await request(app).put(`${route}/${created.body.id}`).send({ title: 'Changed', ...invalid });
      assert.equal(res.status, 400, JSON.stringify(invalid));
      assert.equal(typeof res.body.error, 'string');
      const list = await request(app).get(route);
      assert.deepEqual(list.body.find(item => item.id === created.body.id), created.body);
    }
    for (const body of [[], { title: 'valid', category: null }, { title: 'valid', content: 3 }]) {
      assert.equal((await request(app).post(route).send(body)).status, 400);
    }
    for (const query of ['search[x]=a', 'category=a&category=b', 'completed=no']) {
      assert.equal((await request(app).get(`${route}?${query}`)).status, 400);
    }
    assert.equal((await request(app).post(route).set('Content-Type', 'application/json').send('{')).status, 400);
    assert.equal((await request(app).put(`${route}/missing`).send({ title: 'test' })).status, 404);
    await request(app).delete(`${route}/${created.body.id}`);
    assert.equal((await request(app).delete(`${route}/${created.body.id}`)).status, 404);
  }
});

test('Filtering, normalization, pin ordering and empty-payload toggle', async () => {
  const todo = await request(app).post('/todos').send({ title: ' Unique Search ', category: ' Test Category ', priority: 'HIGH' });
  assert.equal(todo.body.title, 'Unique Search');
  assert.equal(todo.body.priority, 'high');
  const list = await request(app).get('/todos?search=unique&category=test%20category&priority=high&completed=false');
  assert.deepEqual(list.body.map(item => item.id), [todo.body.id]);
  const updated = await request(app).put(`/todos/${todo.body.id}`).send({ priority: 'unknown', dueDate: '2028-02-29' });
  assert.equal(updated.body.priority, 'medium');
  assert.equal(updated.body.dueDate, '2028-02-29');
  const toggled = await request(app).put(`/todos/${todo.body.id}`).send({});
  assert.equal(toggled.body.completed, true);
  const note = await request(app).post('/notes').send({ title: 'Unique note', content: 'Needle', category: 'Tests', isPinned: true });
  const notes = await request(app).get('/notes?search=needle&category=tests');
  assert.deepEqual(notes.body.map(item => item.id), [note.body.id]);
  const all = await request(app).get('/notes');
  assert.equal(all.body[0].isPinned, true);
  await request(app).delete(`/todos/${todo.body.id}`);
  await request(app).delete(`/notes/${note.body.id}`);
});

test('Unknown API routes return JSON rather than the SPA', async () => {
  for (const route of ['/api/missing', '/todos/missing', '/notes/missing']) {
    const res = await request(app).get(route);
    assert.equal(res.status, 404);
    assert.match(res.headers['content-type'], /json/);
  }
});
