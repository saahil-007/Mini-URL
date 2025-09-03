
const axios = require('axios');

const longUrl = process.argv[2];

if (!longUrl) {
  console.error('Please provide a URL to shorten.');
  process.exit(1);
}

axios.post('http://localhost:3001/shorten', {
  long_url: longUrl
})
.then(response => {
  const fullShortUrl = `http://localhost:3001/${response.data.short_code}`;
  console.log(`Shortened URL: ${fullShortUrl}`);
})
.catch(error => {
  console.error('Error shortening URL:');
  if (error.response) {
    console.error(error.response.data);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});