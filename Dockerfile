FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 5004

CMD ["npm", "start"]
