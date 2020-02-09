#
# Description:
#   Create docker network for local development
#   Do nothing if already exists
#
# Usage:
#   ./create-docker-network.sh
#
#

docker network ls | grep amqp-lib-network

if [ $? -eq 1 ]; then
    docker network create amqp-lib-network
fi;