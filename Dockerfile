FROM node:17

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install
COPY . .
RUN npm run build

CMD ["node", "."]