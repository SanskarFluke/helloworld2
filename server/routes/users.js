const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const saveUserHierarchy = require('../services/saveUserHierarchy');


router.get('/fetchusers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('DB error');
  }
});


router.post('/register', async (req, res) => {
  console.log('Received registration data:', req.body);

  const {
    first_name,
    last_name,
    company_name,
    email,
    password,
    job_role,
    address1,
    address2,
    city,
    state,
    phone,
    country,
    postal_code,
    agree_terms,
    agree_marketing,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO users (
        first_name, last_name, company_name, email, password, job_role,
        address1, address2, city, state, phone, country, postal_code,
        agree_terms, agree_marketing
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        first_name,
        last_name,
        company_name,
        email,
        password,
        job_role,
        address1,
        address2,
        city,
        state,
        phone,
        country,
        postal_code,
        agree_terms,
        agree_marketing,
      ]
    );

    console.log('✅ User inserted successfully');
    res.status(200).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('❌ DB Insert Error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found with this email.' });
    }

    const user = userResult.rows[0];

    // 2. Match password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // 3. Login success
    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/api/save-hierarchy', async (req, res) => {
  try {
    await saveUserHierarchy(req.body);
    res.status(200).send('Hierarchy saved');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving hierarchy');
  }
});




module.exports = router;
