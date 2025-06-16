# Coesco Web

## Perquisites

- [Docker](https://www.docker.com/products/docker-desktop/)

## Tools (Optional)

- [Cursor (IDE)](https://www.cursor.com/)
- [DBeaver (Database Management)](https://dbeaver.io/)
- [Redis Insight (Cache Management)](https://redis.io/insight/)
- [Postman (API Testing)](https://www.postman.com/downloads/)

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

## Docker

```bash
# Start container
docker-compose up --build

# Stop container
docker-compose down
```
