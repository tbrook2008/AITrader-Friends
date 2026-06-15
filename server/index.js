require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const Alpaca = require('@alpacahq/alpaca-trade-api');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, '../data/friends.sqlite'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    alpaca_key TEXT,
    alpaca_secret TEXT,
    is_active BOOLEAN DEFAULT 1
  )`);
});

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

// Internal Webhook from Master AI Trader
app.post('/api/internal/signal', async (req, res) => {
  // Security: You might want to add an internal IP check or basic auth token here
  const { symbol, direction, price, qty, trailPrice, targetPrice, isTrending } = req.body;
  
  console.log(`[WEBHOOK] Received signal from Master: ${direction} ${symbol} @ ${price}`);
  
  db.all(`SELECT alpaca_key, alpaca_secret FROM users WHERE is_active = 1`, [], async (err, users) => {
    if (err) return res.status(500).send('DB Error');
    
    // Execute trades asynchronously for all friends
    const promises = users.map(async (user) => {
      if (!user.alpaca_key || !user.alpaca_secret) return;
      
      const alpaca = new Alpaca({
        keyId: user.alpaca_key,
        secretKey: user.alpaca_secret,
        paper: true
      });
      
      try {
        const account = await alpaca.getAccount();
        // Simple sizing: 5% of buying power (this can be replaced with full Kelly logic later)
        const positionDollars = parseFloat(account.buying_power) * 0.05;
        const calculatedQty = Math.max(1, Math.floor(positionDollars / price));
        
        await alpaca.createOrder({
          symbol,
          qty: calculatedQty,
          side: direction === 'LONG' ? 'buy' : 'sell',
          type: 'market',
          time_in_force: 'gtc'
        });
        
        console.log(`Successfully executed ${direction} ${symbol} for user (Key: ${user.alpaca_key.substring(0, 4)}...)`);
      } catch (e) {
        console.error(`Failed to execute for user: ${e.message}`);
      }
    });
    
    await Promise.allSettled(promises);
    res.json({ status: 'Broadcast complete', usersHit: users.length });
  });
});

// Basic API endpoints for dashboard (Auth & Settings)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, hash], function(err) {
    if (err) return res.status(400).json({ error: 'Username taken' });
    res.json({ success: true });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  });
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[AI Trader - Execution Node] Listening on port ${PORT}`);
});
