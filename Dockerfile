# Local development container — runs the OpenNext Worker via workerd preview.
# Not used in production. Production deploys to the Cloudflare edge via `npm run deploy`.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run cf:build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "scripts/start-staging.sh"]
