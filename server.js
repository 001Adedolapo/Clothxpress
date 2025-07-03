// server.js
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');  // Use bcryptjs for easier install on Windows

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// ✅ MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Benny12345@', // <-- Your MySQL password
  database: 'clothxpress_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

// ✅ TEST route (to confirm server is working)
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// ✅ REGISTER route
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Register attempt:', username, email);

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email, and password.' });
  }

  try {
    // Check for existing user
    const checkQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(checkQuery, [username, email], async (err, results) => {
      if (err) {
        console.error('❌ Database check error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, email, hashedPassword], (err) => {
        if (err) {
          console.error('❌ Error saving user:', err);
          return res.status(500).json({ message: 'Failed to register user' });
        }

        console.log('✅ Registered:', username);
        return res.status(201).json({ message: 'User registered successfully' });
      });
    });
  } catch (error) {
    console.error('❌ Error in register route:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ LOGIN route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username);

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  const userQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(userQuery, [username], async (err, results) => {
    if (err) {
      console.error('❌ DB query error (login):', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      console.log('✅ Login successful for:', username);
      return res.status(200).json({
        message: 'Login successful',
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError);
      return res.status(500).json({ message: 'Server error' });
    }
  });
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
