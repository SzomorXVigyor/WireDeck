FROM node:18-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY ./src/package*.json ./

# Install dependencies
RUN yarn install --production

# Copy application files
COPY ./src/ ./

# Create deployments directory
RUN mkdir -p deployments

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]