#!/bin/sh
DIR=$(dirname $(readlink -f $0))

mocha $@ --inspect=0.0.0.0 --timeout 60*1000 -r ts-node/register -r tsconfig-paths/register "./src/**/*test.ts" $1 $2 $3 $4 $5 $6
