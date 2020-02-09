#!/bin/sh
DIR=$(dirname $(readlink -f $0))

$DIR/scripts-start.sh --inspect=0.0.0.0

