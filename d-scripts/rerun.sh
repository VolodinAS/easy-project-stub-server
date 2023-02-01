#!/bin/sh

docker stop $(docker ps -q)
docker volume remove multy_stub_volume
docker volume create multy_stub_volume
docker run --rm -v multy_stub_volume:/data/db -p 27017:27017 -d mongo:4.4.13
