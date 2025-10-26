# Docker Container Guide (Node.js, Puppeteer)

This document provides instructions for building and running the application using Docker.

The project is configured with two distinct Docker environments to support the full development lifecycle:

- **`Dockerfile` (Production):** A multi-stage build optimized for a lean, fast, and secure production deployment. It compiles the TypeScript to JavaScript and bundles _only_ the necessary production dependencies.
- **`Dockerfile-dev` (Development):** An environment configured for local development, featuring hot-reloading with `ts-node-dev`.

## Prerequisites

- [Docker Desktop](https://www.docker.com/get-started) (or Docker Engine) must be installed and running.

---

## 1. Production Environment (`Dockerfile`)

This workflow builds the final, optimized image intended for deployment.

### 1.1. Build the Production Image

This command builds the image using the multi-stage `Dockerfile`.

```bash
# Define a name and tag for the production image
export IMAGE_NAME_PROD="challenge-api-prod:1.0.0"

# (Optional) Clean up the previous image, if it exists
docker rmi -f $IMAGE_NAME_PROD 2>/dev/null || true

# Build the image using the default 'Dockerfile'
docker build --no-cache \
  -t $IMAGE_NAME_PROD \
  -f Docker/Dockerfile .
```

### 1.2. Run the container

Run the container from the production image:

```bash
docker run -it --rm \
  --name challenge-api-prod \
  -p 3000:3000 \
  $IMAGE_NAME_PROD
```

## 2. Development Environment (`Dockerfile-dev`)

This workflow sets up a development environment with hot-reloading.

### 2.1. Build the Development Image

Build the development image using the `Dockerfile-dev`:

```bash
# Define a name and tag for the development image
export IMAGE_NAME_DEV="challenge-api-dev:1.0.0"

# (Optional) Clean up the previous image, if it exists
docker rmi -f $IMAGE_NAME_DEV 2>/dev/null || true

# Build the image using 'Dockerfile
docker build --no-cache \
  -t $IMAGE_NAME_DEV \
  -f Docker/Dockerfile-dev .
```

### 2.2. Run the Development Container

Run the container with volume mounts for live code updates:

```bash
docker run -it --rm \
  --name challenge-api-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  $IMAGE_NAME_DEV
```
