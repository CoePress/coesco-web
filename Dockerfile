FROM node:20-alpine

# Install Redis
RUN apk add --no-cache redis

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

# Start Redis and apps
CMD redis-server --daemonize yes && npm run dev