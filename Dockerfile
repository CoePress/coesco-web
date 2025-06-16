FROM node:20-alpine

# Install Redis
RUN apk add --no-cache redis

# Create Redis data directory
RUN mkdir -p /var/lib/redis

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/client/package*.json ./apps/client/
COPY apps/server/package*.json ./apps/server/

RUN npm install
COPY . .

# Generate Prisma
RUN cd apps/server && npx prisma generate

EXPOSE 5173 8080 6379

# Start Redis with specific data directory
CMD redis-server --dir /var/lib/redis --daemonize yes && npm run dev