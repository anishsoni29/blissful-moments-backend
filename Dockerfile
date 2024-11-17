# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code into the container
COPY . .

# Expose the backend port
EXPOSE 5002

# Set the command to start the backend
CMD ["node", "index.js"]
