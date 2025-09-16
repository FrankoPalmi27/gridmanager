FROM node:20-slim

WORKDIR /app

# Install dependencies for Prisma on Debian
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and build
COPY src ./src/
COPY tsconfig.json ./
RUN npm run build

# Expose port (Railway uses PORT env variable)
EXPOSE $PORT

# Start application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]