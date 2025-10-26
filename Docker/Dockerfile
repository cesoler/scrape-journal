FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim AS production
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y \
    libnspr4 \
    libnss3 \
    libxss1 \
    libdbus-glib-1-2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/dist ./dist
RUN chown -R node:node /app

USER node
RUN npm install --omit=dev


EXPOSE 3000

CMD ["npm", "run", "start"]