FROM node:18-alpine AS base

ENV NODE_ENV production

WORKDIR /app

ENV PORT 4000

EXPOSE ${PORT}

COPY uploads /app/uploads
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci

COPY . /app

RUN npx prisma generate

CMD ["npm", "start", "dbpush"]
