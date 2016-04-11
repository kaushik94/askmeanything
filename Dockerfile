FROM phusion/baseimage
MAINTAINER KAUSHIK

ENV TAR_GZ_URL=https://github.com/askmeanything-app/askmeanything/archive/configure-aws-eb.tar.gz \
    BUILD_DEPS='g++ gcc git make python' \
    LCB_PLUGINS='lets-chat-ldap lets-chat-s3'

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN \
  apt-get update && \
  apt-get install -y \
  nodejs \
  npm

RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN npm install npm -g
RUN npm install

RUN set -x \
&&  apt-get install -y $BUILD_DEPS --no-install-recommends \
&&  rm -rf /var/lib/apt/lists/* \
&&  npm install --production \
&&  npm install $LCB_PLUGINS \
&&  npm dedupe \
&&  npm cache clean \
&&  rm -rf /tmp/npm* \
&&  apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false -o APT::AutoRemove::SuggestsImportant=false $BUILD_DEPS

ENV LCB_DATABASE_URI=mongodb://mongo/ama \
    LCB_HTTP_HOST=0.0.0.0 \
    LCB_HTTP_PORT=8080 \
    LCB_XMPP_ENABLE=true \
    LCB_XMPP_PORT=5222

ADD $TAR_GZ_URL ./master.tar.gz

RUN tar -xzvf master.tar.gz \
&&  cp -a askmeanything-configure-aws-eb/. . \
&&  rm -rf lets-chat-master

VOLUME ["/usr/src/app/config"]
VOLUME ["/usr/src/app/uploads"]

RUN groupadd -r node \
&&  useradd -r -g node node \
&&  chown node:node uploads

EXPOSE 8080 5222

CMD ["npm", "start"]
