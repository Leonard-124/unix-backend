FROM node:18

WORKDIR /app

COPY Backend/package*.json ./
RUN npm install

COPY Backend/ .

CMD ["npm", "start"]