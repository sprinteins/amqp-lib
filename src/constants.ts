const namespace = "amqp-lib";

export const EventNames = {
    closedConnection : `${namespace}.closed-connection`,
    errorConnection: `${namespace}.error-connection`,
    lostConnection: `${namespace}.lost-connection`,
    openConnection: `${namespace}.open-connection`,
    reEstablishedConnection: `${namespace}.re-established-connection`,
    retryingConnection: `${namespace}.retrying-connection`,
};

export const AmqpLibErrors = {
    channelOrMessageUndefined: "undefined-channel-or-message",
    consumerAlreadyEstablished: "consumer-already-established",
    corruptChannel: "corrupt-channel",
    corruptConnection: "corrupt-connection",
    corruptConsumer: "corrupt-consumer",
    defineQueueOrExchange: "define-queue-or-exchange",
    missingUrl: "missing-url",
    noMessageConsumed: "no-message-consumed",
    remoteHostConnectionClosed: "remote-host-closed-connection",
    requiredConsumerFunction: "required-consumer-function",
};
