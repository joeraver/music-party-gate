# ==========================================
# Multi-Stage Dockerfile for Music Party Gate
# ==========================================

# 1. Build Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# 2. Production Server Container
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production server dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy server files and data
COPY server/ ./server/
COPY data/ ./data/

# Copy built frontend from Stage 1 into client/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port
EXPOSE 3000

# Health check for AWS App Runner, ECS, or ALB
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server/server.js"]
