#!/usr/bin/env bash
#
# Description:
#   Starts the CI-Test container of the service
#
# Usage:
#   ./make-test-ci.sh <service-name>
#
# Examples:
#   ./make-test-ci.sh amqp-lib
#
#

# Params
service=$1

# Setup
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Script
$DIR/ci-scripts/create-docker-network.sh
docker-compose run $service-test-ci
docker-compose down