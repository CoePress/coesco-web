# Stage 1 - Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files for the whole monorepo
COPY package.json package-lock.json turbo.json ./
COPY apps/server/package.json ./apps/server/package.json

# Copy shared packages
COPY packages ./packages

# Install ALL dependencies
RUN npm ci

# Generate Prisma Client
COPY apps/server/prisma ./apps/server/prisma
RUN cd apps/server && npx prisma generate

# Stage 2 - Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app ./

# Copy server source code
COPY apps/server ./apps/server

# Build the server (Turborepo will build dependencies too)
RUN npm run build --workspace=@coesco/server

# Stage 3 - Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy the built app
COPY --from=builder --chown=expressjs:nodejs /app/apps/server/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/server/package.json ./package.json

# Copy node_modules (including Prisma client)
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules

USER expressjs

EXPOSE 3000

ENV NODE_ENV=production

# Use the CORRECT entry point from your package.json
CMD ["node", "dist/src/server.js"]