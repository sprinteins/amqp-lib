#!/bin/sh
DIR=$(dirname $(readlink -f $0))

nodemon --inspect-brk=0.0.0.0 --watch $DIR/../test --watch $DIR/test -e ts --exec \"clear; npm run test --silent\"

