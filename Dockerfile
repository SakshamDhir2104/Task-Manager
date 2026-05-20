FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install

COPY server ./server
COPY client ./client

RUN npm run build -w client
RUN cp -r client/dist server/public
RUN npm run db:generate -w server
RUN npm run build -w server

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY server/package.json ./server/
RUN npm install --omit=dev -w server && npm install prisma -w server

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/public ./server/public
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

WORKDIR /app/server
EXPOSE 4000
CMD ["npm", "start"]
