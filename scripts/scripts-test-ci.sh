#!/bin/sh
DIR=$(dirname $(readlink -f $0))

$DIR/scripts-test.sh --reporter mocha-multi-reporters --reporter-options configFile=$DIR/../test.config.json --exit
