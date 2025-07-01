# Use Node.js base image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire app
COPY . .

# Set environment variable for production
ENV NODE_ENV=production

# Expose port (match your app.js port or Railway's env)
EXPOSE 3000

# Start the server
CMD ["node", "app.js"]
