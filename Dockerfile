FROM node:18-alpine AS base

WORKDIR /app
COPY package.json /app/package.json
RUN npm install --production
RUN npm cache clean --force 

COPY . /app
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=4400
EXPOSE ${PORT}

CMD npx prisma migrate deploy | npm start
