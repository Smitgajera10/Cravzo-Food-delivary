# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# --ignore-scripts skips the broken postinstall (prisma generate needs DATABASE_URL
# at build time via prisma.config.ts, but .env is not available in the build context).
# We run prisma generate manually with a dummy URL — generate only needs the schema,
# not an actual DB connection.
RUN npm ci --ignore-scripts
RUN DATABASE_URL="postgresql://x:x@localhost/x?sslmode=require" npx prisma generate

COPY tsconfig.json ./
COPY src ./src

# Call TypeScript's binary directly — avoids any fake 'tsc' npm package conflicts
RUN node ./node_modules/typescript/bin/tsc

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=builder /app/prisma ./prisma

# --ignore-scripts + --omit=dev: skip postinstall, install prod deps only
RUN npm ci --ignore-scripts --omit=dev

# Copy the pre-generated Prisma client from the builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
