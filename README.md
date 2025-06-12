# Coesco Web

## Prerequisites

- <a href="https://www.docker.com/products/docker-desktop/" target="_blank">Docker</a>

## Tools (Optional)

- <a href="https://www.cursor.com/" target="_blank">Cursor (IDE)</a>
- <a href="https://dbeaver.io/" target="_blank">DBeaver (Database Management)</a>
- <a href="https://redis.io/insight/" target="_blank">Redis Insight (Cache Management)</a>
- <a href="https://www.postman.com/downloads/" target="_blank">Postman (API Testing)</a>

## Environment

1. Copy .env.template file for each application and insert environment variables

```bash
cd apps/client && cp .env.template .env && cd ..
```

```bash
cd apps/server && cp .env.template .env && cd ..
```

2. Install dependencies

```bash
npm install
```
