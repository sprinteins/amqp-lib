#!/bin/sh
DIR=$(dirname $(readlink -f $0))

nodemon --exec "clear; npm run test --silent"

