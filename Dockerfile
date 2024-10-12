FROM node:18-alpine AS base

ENV NODE_ENV production

WORKDIR /app

ENV PORT 4400

EXPOSE ${PORT}

COPY package.json /app/package.json

RUN npm ci

COPY . /app

RUN npx prisma generate

CMD ["npm", "start", "dbpush"]
