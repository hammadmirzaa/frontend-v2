
# Use official Node.js 20 LTS image
FROM node:20

# Set environment variables
ENV PORT=4173

# Create and set working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy all source files
COPY . .

# Build the app
RUN npm run build

# Expose the application port
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview"]

