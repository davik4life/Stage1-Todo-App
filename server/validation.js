// Validate the whole request before any mutation, so rejected updates are atomic.
module.exports = (req, res, next) => {
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
};

