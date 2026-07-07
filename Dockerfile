FROM node:24.18.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node

CMD ["npm", "start"]
