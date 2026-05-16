FROM node:20-alpine

WORKDIR /app

ENV FRONTEND_PORT=5173

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 5173

CMD ["npm", "start"]
