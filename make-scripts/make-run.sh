#!/usr/bin/env bash
#
# Description:
#   Starts the service
#
# Usage:
#   ./make-run.sh <service-name>
#
# Examples:
#   ./make-run.sh amqp-lib
#
#

# Params
service=$1;

# Setup
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Script
$DIR/create-docker-network.sh
docker-compose run --name $service --use-aliases $service-run
docker-compose down
