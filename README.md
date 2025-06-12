# Coesco Web

## Perquisites

- [Docker](https://www.docker.com/products/docker-desktop/){:target="\_blank"}

## Tools (Optional)

- [Cursor (IDE)](https://www.cursor.com/){:target="\_blank"}
- [DBeaver (Database Management)](https://dbeaver.io/){:target="\_blank"}
- [Redis Insight (Cache Management)](https://redis.io/insight/){:target="\_blank"}
- [Postman (API Testing)](https://www.postman.com/downloads/){:target="\_blank"}

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
