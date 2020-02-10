#!/bin/sh
DIR=$(dirname $(readlink -f $0))

yarn install typescript

tsc --noEmit -p $DIR/..