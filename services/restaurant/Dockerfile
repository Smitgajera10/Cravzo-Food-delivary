# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci --ignore-scripts
RUN DATABASE_URL="postgresql://x:x@localhost/x?sslmode=require" npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN node ./node_modules/typescript/bin/tsc

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/prisma ./prisma

RUN npm ci --ignore-scripts --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

EXPOSE 5001

CMD ["node", "dist/index.js"]
