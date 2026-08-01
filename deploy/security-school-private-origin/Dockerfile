FROM node:22-bookworm-slim AS build

WORKDIR /src

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:security-private-origin

FROM caddy:2-alpine

COPY deploy/security-school-private-origin/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist/security-school-private /srv/ragbaz

USER 1000:1000
EXPOSE 8788
