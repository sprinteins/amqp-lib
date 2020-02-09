#!/usr/bin/env bash
#
# Description:
#   Starts the debuggable development container of a service
#
# Usage:
#   ./make-dev-debug.sh <service-name>
#
# Examples:
#   ./make-dev-debug.sh amqp-lib
#
#


# Params 
service=$1;

# Setup
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

# Script
$DIR/make-dev.sh $service -p 9229:9229