# URL Shortener

This is a simple URL shortener application that can be run with a web interface or from the command line.

## Prerequisites

- Node.js
- npm
- PostgreSQL

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd URL_Shortner
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up the database:**

    -   Create a PostgreSQL database.
    -   Execute the `DB.sql` script to create the necessary table:

        ```bash
        psql -U your_username -d your_database -f DB.sql
        ```

4.  **Configure environment variables:**

    -   Create a `.env` file in the root of the project and add the following, replacing the placeholder values with your database credentials:

        ```
        DB_USER=your_postgres_username
        DB_HOST=localhost
        DB_DATABASE=your_database_name
        DB_PASSWORD=your_postgres_password
        DB_PORT=5432
        ```

## Running the Application

### With the Web Interface

1.  **Start the server:**

    ```bash
    npm start
    ```

2.  Open your browser and navigate to `http://localhost:3000`.

### From the Command Line

The recommended way to shorten URLs from the command line is to use the `shorten-cli.js` script.

**1. Shorten a URL:**

Use the following command, replacing `"your_long_url"` with the URL you want to shorten:

```bash
node shorten-cli.js "your_long_url"
```

**Example:**

```bash
node shorten-cli.js "https://www.google.com/search?q=cute+cats&tbm=isch"
```

The script will output the shortened URL:

```
Shortened URL: http://localhost:3000/xxxxxxx
```

**2. Get recent URLs:**

You can use `curl` to get a list of recent URLs:

```bash
curl http://localhost:3000/recent?all=true
```

<details>
<summary>Advanced: Using cURL</summary>

If you prefer to use `curl` directly, the syntax can vary depending on your terminal.

-   **Shorten a URL:**

    -   **For Windows Command Prompt (cmd.exe):**

        ```bash
        curl -X POST -H "Content-Type: application/json" -d "{\"long_url\":\"https://www.example.com\"}" http://localhost:3000/shorten
        ```

    -   **For Windows PowerShell:**

        ```powershell
        curl -X POST -H "Content-Type: application/json" -d '{"long_url":"https://www.example.com"}' http://localhost:3000/shorten
        ```

        If your URL contains special characters like `&`, you should wrap the entire URL in single quotes:

        ```powershell
        curl -X POST -H "Content-Type: application/json" -d '{"long_url":"https://www.example.com/page?name=test&value=123"}' http://localhost:3000/shorten
        ```

    -   **For Git Bash or other Unix-like shells (Linux, macOS):**

        ```bash
        curl -X POST -H 'Content-Type: application/json' -d '{"long_url":"https://www.example.com"}' http://localhost:3000/shorten
        ```

    The response will contain the shortened URL:

    ```json
    {
        "shortUrl": "xxxxxxx"
    }
    ```
</details>