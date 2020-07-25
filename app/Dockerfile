FROM node:13-alpine

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn
COPY . /app/

ENV NODE_ENV=production

CMD node __sapper__/build
