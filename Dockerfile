FROM node:20-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5004

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run build && npm start"]
