FROM node:12
WORKDIR /app
COPY package.json /app
RUN npm install
COPY config.json /app
COPY contract_artifacts /app
COPY index.js /app
CMD node index.js
EXPOSE 9000
