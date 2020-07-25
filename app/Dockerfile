FROM node:13-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock /app/
RUN yarn
COPY . /app/
RUN yarn build

CMD yarn start
