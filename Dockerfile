# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all deps (dev + prod) for build
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

# Copy only what's needed for runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install production dependencies only (next is here)
RUN npm install --omit=dev

# Environment
ENV NODE_ENV=production
EXPOSE 3000

# Start server
CMD ["npm", "start"]