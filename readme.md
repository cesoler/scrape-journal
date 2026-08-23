# Scrape Journal API

This project is a Node.js API built with TypeScript, Express, and Puppeteer. Its primary function is to scrape news articles from `globo.com` by dynamically running a headless Chromium browser to parse content.

A core feature of this project is its two-pronged approach to data fetching, allowing scraping from either the main public page or an internal AI suggestions endpoint. The entire architecture is designed to operate within a memory-constrained (512MB) environment, with explicit controls for synchronous and asynchronous processing.

## Core Stack

* **Runtime:** Node.js v20
* **Framework:** Express.js
* **Language:** TypeScript
* **Web Scraping:** Puppeteer
* **Database:** PostgreSQL 16 with TypeORM
* **Containerization:** Docker (with multi-stage builds), docker-compose

---

## Architectural Highlight: Sequential (Sync) vs. Parallel (Async) Scraping

This API is built to run in a low-memory (512MB) environment, such as a Render free tier. To manage this constraint, the scraping of article details (which involves opening new browser pages) can be controlled.

* **`sync` (Sequential):** This is the **default and recommended** mode for production. It uses a `for...of` loop to scrape one article detail page at a time. This is slower but maintains a low, stable memory footprint, preventing Out-of-Memory (OOM) crashes.
* **`async` (Parallel):** This mode uses `Promise.allSettled` to scrape all article detail pages simultaneously. It is significantly faster but uses a large amount of RAM (as it opens 10-15+ browser pages at once). This mode is suitable for local development or environments with 2GB+ of RAM.

---

## API Endpoints

### 1. Scrape from Main Page

This endpoint scrapes the list of articles directly from the public-facing `globo.com` category page.

**`GET /api/journal/scrape`**

**Query Parameters:**

| Parameter | Type | Description | Required | Default |
| :--- | :--- | :--- | :--- | :--- |
| `category` | string | Specifies the news column to scrape. Valid options: `jornalismo`, `esportes`, `entretenimento`. | **Yes** | |
| `sync` | string | Defines the scraping strategy. Valid options: `sync`, `async`. | **Yes** | `sync` |

**Example Request:**
`GET /api/journal/scrape?category=jornalismo&sync=async`

---

### 2. Scrape from AI Suggestions

This endpoint fetches a list of article recommendations from an internal API and then scrapes the details for each of those articles.

**`GET /api/journal/ai-suggestions`**

**Query Parameters:**

| Parameter | Type | Description | Required | Default |
| :--- | :--- | :--- | :--- | :--- |
| `category` | string | Specifies the category for suggestions. Valid options: `jornalismo`, `esportes`, `entretenimento`. | **Yes** | |
| `itemsPerPage`| number | The number of suggestions to retrieve. | **Yes** | 9 |

**🚨 Automatic Memory Protection:**
To prevent OOM errors, this endpoint has a built-in safeguard: **if `itemsPerPage` is greater than 9, the service will automatically force `sync` (sequential) mode**, regardless of the `sync` parameter.

**Example Request:**
`GET /api/journal/ai-suggestions?category=esportes&itemsPerPage=15`
*(This will run in `sync` mode automatically)*

---

## Responses

#### `200 OK` (Success)

Returns an array of `CompleteArticleDTO` objects.

`id` is the PostgreSQL row id, **not** an index within the response. Requesting the
same article again returns the same `id`.

**Body Example:**
```json
[
  {
    "id": 42,
    "title": "Article Title Scraped from Detail Page",
    "url": "https://g1.globo.com/...ghtml#HOME-AREA-COLUNA-JORNALISMO-user",
    "featured": true,
    "subtitle": "The article's subtitle text.",
    "createdAt": "2026-08-23",
    "canonicalUrl": "https://g1.globo.com/...ghtml",
    "imageUrl": "https://s2-g1.glbimg.com/.../img.jpg",
    "sections": ["G1", "SP", "Campinas e Região"],
    "authors": [
      { "name": "Gabriel Pitor", "url": "https://g1.globo.com/autores/gabriel-pitor" }
    ],
    "publishedAt": "2026-08-23T06:00:18.243Z",
    "modifiedAt": "2026-08-23T13:02:44.074Z"
  }
]
```

| Field | Notes |
| :--- | :--- |
| `id` | PostgreSQL row id, stable across requests |
| `url` | The url the article was found at, tracking fragment included |
| `canonicalUrl` | Normalized url, used as the dedup key |
| `createdAt` | Publication day, `YYYY-MM-DD` |
| `publishedAt` / `modifiedAt` | Full ISO timestamps read from the article's `<head>` |
| `sections` | Editorial path, e.g. `["G1", "SP", "Campinas e Região"]` |
| `authors` | One entry per credited author; `url` may be `null` |

### 400 Bad Request (Invalid Input)

This status code indicates that the request made by the client is invalid or malformed. Common reasons for a 400 Bad Request response include:

- Missing required query parameters (e.g., `category`).
- Malformed request syntax.

**Example Response:**
```json
{
    "error": "Query param \"category\" is missing or invalid.",
    "validOptions": [
        "jornalismo",
        "entretenimento",
        "esporte"
    ]
}
```

### 500 Internal Server Error
500 Internal Server Error
Returned if an unexpected error occurs during the browser automation (e.g., Puppeteer fails to launch, or a critical selector is not found).

```json
{
  "error": "An internal error occurred: Error: Navigation timeout of 35000 ms exceeded"
}
```

---

## Persistence and Deduplication

Every scrape writes to the `articles` table. Re-running the same scrape does **not**
create new rows.

**Dedup key:** `canonical_url`, a `UNIQUE` column. It is built by taking the article's
`<link rel="canonical">` (falling back to the url the article was found at) and then:

1. forcing the `https` scheme
2. lowercasing the host
3. dropping the fragment
4. dropping the query string
5. dropping the trailing slash

Steps 3 and 4 are what make the two scraping origins agree. The AI suggestions API
returns every url with a tracking fragment appended
(`...ghtml#HOME-AREA-COLUNA-JORNALISMO-user,rec-principal,<uuid>`) while the home page
returns the same article without it — without normalization the same article would be
stored twice.

**Write strategy:** a single batched
`INSERT ... ON CONFLICT (canonical_url) DO UPDATE` per request, guarded so a stored
article is only overwritten when the incoming one is newer:

```sql
WHERE articles.modified_at IS NULL
   OR EXCLUDED.modified_at IS NULL
   OR EXCLUDED.modified_at > articles.modified_at
```

`featured`, `category` and `origin` describe how the article was reached, not the
article itself, so they are overwritten by the most recent scrape.

The migration runs automatically when the server boots. A failure to reach the database
kills the process instead of leaving the API up returning 500s.

---

## Running with docker-compose

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL 16 and the API, waiting for the database healthcheck before the
API boots. The API is on `http://localhost:3000` and Postgres on `localhost:5432`.

For hot reload, use the `dev` profile — it mounts `./src` into the container:

```bash
docker compose --profile dev up api-dev
```

`shm_size: 1gb` is set on both API services because Chromium crashes with Docker's
default 64MB `/dev/shm`.

### Configuration

Compose reads `.env` from the project directory to **interpolate** `${...}` inside
`docker-compose.yml`. It does not inject that file into the containers — only the keys
listed under `environment:` reach them.

That means `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` are the values worth
editing: they configure the database *and* are what the API's `DATABASE_URL` is built
from, so a password change in one place applies to both.

The `DATABASE_URL` and `PORT` entries in `.env` are there for running the API on the host
(`npm run start:dev`), where the database is reachable at `localhost`. Under compose the
API talks to the `db` service instead, so those two entries are ignored.

Note that the shell environment takes precedence over `.env` during interpolation: an
exported `POSTGRES_PASSWORD` overrides the file.

---

## Tests

```bash
npm test
```

Unit tests for the url normalizer and for the article `<head>` extraction (the latter
drives a real headless Chromium against HTML fixtures) run with no setup. The repository
integration tests need a database and skip themselves when `DATABASE_URL` is absent:

```bash
docker compose up -d db
DATABASE_URL=postgres://scrape:scrape@localhost:5432/scrape_journal npm test
```

# Docker Container Guide (Node.js, Puppeteer)
This document provides instructions for building and running the application using Docker.
The project is configured with two distinct Docker environments to support the full development lifecycle:
- **`Dockerfile` (Production):** A multi-stage build optimized for a lean, fast, and secure production deployment. It compiles the TypeScript to JavaScript and bundles _only_ the necessary production dependencies.
- **`Dockerfile-dev` (Development):** An environment configured for local development, featuring hot-reloading with `ts-node-dev`.
### Read in [Docker](Docker/readme.md)
