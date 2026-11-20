# API con Socket.io (proceso Node persistente).
# Despliega en Railway / Render / Fly / Cloud Run para clientes Flutter con sockets.
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY api ./api

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV TZ=America/Mexico_City

EXPOSE 4000

CMD ["node", "src/index.js"]
