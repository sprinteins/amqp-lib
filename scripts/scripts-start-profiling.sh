#!/bin/sh
DIR=$(dirname $(readlink -f $0))

export NODE_PATH=/app/dist:$NODE_PATH

# function triggerProfilingKill {
#     PID=$(ps aux | grep -i '[n]ode .*bin/0x' | awk '{print $1}')
#     if [ $PID]
#         kill $PID && wait $PID
#     fi
# }

# trap "exit" SIGINT SIGTERM
# trap triggerProfilingKill EXIT

mkdir -p profiling
node node_modules/typescript/bin/tsc -p . &&
    0x --output-dir profiling/{timestamp}_{pid} -- node --always-opt $DIR/../dist/src/server.js &
wait %1