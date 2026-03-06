import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('flotte.db');

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/storage/:key', (req, res) => {
    try {
      const stmt = db.prepare('SELECT value FROM kv_store WHERE key = ?');
      const row = stmt.get(req.params.key) as { value: string } | undefined;
      res.json(row ? { value: row.value } : null);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/storage/:key', (req, res) => {
    try {
      const stmt = db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)');
      stmt.run(req.params.key, req.body.value);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete('/api/storage/:key', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM kv_store WHERE key = ?');
      stmt.run(req.params.key);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Backup endpoint
  app.get('/api/backup', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM kv_store');
      const rows = stmt.all();
      res.setHeader('Content-Disposition', 'attachment; filename="flotte_backup.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Backup failed' });
    }
  });

  // Restore endpoint
  app.post('/api/restore', (req, res) => {
    try {
      const data = req.body; // Expecting array of {key, value}
      if (!Array.isArray(data)) throw new Error("Invalid format");

      const insert = db.prepare('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)');
      const insertMany = db.transaction((rows) => {
        for (const row of rows) insert.run(row.key, row.value);
      });

      insertMany(data);
      res.json({ success: true, count: data.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Restore failed' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
