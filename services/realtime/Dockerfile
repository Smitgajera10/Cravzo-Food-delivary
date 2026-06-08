# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Use TypeScript's tsc directly — the fake 'tsc' npm package overrides the bin
RUN node ./node_modules/typescript/bin/tsc

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5004

CMD ["node", "dist/index.js"]
