
require('dotenv').config();
const express = require('express');
const { customAlphabet } = require('nanoid');
const { Pool } = require('pg');

const app = express();
const port = 3001; // Different port for CLI server

// Pool for local database (for CLI)
const localPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  long_url TEXT NOT NULL,
  short_code VARCHAR(255) NOT NULL UNIQUE
);
`;

// Initialize local DB
localPool.connect(async (err, client, done) => {
  if (err) {
    console.error('Local database connection error', err.stack);
    return;
  }
  console.log('Connected to local database for CLI');
  try {
    await client.query(createTableQuery);
    console.log('Table "urls" is ready in local database for CLI.');
  } catch (e) {
    console.error('Could not create table in local database for CLI', e.stack);
  } finally {
    done();
  }
});

app.use(express.json());

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

app.post('/shorten', async (req, res, next) => {
  const { long_url } = req.body;
  const shortCode = nanoid();

  try {
    const result = await localPool.query(
      'INSERT INTO urls (long_url, short_code) VALUES ($1, $2) RETURNING *',
      [long_url, shortCode]
    );
    res.json({ short_code: result.rows[0].short_code });
  } catch (err) {
    next(err);
  }
});

app.get('/:shortCode', async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    const result = await localPool.query('SELECT long_url FROM urls WHERE short_code = $1', [
      shortCode,
    ]);

    if (result.rows.length > 0) {
      res.redirect(result.rows[0].long_url);
    } else {
      res.status(404).send('URL not found');
    }
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error');
});

app.listen(port, () => {
  console.log(`CLI server is running on http://localhost:${port}`);
});