import React, { useState } from 'react';

function AddTodo({ onAdd }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const saved = await onAdd({
      title: title.trim(),
      priority,
      category,
      dueDate: dueDate || null
    });
    if (!saved) return;
    setTitle('');
    setDueDate('');
    setIsExpanded(false);
  };

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          placeholder="What needs to be accomplished today?"
          maxLength={200}
          aria-label="Title"
          value={title}
          onFocus={() => setIsExpanded(true)}
          onChange={(e) => setTitle(e.target.value)}
          className="add-todo-input"
        />
        <button type="submit" className="add-todo-button">
          + Add Task
        </button>
      </div>

      {isExpanded && (
        <div className="todo-options-row">
          <div className="option-field">
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="select-input"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          <div className="option-field">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select-input"
            >
              <option value="General">🏷️ General</option>
              <option value="Work">💼 Work</option>
              <option value="Personal">👤 Personal</option>
              <option value="Dev">💻 Dev</option>
              <option value="Urgent">⚡ Urgent</option>
            </select>
          </div>

          <div className="option-field">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      )}
    </form>
  );
}

export default AddTodo;
