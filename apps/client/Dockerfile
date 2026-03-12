FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/client/package.json ./apps/client/
COPY packages ./packages

RUN npm ci

COPY apps/client ./apps/client
RUN npm run build --workspace=@coesco/client

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80