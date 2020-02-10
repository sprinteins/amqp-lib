const namespace = "amqp-lib";

export const eventNames = {
    closedConnection : `${namespace}.closed-connection`,
    errorConnection: `${namespace}.error-connection`,
    lostConnection: `${namespace}.lost-connection`,
    openConnection: `${namespace}.open-connection`,
    reEstablishedConnection: `${namespace}.re-established-connection`,
    retryingConnection: `${namespace}.retrying-connection`,
};

export const errors = {
    channelOrMessageUndefined: "undefined-channel-or-message",
    consumerAlreadyEstablished: "consumer-already-established",
    corruptChannel: "corrupt-channel",
    defineQueueOrExchange: "define-queue-or-exchange",
    noMessageConsumed: "no-messge-consumed",
    remoteHostConnectionClosed: "remote-host-closed-connection",
    requiredConsumerFunction: "required-consumer-function",
}