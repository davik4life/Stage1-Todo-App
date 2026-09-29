import React from 'react';

function NotesList({ notes, onTogglePin, onDelete }) {
  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📝</span>
        <h3>No notes yet</h3>
        <p>Jot down your first idea, meeting note, or quick reference above.</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`note-card ${note.isPinned ? 'is-pinned' : ''}`}
          style={{ backgroundColor: note.color || '#fef3c7' }}
        >
          <div className="note-card-header">
            <div className="note-card-title-row">
              <h4 className="note-card-title">{note.title}</h4>
              <button
                className={`note-pin-icon ${note.isPinned ? 'active' : ''}`}
                onClick={() => onTogglePin(note.id, !note.isPinned)}
                title={note.isPinned ? 'Unpin' : 'Pin note'}
              >
                📌
              </button>
            </div>
            {note.category && (
              <span className="note-category-chip">{note.category}</span>
            )}
          </div>

          <p className="note-card-body">{note.content}</p>

          <div className="note-card-footer">
            <span className="note-date">{formatDate(note.updatedAt || note.createdAt)}</span>
            <button
              onClick={() => onDelete(note.id)}
              className="note-delete-btn"
              title="Delete note"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotesList;
