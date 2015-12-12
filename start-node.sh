#!/bin/sh

docker rm -f mobv3

docker rmi -f mobv3

docker build -t mobv3 .

docker run \
	--name mobv3 \
	--restart=always \
	--link mob-mongo:db \
	-e FACEBOOK_CLIENT_ID=$FACEBOOK_CLIENT_ID \
	-e FACEBOOK_CLIENT_SECRET=$FACEBOOK_CLIENT_SECRET \
	-d \
	mobv3
