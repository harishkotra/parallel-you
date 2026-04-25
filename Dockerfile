FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/src ./src
COPY server/public ./public

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
