# Use official Node.js image as a base image
FROM node:22

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your application will run on
EXPOSE 3000

# Start your application
CMD ["npm", "start"]
