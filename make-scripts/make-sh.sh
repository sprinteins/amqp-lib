#!/usr/bin/env bash
#
# Description:
#   Starts the development container and steps into its shell
#
# Usage:
#   ./make-sh.sh <service-name>
#
# Examples:
#   ./make-sh.sh amqp-lib
#
#

# Params
service=$1;

# Setup
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Script
$DIR/create-docker-network.sh
docker-compose run --use-aliases $service-dev sh
docker-compose down