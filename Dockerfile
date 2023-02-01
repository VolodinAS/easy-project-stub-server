FROM 'node:14'

RUN mkdir -p /usr/src/app/server/
WORKDIR /usr/src/app/

COPY ./server /usr/src/app/server
COPY ./package.json /usr/src/app/package.json
COPY ./.serverrc.js /usr/src/app/.serverrc.js
# COPY ./.env /usr/src/app/.env

RUN npm install --only=prod
EXPOSE 8043

CMD ["npm", "run", "up:prod"]
