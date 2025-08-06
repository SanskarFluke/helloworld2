const sqlite3 = require('sqlite3').verbose();
const isOnline = require('is-online');
const axios = require('axios');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

// Save data offline
function queueData(type, payload) {
  const jsonPayload = JSON.stringify(payload);
  db.run(
    `INSERT INTO sync_queue (type, payload) VALUES (?, ?)`,
    [type, jsonPayload],
    (err) => {
      if (err) console.error('Failed to queue data:', err);
    }
  );
}

// Periodically sync
async function syncData() {
  const online = await isOnline();
  if (!online) return;

  db.all(`SELECT * FROM sync_queue ORDER BY created_at ASC`, async (err, rows) => {
    if (err) return console.error('Fetch sync_queue failed', err);

    for (const row of rows) {
      const data = JSON.parse(row.payload);
      try {
        if (row.type === 'user_hierarchy') {
          const response = await axios.post('http://localhost:3002/save-user-hierarchy', data);
          if (response.status === 200) {
            db.run(`DELETE FROM sync_queue WHERE id = ?`, [row.id]);
          }
        }

        if (row.type === 'login') {
          const response = await axios.post('http://localhost:3002/login', data);
          if (response.status === 200) {
            db.run(`DELETE FROM sync_queue WHERE id = ?`, [row.id]);
          }
        }

      } catch (err) {
        console.error(`Sync failed for row ${row.id}:`, err.message);
      }
    }
  });
}

setInterval(syncData, 10000); // every 10 seconds

module.exports = { queueData };
