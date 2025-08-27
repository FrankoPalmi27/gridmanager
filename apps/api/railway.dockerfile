FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY ../../packages/types ./packages/types

# Install dependencies
RUN npm install

# Copy source
COPY . .
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose port
EXPOSE $PORT

# Start the app
CMD ["npm", "start"]