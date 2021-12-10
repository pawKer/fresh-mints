FROM node:17

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install
COPY . .
RUN npm run build

FROM node:17

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install --only=production

COPY --from=0 /usr/src/app/build .
COPY --from=0 /usr/src/app/.env .

RUN npm install pm2 -g
ENV NODE_ENV=prod

CMD ["pm2-runtime","bot.js"]