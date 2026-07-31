FROM node:22-alpine

WORKDIR /srv

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORTAL_FETCH_PORT=8090
EXPOSE 8090

# Host platforms set PORT; config.ts prefers PORT over PORTAL_FETCH_PORT.
CMD ["npx", "tsx", "src/server.ts"]
