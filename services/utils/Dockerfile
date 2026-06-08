# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
# Remove the postinstall hook (prisma generate) — utils has no Prisma schema
# and prisma is a devDependency, so it won't be available in --omit=dev install.
RUN npm pkg delete scripts.postinstall && npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5002

CMD ["node", "dist/index.js"]
