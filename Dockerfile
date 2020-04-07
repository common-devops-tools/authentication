FROM ubuntu:16.04
RUN apt-get update
RUN apt-get install -y nodejs-legacy
RUN apt-get install -y npm git
RUN mkdir -p rdm-auth
COPY . rdm-auth/
RUN npm install pm2 -g
RUN apt-get update
RUN apt-get install -y curl
RUN cd rdm-service && npm install
RUN curl -sL "https://deb.nodesource.com/setup_7.x"|bash
RUN apt-get install -y nodejs
RUN cd rdm-auth && npm install
CMD ["pm2-docker", "rdm-auth/index.js"]
EXPOSE 8090

