// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');

const User = require('../models/User');

// Signup Endpoint
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, firstname, lastname, password } = req.body;

  // Basic validation
  if (!username || !firstname || !lastname || !password) {
    return res.status(400).json({ error: "Please provide all required fields" });
  }

  try {
    // Check if the username already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const salt          = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    user = new User({ username, firstname, lastname, password: hashedPassword });
    await user.save();

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login Endpoint
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: "Please provide username and password" });
  }

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // For simplicity, we are not implementing JWT here.
    // In a production app, consider returning a signed token.
    res.json({
      message: "Login successful",
      user: {
        username:  user.username,
        firstname: user.firstname,
        lastname:  user.lastname
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;




