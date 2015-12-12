FROM node@4.2.3
MAINTAINER Filipe Oliveira <contato@fmoliveira.com.br>

ADD . /var/src/

RUN npm install --prefix /var/src/

ENTRYPOINT [ "node", "/var/src/core/background.js" ]
