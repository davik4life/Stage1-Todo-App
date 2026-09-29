import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import AddNote from './components/AddNote';
import NotesList from './components/NotesList';

const API_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API_URL, timeout: 15000 });

function App() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'notes'
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state for todos
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [todosRes, notesRes] = await Promise.all([
        api.get(`/todos`),
        api.get(`/notes`)
      ]);
      setTodos(todosRes.data);
      setNotes(notesRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Unable to load your workspace. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Serialize mutations to avoid duplicate submissions and out-of-order responses.
  const mutationInFlight = useRef(false);
  const [saving, setSaving] = useState(false);
  const mutate = async (operation) => {
    if (mutationInFlight.current) return false;
    mutationInFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      await operation();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Change could not be saved. Please retry.');
      return false;
    } finally {
      mutationInFlight.current = false;
      setSaving(false);
    }
  };

  const addTodo = data => mutate(async () => {
    const res = await api.post('/todos', data);
    setTodos(prev => [res.data, ...prev]);
  });
  const toggleTodo = id => mutate(async () => {
    const target = todos.find(todo => todo.id === id);
    if (!target) return;
    const res = await api.put(`/todos/${id}`, { completed: !target.completed });
    setTodos(prev => prev.map(todo => todo.id === id ? res.data : todo));
  });
  const deleteTodo = id => mutate(async () => {
    await api.delete(`/todos/${id}`);
    setTodos(prev => prev.filter(todo => todo.id !== id));
  });
  const addNote = data => mutate(async () => {
    const res = await api.post('/notes', data);
    setNotes(prev => [res.data, ...prev].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)));
  });
  const togglePinNote = (id, isPinned) => mutate(async () => {
    const res = await api.put(`/notes/${id}`, { isPinned });
    setNotes(prev => prev.map(note => note.id === id ? res.data : note)
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned)));
  });
  const deleteNote = id => mutate(async () => {
    await api.delete(`/notes/${id}`);
    setNotes(prev => prev.filter(note => note.id !== id));
  });

  // Filtered Todos
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Status filter
      if (statusFilter === 'active' && todo.completed) return false;
      if (statusFilter === 'completed' && !todo.completed) return false;

      // Priority filter
      if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(query);
        const matchesCategory = todo.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      return true;
    });
  }, [todos, statusFilter, priorityFilter, searchQuery]);

  return (
    <div className="app-wrapper">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-badge">✨ Productive Workspace</div>
          <h1 className="app-title">TaskFlow & Notes</h1>
          <p className="app-tagline">
            Organize tasks, capture ideas, and elevate your daily productivity.
          </p>
        </header>

        {error && <div className="error-banner" role="alert">{error} <button type="button" disabled={saving || loading} onClick={fetchData}>Retry loading</button></div>}

        {/* View Switcher Tabs */}
        <div className="main-tabs">
          <button
            className={`main-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            ✅ Tasks ({todos.filter((t) => !t.completed).length} active)
          </button>
          <button
            className={`main-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            📝 Notes & Scratchpad ({notes.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your workspace...</p>
          </div>
        ) : activeTab === 'tasks' ? (
          <fieldset disabled={saving} className="workspace-section tasks-section" aria-busy={saving}>
            <StatsBar todos={todos} />
            <AddTodo onAdd={addTodo} />
            <FilterBar
              filter={statusFilter}
              setFilter={setStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
            />
            <TodoList
              todos={filteredTodos}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          </fieldset>
        ) : (
          <fieldset disabled={saving} className="workspace-section notes-section" aria-busy={saving}>
            <AddNote onAdd={addNote} />
            <NotesList
              notes={notes}
              onTogglePin={togglePinNote}
              onDelete={deleteNote}
            />
          </fieldset>
        )}

        {/* App Footer */}
        <footer className="app-footer">
          <span>Proudly HNG 15 Todo App by Victor Adeshile</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
