FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_CACHE_DIR=/tmp/puppeteer

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
