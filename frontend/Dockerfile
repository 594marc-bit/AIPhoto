# Multi-stage build for AIPhoto frontend (Quasar)
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and config
COPY package*.json ./
COPY quasar.config.ts ./
COPY .quasar ./
COPY index.html ./
COPY tsconfig.json ./
COPY eslint.config.js ./
COPY postcss.config.js ./
COPY .env.production ./
COPY .env.development ./
COPY .env ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY public ./public

# Build the application (force production mode)
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
