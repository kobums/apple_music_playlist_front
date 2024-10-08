# Dockerfile 예시
FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn build

CMD ["yarn", "start"]