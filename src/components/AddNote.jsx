import React, { useState } from 'react';

const COLOR_PALETTE = [
  { name: 'Soft Yellow', value: '#fef3c7', border: '#fcd34d' },
  { name: 'Soft Blue', value: '#e0f2fe', border: '#bae6fd' },
  { name: 'Soft Green', value: '#dcfce7', border: '#bbf7d0' },
  { name: 'Soft Purple', value: '#f3e8ff', border: '#e9d5ff' },
  { name: 'Soft Rose', value: '#ffe4e6', border: '#fecdd3' }
];

function AddNote({ onAdd }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Ideas');
  const [color, setColor] = useState('#fef3c7');
  const [isPinned, setIsPinned] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const saved = await onAdd({
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      color,
      isPinned
    });

    if (!saved) return;
    setTitle('');
    setContent('');
    setIsOpen(false);
  };

  return (
    <div className="add-note-container">
      {!isOpen ? (
        <button className="new-note-trigger" onClick={() => setIsOpen(true)}>
          <span className="plus-icon">+</span> Take a new note or scratchpad idea...
        </button>
      ) : (
        <form className="add-note-form" onSubmit={handleSubmit} style={{ backgroundColor: color }}>
          <div className="note-form-header">
            <input
              type="text"
              placeholder="Note Title..."
              maxLength={200}
          aria-label="Title"
          value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="note-title-input"
              autoFocus
            />
            <button
              type="button"
              className={`pin-btn ${isPinned ? 'pinned' : ''}`}
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin note' : 'Pin note to top'}
            >
              📌
            </button>
          </div>

          <textarea
            placeholder="Write down your thoughts, markdown notes, or checklist..."
            maxLength={20000}
            aria-label="Note content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="note-content-textarea"
            rows="3"
          />

          <div className="note-form-footer">
            <div className="color-picker">
              {COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  className={`color-dot ${color === c.value ? 'selected' : ''}`}
                  style={{ backgroundColor: c.value, borderColor: c.border }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="note-category-select"
            >
              <option value="Ideas">💡 Ideas</option>
              <option value="Work">💼 Work</option>
              <option value="Dev">💻 Dev</option>
              <option value="Personal">👤 Personal</option>
              <option value="Reference">📚 Reference</option>
            </select>

            <div className="note-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="save-note-btn">
                Save Note
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default AddNote;
