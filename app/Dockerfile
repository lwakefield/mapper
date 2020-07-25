FROM node:13-alpine

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn
COPY . /app/

ENV NODE_ENV=production
# TODO move this to runtime
RUN IMAGE_PROXY_HOST='https://i.dnd.iamlawrence.me' yarn build

CMD node __sapper__/build
