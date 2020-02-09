#!/usr/bin/env bash
#
# Description:
#   Builds a given service
#
# Usage:
#   ./make-build.sh <service-name>
#
# Examples:
#   ./make-build.sh amqp-lib
#
#

# Params
service=$1;

# Script
docker-compose build $service