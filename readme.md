# Scrape Journal API

This project is a Node.js API built with TypeScript, Express, and Puppeteer. Its primary function is to scrape news articles from `globo.com` by dynamically running a headless Chromium browser to parse content.

A core feature of this project is its two-pronged approach to data fetching, allowing scraping from either the main public page or an internal AI suggestions endpoint. The entire architecture is designed to operate within a memory-constrained (512MB) environment, with explicit controls for synchronous and asynchronous processing.

## Core Stack

* **Runtime:** Node.js v20
* **Framework:** Express.js
* **Language:** TypeScript
* **Web Scraping:** Puppeteer
* **Containerization:** Docker (with multi-stage builds)

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

**Body Example:**
```json
[
  {
    "id": 1,
    "title": "Article Title Scraped from Detail Page",
    "url": "https://g1.globo.com/...",
    "featured": true,
    "subtitle": "The article's subtitle text.",
    "createdAt": "2025-10-26"
  },
  {
    "id": 2,
    "title": "Another Article Title",
    "url": "https://g1.globo.com/...",
    "featured": false,
    "subtitle": "Another subtitle.",
    "createdAt": "2025-10-25"
  }
]
```

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

# Docker Container Guide (Node.js, Puppeteer)
This document provides instructions for building and running the application using Docker.
The project is configured with two distinct Docker environments to support the full development lifecycle:
- **`Dockerfile` (Production):** A multi-stage build optimized for a lean, fast, and secure production deployment. It compiles the TypeScript to JavaScript and bundles _only_ the necessary production dependencies.
- **`Dockerfile-dev` (Development):** An environment configured for local development, featuring hot-reloading with `ts-node-dev`.
### Read in [Docker](Docker/readme.md)
