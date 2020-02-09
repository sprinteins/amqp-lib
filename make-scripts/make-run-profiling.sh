#!/usr/bin/env bash
#
# Description:
#   Starts the service in debug mode
#
# Usage:
#   ./make-run-debug.sh <service-name>
#
# Examples:
#   ./make-run-debug.sh amqp-lib
#
#

# Params
service=$1;

# Setup
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Script
$DIR/create-docker-network.sh
docker-compose run --name $service --use-aliases $service-run-profiling
docker-compose down

