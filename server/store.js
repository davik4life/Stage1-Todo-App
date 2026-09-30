const fields = {
  todos: { title: 'title', completed: 'completed', priority: 'priority', dueDate: 'due_date', category: 'category' },
  notes: { title: 'title', content: 'content', color: 'color', category: 'category', isPinned: 'is_pinned' },
};
const projections = {
  todos: 'id, title, completed, priority, due_date::text AS "dueDate", category, created_at AS "createdAt"',
  notes: 'id, title, content, color, category, is_pinned AS "isPinned", created_at AS "createdAt", updated_at AS "updatedAt"',
};

function createStore(query) {
  function assertKind(kind) {
    if (!Object.hasOwn(fields, kind)) throw new Error('Unknown collection');
  }
  return {
    async health() { await query('SELECT 1 FROM todos LIMIT 1'); await query('SELECT 1 FROM notes LIMIT 1'); },
    async list(kind, filters = {}) {
      assertKind(kind);
      const values = [];
      const conditions = [];
      const param = value => { values.push(value); return `$${values.length}`; };
      if (filters.category) conditions.push(`lower(category) = lower(${param(filters.category)})`);
      if (filters.search) {
        const token = param(filters.search);
        conditions.push(kind === 'notes'
          ? `(strpos(lower(title), lower(${token})) > 0 OR strpos(lower(content), lower(${token})) > 0)`
          : `strpos(lower(title), lower(${token})) > 0`);
      }
      if (kind === 'todos') {
        if (filters.priority) conditions.push(`priority = ${param(filters.priority)}`);
        if (filters.completed !== undefined) conditions.push(`completed = ${param(filters.completed === 'true')}`);
      }
      const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
      const order = kind === 'notes' ? 'is_pinned DESC, created_at DESC, id' : 'created_at DESC, id';
      return (await query(`SELECT ${projections[kind]} FROM ${kind}${where} ORDER BY ${order}`, values)).rows;
    },
    async create(kind, record) {
      assertKind(kind);
      const entries = Object.entries(fields[kind]).filter(([key]) => record[key] !== undefined);
      const columns = ['id', ...entries.map(([, column]) => column)];
      const values = [record.id, ...entries.map(([key]) => record[key])];
      const placeholders = values.map((_, i) => `$${i + 1}`);
      return (await query(`INSERT INTO ${kind} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${projections[kind]}`, values)).rows[0];
    },
    async update(kind, id, patch) {
      assertKind(kind);
      const values = [id];
      const assignments = [];
      for (const [key, column] of Object.entries(fields[kind])) {
        if (patch[key] !== undefined) {
          values.push(patch[key]);
          assignments.push(`${column} = $${values.length}`);
        }
      }
      if (kind === 'todos' && Object.keys(patch).length === 0) assignments.push('completed = NOT completed');
      if (kind === 'notes') assignments.push('updated_at = now()');
      if (!assignments.length) {
        return (await query(`SELECT ${projections[kind]} FROM ${kind} WHERE id = $1`, [id])).rows[0];
      }
      // One UPDATE prevents concurrent requests from overwriting unrelated fields.
      return (await query(`UPDATE ${kind} SET ${assignments.join(', ')} WHERE id = $1 RETURNING ${projections[kind]}`, values)).rows[0];
    },
    async remove(kind, id) {
      assertKind(kind);
      return (await query(`DELETE FROM ${kind} WHERE id = $1 RETURNING id`, [id])).rows.length > 0;
    },
  };
}
module.exports = { createStore };
