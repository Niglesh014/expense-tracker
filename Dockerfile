
# 1. Choose the base image
FROM node:22-alpine

# 2. Set the working directory
WORKDIR /app

# 3. Copy the application files
COPY index.html .
COPY style.css .
COPY app.js .
COPY server.js .

# 4. Document the port used by the application
EXPOSE 3000

# 5. Start the Node.js server
CMD ["node", "server.js"]