# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts eslint.config.js ./
COPY public ./public
COPY src ./src

# Build args for Vite env vars (passed at build time)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_AUTH_SERVICE
ARG VITE_RESTAURANT_SERVICE
ARG VITE_UTILS_SERVICE
ARG VITE_REALTIME_SERVICE
ARG VITE_RIDER_SERVICE
ARG VITE_STRIPE_PUBLISHABLE_KEY

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_AUTH_SERVICE=$VITE_AUTH_SERVICE
ENV VITE_RESTAURANT_SERVICE=$VITE_RESTAURANT_SERVICE
ENV VITE_UTILS_SERVICE=$VITE_UTILS_SERVICE
ENV VITE_REALTIME_SERVICE=$VITE_REALTIME_SERVICE
ENV VITE_RIDER_SERVICE=$VITE_RIDER_SERVICE
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
