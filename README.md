# URL Shortener

This project is a URL shortener service that can be used in two ways: through a command-line interface (CLI) and a web interface. It allows you to take a long URL and create a shorter, easy-to-share link.

## Features

- **URL Shortening:** Converts long URLs into short codes.
- **Redirection:** Shortened URLs redirect to the original long URL.
- **Dual Interface:** Usable via both a CLI and a web-based UI.
- **Separate Databases:** Uses a local PostgreSQL database for the CLI and a Neon serverless PostgreSQL database for the UI, ensuring a robust and scalable architecture.

## Project Structure

The project is organized into the following key files:

- `shorten-cli.js`: The command-line interface for shortening URLs.
- `server-ui.js`: The server for the web-based user interface.
- `server-cli.js`: The server that handles requests from the CLI.
- `public/`: The directory containing the frontend files for the web interface.
- `package.json`: The file that manages the project's dependencies and scripts.
- `.env`: The configuration file for environment variables.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (which includes npm)
- [PostgreSQL](https://www.postgresql.org/download/)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/url-shortener.git
   cd url-shortener
   ```

2. **Install the dependencies:**

   ```bash
   npm install
   ```

3. **Set up the databases:**

   - **Local Database (for the CLI):**
     - Create a PostgreSQL database named `url_shortener_db`.
     - Create a `.env.local` file in the root of the project and add your local database connection string:
       ```
       LOCAL_DATABASE_URL="postgresql://your_username:your_password@localhost:5432/url_shortener_db"
       ```

   - **Neon Database (for the UI):**
     - Create a free serverless PostgreSQL database with [Neon](https://neon.tech/).
     - Create a `.env` file in the root of the project and add your Neon database connection string:
       ```
       NEON_DATABASE_URL="postgresql://your_username:your_password@your_neon_host:5432/your_database_name"
       ```

4. **Initialize the databases:**

   - Connect to both your local and Neon databases and run the following SQL command to create the `urls` table:
     ```sql
     CREATE TABLE urls (
       id SERIAL PRIMARY KEY,
       short_code VARCHAR(255) NOT NULL UNIQUE,
       long_url TEXT NOT NULL
     );
     ```

## Running the Application

To run both the UI and CLI servers simultaneously, use the following command:

```bash
npm run dev:both
```

This will start:
- The UI server on `http://localhost:3000`.
- The CLI server on `http://localhost:3001`.

## How to Use

### Web Interface

1. Open your web browser and navigate to `http://localhost:3000`.
2. Paste your long URL into the input field and click the "Shorten" button.
3. The shortened URL will be displayed below the input field.

### Command-Line Interface

1. Open your terminal.
2. To shorten a URL, use the following command, replacing `your_long_url` with the URL you want to shorten:

   ```bash
   node shorten-cli.js your_long_url
   ```

   For example:
   ```bash
   node shorten-cli.js https://www.google.com
   ```

3. The shortened URL will be printed to the console.

## Scripts

The `package.json` file includes the following scripts:

- `npm start`: Starts the UI server.
- `npm run dev`: Starts the UI server with `nodemon`, which automatically restarts the server on file changes.
- `npm run dev:cli`: Starts the CLI server with `nodemon`.
- `npm run dev:both`: Runs both the `dev` and `dev:cli` scripts concurrently.

---

Thank you for using the URL Shortener! If you have any questions or feedback, please feel free to contribute to the project.