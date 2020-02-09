#!/usr/bin/env bash
#
# Description:
#   Starts the development container of a service
#
# Usage:
#   ./make-dev.sh <service-name>
#
# Examples:
#   ./make-dev.sh amqp-lib
#
#

# Params
service=$1;
shift;
rest=$@

# Setup
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Script
$DIR/create-docker-network.sh
docker-compose run $rest --use-aliases $service-dev
docker-compose kill
docker-compose down