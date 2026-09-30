CREATE TABLE todos (
  id text PRIMARY KEY,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  category text NOT NULL DEFAULT 'General' CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id text PRIMARY KEY,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  content text NOT NULL DEFAULT '' CHECK (length(content) <= 20000),
  color text NOT NULL DEFAULT '#fef3c7' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  category text NOT NULL DEFAULT 'General' CHECK (length(btrim(category)) BETWEEN 1 AND 100),
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX todos_created_at_idx ON todos (created_at DESC, id);
CREATE INDEX notes_pinned_created_at_idx ON notes (is_pinned DESC, created_at DESC, id);
