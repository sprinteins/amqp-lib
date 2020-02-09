#!/bin/sh
DIR=$(dirname $(readlink -f $0))

$DIR/scripts-test.sh --inspect=0.0.0.0 --exit
