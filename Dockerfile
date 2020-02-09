FROM node:9.11.2-alpine

WORKDIR /app
COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .


EXPOSE 3000

ENTRYPOINT ["/app/scripts/scripts-start.sh"]