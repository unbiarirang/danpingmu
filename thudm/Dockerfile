FROM node:8
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN apt-get update
RUN apt-get install sudo
COPY . .
EXPOSE 80
CMD sudo bin/www sanghuk
