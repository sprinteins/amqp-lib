#!/bin/sh
DIR=$(dirname $(readlink -f $0))

tsc --noEmit -p $DIR/..