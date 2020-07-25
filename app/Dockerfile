FROM node:13-alpine

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn
COPY . /app/

ENV NODE_ENV=production
RUN yarn build

CMD node __sapper__/build
