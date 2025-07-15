# Coesco Web

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

- If you ever see the following error, run the command below

```bash
(node:44280) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a
 userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Error: listen EADDRINUSE: address already in use :::8080
    at Server.setupListenHandle [as _listen2] (node:net:1907:16)
    at listenInCluster (node:net:1964:12)
    at Server.listen (node:net:2066:7)
    at Object.<anonymous> (C:\Users\jar\Code\coesco-web\apps\server\src\server.ts:13:12)
    at Module._compile (node:internal/modules/cjs/loader:1546:14)
    at Module.m._compile (C:\Users\jar\Code\coesco-web\node_modules\ts-node\src\index.ts:161
8:23)
    at node:internal/modules/cjs/loader:1689:10
    at Object.require.extensions.<computed> [as .ts] (C:\Users\jar\Code\coesco-web\node_modu
les\ts-node\src\index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1318:32)
    at Function._load (node:internal/modules/cjs/loader:1128:12) {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 8080
}
```
