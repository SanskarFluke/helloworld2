CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- e.g. 'login', 'user_hierarchy'
  payload TEXT NOT NULL, -- JSON string of data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
