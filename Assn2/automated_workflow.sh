#!/bin/bash

containerid=$(docker ps -aqf "name=file")
docker container rm $containerid
docker rmi file-store
docker compose up -d
exit