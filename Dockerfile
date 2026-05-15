FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV FRONTEND_PORT=5173

COPY package*.json ./
RUN npm install --omit=dev

COPY index.html ./
COPY styles.css ./
COPY server.mjs ./

EXPOSE 5173

CMD ["npm", "start"]
