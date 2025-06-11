FROM node:20-alpine

WORKDIR /app

# Copy package files for optimal caching
COPY package*.json ./
COPY turbo.json ./
COPY apps/client/package*.json ./apps/client/
COPY apps/server/package*.json ./apps/server/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd apps/server && npx prisma generate

# Expose both ports
EXPOSE 5173 8080

# Start both apps
CMD ["npm", "run", "dev"]