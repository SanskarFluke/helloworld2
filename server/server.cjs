// ─── Imports ─────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
require('dotenv').config();

// ─── App Setup ───────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.text());
app.use(express.json());

// ─── SSH Key Generation ─────────────────────────────────
const sshDir = path.join(os.homedir(), '.ssh');
const privateKeyPath = path.join(sshDir, 'id_rsa');

if (!fs.existsSync(privateKeyPath)) {
  console.log('[SSH] Key not found. Generating...');
  exec(`ssh-keygen -t rsa -b 4096 -f "${privateKeyPath}" -N "" -q`, (err) => {
    if (err) {
      console.error('[SSH] ❌ Error generating SSH key:', err);
    } else {
      console.log('[SSH] ✅ SSH key generated successfully.');
    }
  });
} else {
  console.log('[SSH] 🟡 Key already exists. Skipping generation.');
}

// ─── Routes ──────────────────────────────────────────────

// Root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Upload public key
app.post('/upload-key', (req, res) => {
  const key = req.body.trim();
  fs.appendFileSync(`${os.homedir()}/.ssh/authorized_keys`, key + '\n');
  res.send('Public key added.');
});

// Serve static files from /public
app.use('/files', express.static(path.join(__dirname, 'public')));

// User routes
const userRoutes = require('./routes/users');
app.use('/', userRoutes);

// ─── Start Server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
