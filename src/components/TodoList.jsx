import React from 'react';

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🎉</span>
        <h3>No tasks found</h3>
        <p>You're all clear! Add a new task above or adjust your search filters.</p>
      </div>
    );
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isOverdue = dateStr < today;
    const isToday = dateStr === today;

    let badgeClass = 'due-badge';
    let text = dateStr;

    if (isToday) {
      badgeClass += ' due-today';
      text = '📅 Today';
    } else if (isOverdue) {
      badgeClass += ' due-overdue';
      text = `⚠️ Overdue (${dateStr})`;
    } else {
      text = `📅 ${dateStr}`;
    }

    return <span className={badgeClass}>{text}</span>;
  };

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority || 'medium'}`}
        >
          <label className="todo-label">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
              className="todo-checkbox"
            />
            <div className="todo-content">
              <span className="todo-text">{todo.title}</span>
              <div className="todo-meta">
                <span className={`priority-tag priority-${todo.priority || 'medium'}`}>
                  {todo.priority ? todo.priority.toUpperCase() : 'MEDIUM'}
                </span>
                {todo.category && (
                  <span className="category-tag">
                    🏷️ {todo.category}
                  </span>
                )}
                {!todo.completed && formatDueDate(todo.dueDate)}
              </div>
            </div>
          </label>
          <button
            onClick={() => onDelete(todo.id)}
            className="delete-button"
            title="Delete task"
            aria-label="Delete todo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TodoList;
