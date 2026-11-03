# Builds the site, then serves it with Caddy, which also handles HTTPS.
FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_UPLOADS_ENABLED=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_UPLOADS_ENABLED=$VITE_UPLOADS_ENABLED
RUN npm run build

FROM caddy:2-alpine AS web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
