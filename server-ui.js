require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { customAlphabet } = require('nanoid');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;



// Pool for Neon database (for UI)
const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  long_url TEXT NOT NULL,
  short_code VARCHAR(255) NOT NULL UNIQUE
);
`;



// Initialize Neon DB
neonPool.connect(async (err, client, done) => {
  if (err) {
    console.error('Neon database connection error', err.stack);
    return;
  }
  console.log('Connected to Neon database');
  try {
    await client.query(createTableQuery);
    console.log('Table "urls" is ready in Neon database.');
  } catch (e) {
    console.error('Could not create table in Neon database', e.stack);
  } finally {
    done();
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "*"],
      },
    },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/shorten', limiter);

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

app.post('/api/shorten', async (req, res, next) => {
  const { long_url } = req.body;
  const shortCode =  nanoid();

  try {
    const result = await neonPool.query(
      'INSERT INTO urls (long_url, short_code) VALUES ($1, $2) RETURNING *',
      [long_url, shortCode]
    );
    res.json({ short_code: result.rows[0].short_code });
  } catch (err) {
    next(err);
  }
});



app.get('/recent', async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        const result = await neonPool.query('SELECT * FROM urls ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const totalResult = await neonPool.query('SELECT COUNT(*) FROM urls');
        const total = parseInt(totalResult.rows[0].count, 10);
        res.json({
            rows: result.rows,
            total,
            page,
            limit
        });
    } catch (err) {
        next(err);
    }
});

app.delete('/urls/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        await neonPool.query('DELETE FROM urls WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

app.put('/urls/:id', async (req, res, next) => {
    const { id } = req.params;
    const { long_url } = req.body;
    try {
        const result = await neonPool.query(
            'UPDATE urls SET long_url = $1 WHERE id = $2 RETURNING *',
            [long_url, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.get('/site-info', async (req, res, next) => {
    const axios = require('axios');
    const cheerio = require('cheerio');
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        let title = 'N/A';
        let favicon = '';

        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 5000
            });
            const $ = cheerio.load(data);

            title = $('title').text() || $('meta[property="og:title"]').attr('content') || new URL(url).hostname;

            let faviconHref = $('link[rel="shortcut icon"]').attr('href') ||
                              $('link[rel="icon"]').attr('href') ||
                              $('link[rel="apple-touch-icon"]').attr('href');

            if (faviconHref) {
                favicon = new URL(faviconHref, url).href;
            } else {
                favicon = new URL('/favicon.ico', url).href;
            }
        } catch (error) {
            console.error(`Error fetching site info for ${url}:`, error.message);
            try {
                const urlObject = new URL(url);
                title = urlObject.hostname;
                favicon = new URL('/favicon.ico', url).href;
            } catch (e) {
                return res.json({ title: 'Invalid URL', favicon: '' });
            }
        }

        try {
            await axios.head(favicon, { timeout: 2000 });
        } catch (e) {
            favicon = '';
        }

        res.json({ title, favicon });
    } catch (err) {
        next(err);
    }
});

app.get('/:shortCode', async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    const result = await neonPool.query('SELECT long_url FROM urls WHERE short_code = $1', [
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
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).send(isProduction ? 'Server error' : err.stack);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});