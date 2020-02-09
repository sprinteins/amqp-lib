#!/bin/sh
DIR=$(dirname $(readlink -f $0))

node $@ --max-old-space-size=2048 -r ts-node/register -r tsconfig-paths/register $DIR/../usecases/index.ts 