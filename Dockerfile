# Multi-stage build for production deployment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run prod:build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S collegesafe -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=collegesafe:nodejs /app/dist ./dist
COPY --from=builder --chown=collegesafe:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=collegesafe:nodejs /app/package*.json ./
COPY --from=builder --chown=collegesafe:nodejs /app/migrations ./migrations

# Create uploads directory
RUN mkdir -p /app/uploads && chown collegesafe:nodejs /app/uploads

# Switch to non-root user
USER collegesafe

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "run", "prod:start"]
