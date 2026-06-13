# syntax=docker/dockerfile:1

# Stage 1: Build the Vite app
FROM node:20-alpine AS builder

LABEL maintainer="Grand Stay Dev Team"
LABEL description="Grand Stay Hotels - Frontend React/Vite"
LABEL version="1.0.0"

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Production image with nginx
FROM nginx:alpine AS production

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
