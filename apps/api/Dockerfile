FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src/
COPY tsconfig.json ./

# Build the application (without database operations)
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm start"]