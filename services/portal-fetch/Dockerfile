FROM node:22-alpine

WORKDIR /srv

COPY package.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src

ENV PORTAL_FETCH_PORT=8090
EXPOSE 8090

CMD ["npx", "tsx", "src/server.ts"]
