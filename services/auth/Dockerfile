# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Copy prisma schema first so postinstall can generate client
COPY prisma ./prisma

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client & compile TypeScript
RUN npx prisma generate && npm run build

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production deps only
RUN npm ci --omit=dev

# Copy prisma schema + generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
