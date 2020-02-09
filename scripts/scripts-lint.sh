#!/bin/sh
DIR=$(dirname $(readlink -f $0))

tslint -p $DIR/..