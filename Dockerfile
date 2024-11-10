# Use the official Bun image as a base
FROM oven/bun:latest

# Install curl
RUN apt-get update && apt-get install -y curl iproute2 && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb to install dependencies
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Build the application
RUN bun run build

# Expose the port that the Bun app runs on (default is 3000)
EXPOSE 80

# Start the application
CMD ["bun", "run", "start"]
