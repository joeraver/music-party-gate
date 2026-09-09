const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxies (Cloudflare Tunnel, Nginx, Caddy, AWS ALB/App Runner)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const DEFAULT_QUESTIONS_FILE = path.join(DATA_DIR, 'default_questions.json');

// Helper to safely read JSON
function readJson(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to safely write JSON
function writeJson(filePath, data) {
  try {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Ensure data files exist on startup (useful when mounting empty Docker volumes)
function initDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Seed questions if missing or empty
  if (!fs.existsSync(QUESTIONS_FILE) || readJson(QUESTIONS_FILE, []).length === 0) {
    const defaults = readJson(DEFAULT_QUESTIONS_FILE, []);
    if (defaults.length > 0) {
      writeJson(QUESTIONS_FILE, defaults);
      console.log('📦 Initialized questions.json from default questions bank.');
    }
  }

  // Seed config if missing
  if (!fs.existsSync(CONFIG_FILE)) {
    writeJson(CONFIG_FILE, {
      theme: 'halloween',
      partyTitle: 'Spooky Beats Halloween Bash 🎃',
      partySubtitle: "Answer the crypt's trivia riddle to unlock the jukebox!",
      partyUrl: 'https://home.raverendo.com/#/party',
      rewards: { boosts: 1, requests: 2 },
      redirectDelay: 4,
      adminPassword: 'party'
    });
    console.log('📦 Initialized default config.json.');
  }
}

initDataFiles();

// Load current configuration
function getConfig() {
  const cfg = readJson(CONFIG_FILE, {
    theme: 'halloween',
    partyTitle: 'Spooky Beats Halloween Bash 🎃',
    partySubtitle: "Answer the crypt's trivia riddle to unlock the jukebox!",
    partyUrl: 'https://home.raverendo.com/#/party',
    rewards: { boosts: 1, requests: 2 },
    redirectDelay: 4,
    adminPassword: 'party'
  });

  // Allow environment variables to override
  if (process.env.PARTY_URL) {
    cfg.partyUrl = process.env.PARTY_URL;
  }
  if (process.env.ADMIN_PASSWORD) {
    cfg.adminPassword = process.env.ADMIN_PASSWORD;
  }
  if (process.env.THEME) {
    cfg.theme = process.env.THEME;
  }
  return cfg;
}

// Fisher-Yates shuffle helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Health check endpoint for AWS ALB / App Runner
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Config Endpoint (does not expose admin password)
app.get('/api/config', (req, res) => {
  const cfg = getConfig();
  res.json({
    theme: cfg.theme || 'halloween',
    partyTitle: cfg.partyTitle || 'Spooky Beats Halloween Bash 🎃',
    partySubtitle: cfg.partySubtitle || "Answer the crypt's trivia riddle to unlock the jukebox!",
    rewards: cfg.rewards || { boosts: 1, requests: 2 },
    redirectDelay: cfg.redirectDelay || 4,
    hasPartyUrl: Boolean(cfg.partyUrl),
    availableThemes: cfg.availableThemes || []
  });
});

// Random Question Endpoint (strips answer and explanation for anti-cheat)
app.get('/api/quiz/random', (req, res) => {
  const questions = readJson(QUESTIONS_FILE, []);
  if (!questions.length) {
    return res.status(500).json({ error: 'No questions available in question bank' });
  }

  const excludeIds = (req.query.exclude || '').split(',').filter(Boolean);
  let available = questions.filter(q => !excludeIds.includes(q.id));
  if (!available.length) {
    available = questions; // reset if all excluded
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const q = available[randomIndex];

  res.json({
    id: q.id,
    question: q.question,
    options: shuffleArray(q.options),
    category: q.category || 'Trivia'
  });
});

// Server-Side Verification Endpoint
app.post('/api/quiz/verify', (req, res) => {
  const { questionId, selectedAnswer } = req.body;
  if (!questionId || !selectedAnswer) {
    return res.status(400).json({ error: 'Missing questionId or selectedAnswer' });
  }

  const questions = readJson(QUESTIONS_FILE, []);
  const question = questions.find(q => q.id === questionId);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const isCorrect = String(question.answer).trim().toLowerCase() === String(selectedAnswer).trim().toLowerCase();

  if (isCorrect) {
    const cfg = getConfig();
    return res.json({
      success: true,
      redirectUrl: cfg.partyUrl || 'https://home.raverendo.com/#/party',
      correctAnswer: question.answer,
      explanation: question.explanation || 'Great job!',
      rewards: cfg.rewards || { boosts: 1, requests: 2 },
      redirectDelay: cfg.redirectDelay || 4
    });
  } else {
    return res.json({
      success: false,
      message: 'Not quite right! The spirits demand another attempt.'
    });
  }
});

// Admin Authentication Middleware
function checkAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const password = req.headers['x-admin-password'] || (authHeader && authHeader.replace('Bearer ', ''));
  const cfg = getConfig();

  if (!password || password !== cfg.adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid host password' });
  }
  next();
}

// Admin Verify Password
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const cfg = getConfig();
  if (password && password === cfg.adminPassword) {
    return res.json({ success: true, message: 'Authenticated successfully' });
  }
  return res.status(401).json({ success: false, message: 'Invalid password' });
});

// Admin Get Full Config
app.get('/api/admin/config', checkAdminAuth, (req, res) => {
  const cfg = getConfig();
  res.json(cfg);
});

// Admin Update Config
app.post('/api/admin/config', checkAdminAuth, (req, res) => {
  const current = getConfig();
  const updated = { ...current, ...req.body };
  if (writeJson(CONFIG_FILE, updated)) {
    return res.json({ success: true, config: updated });
  }
  return res.status(500).json({ error: 'Failed to save configuration' });
});

// Admin Get All Questions
app.get('/api/admin/questions', checkAdminAuth, (req, res) => {
  const questions = readJson(QUESTIONS_FILE, []);
  res.json(questions);
});

// Admin Save All Questions
app.post('/api/admin/questions', checkAdminAuth, (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ error: 'Questions must be an array' });
  }
  if (writeJson(QUESTIONS_FILE, questions)) {
    return res.json({ success: true, count: questions.length });
  }
  return res.status(500).json({ error: 'Failed to save questions' });
});

// Admin Reset Default Questions
app.post('/api/admin/questions/reset', checkAdminAuth, (req, res) => {
  const defaults = readJson(DEFAULT_QUESTIONS_FILE, []);
  if (!defaults.length) {
    return res.status(500).json({ error: 'Default questions file not found' });
  }
  if (writeJson(QUESTIONS_FILE, defaults)) {
    return res.json({ success: true, count: defaults.length });
  }
  return res.status(500).json({ error: 'Failed to reset questions' });
});

// Serve frontend in production or if dist exists
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Music Party Gatekeeper Server Running!       `);
  console.log(`  Local URL:  http://localhost:${PORT}        `);
  console.log(`  Target URL: ${getConfig().partyUrl}          `);
  console.log(`  Theme:      ${getConfig().theme}             `);
  console.log(`===============================================`);
});
