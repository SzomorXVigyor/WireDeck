FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY src/package*.json ./
RUN yarn install --production

# Copy application files
COPY . .

# Create deployments directory
RUN mkdir -p deployments

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]