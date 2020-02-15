import { expect } from "chai";
import { Connection, Message } from "../src";
import config from "./config";

describe("AmqpLib Tests", () => {
    const exchangeNamePrefix = "Exchange_";
    const queueNamePrefix = "Queue_";

    const auth = {
        password: config.messagebrokerpassword,
        url: config.messagebrokerurl,
        username: config.messagebrokerusername,
    };

    let exchangeCount = 0;
    let queueCount = 0;
    const connections: Connection[] = [];

    function getExchangeName(): string {
        exchangeCount++;
        return exchangeNamePrefix + exchangeCount;
    }

    function getQueueName(): string {
        queueCount++;
        return queueNamePrefix + queueCount;
    }

    function getConnection() {
        const conn = new Connection(auth);
        connections.push(conn);
        return conn;
    }

    function clean(connection: Connection, done: Mocha.Done, err?: Error) {
        connection
            .deRegisterTopology()
            .then(() => {
                return connection.close;
            })
            .then(() => {
                done();
            })
            .catch((error) => {
                done(error);
            });
    }

    describe(`amqp-lib initializes`, () => {
        it("Should create rabbitmq connection", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            promisedConnection
                .then(() => {
                    connect.close().then(() => {
                        done();
                    });
                })
                .catch((error) => {
                    done(new Error("amqp-lib connection creation failed"));
                });
        });
    });
    describe(`amqp-lib usage`, () => {
        it("Should create a queue with the correct name", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();

            const queue = connect.registerQueue(validQueue);

            connect
                .initializeTopology()
                .then(() => {
                    try {
                        expect(queue.name).to.be.equal(validQueue);
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should create a exchange with the correct name and type", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange = getExchangeName();
            const validType = "topic";
            const exchange = connect.registerExchange(validExchange, validType);

            connect
                .initializeTopology()
                .then(() => {
                    try {
                        expect(exchange.name).to.be.equal(validExchange);
                        expect(exchange.type).to.be.equal(validType);
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should create a queue and send and receive object messages", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();

            const queue = connect.registerQueue(validQueue);
            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    const message = new Message(
                        { blue: "rabbit" },
                        { contentType: "application/json" },
                    );
                    queue.send(message);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should create a queue and does not resend a nack(false) message", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();
            let nack = false;

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();

            const queue = connect.registerQueue(validQueue);
            queue.subscribeConsumer(
                (msg) => {
                    try {
                        if (nack) {
                            expect(msg.getContent()).to.be.equal("Blue Rabbit");
                            msg.ack();
                            clean(connect, done);
                        } else {
                            expect(msg.getContent()).equals("Blue Rabbit");
                            msg.nack(false, false);
                            nack = true;
                            const testmessage = new Message(
                                "Blue Rabbit Finished",
                                {},
                            );
                            queue.send(testmessage);
                        }
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: false },
            );

            connect
                .initializeTopology()
                .then(() => {
                    const message = new Message("Blue Rabbit", {});
                    queue.send(message);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should create a queue and send and receive messages with reject", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();

            const queue = connect.registerQueue(validQueue);
            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal("Blue Rabbit");
                        msg.reject(false);
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: false },
            );

            connect
                .initializeTopology()
                .then(() => {
                    const message = new Message("Blue Rabbit", {});
                    queue.send(message);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should create a queue and send and receive messages with ack", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();

            const queue = connect.registerQueue(validQueue);
            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal("Blue Rabbit");
                        msg.ack();
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: false },
            );

            connect
                .initializeTopology()
                .then(() => {
                    const message = new Message("Blue Rabbit", {});
                    queue.send(message);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should return the same queue instance every time registerQueue is called again and again", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();

            const queue1 = connect.registerQueue(validQueue);
            const queue2 = connect.registerQueue(validQueue);

            expect(queue1).equal(queue2);

            connect
                .initializeTopology()
                .then(() => {
                    clean(connect, done);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should return the same exchange instance every time registerExchange is called again", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange = getExchangeName();

            const exchange1 = connect.registerExchange(validExchange, "fanout");
            const exchange2 = connect.registerExchange(validExchange, "fanout");

            expect(exchange1.name).equal(exchange2.name);

            connect
                .initializeTopology()
                .then(() => {
                    clean(connect, done);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should bind exchanges", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange1 = getExchangeName();
            const validQueue = getQueueName();
            const validExchange2 = getExchangeName();
            const exchange1 = connect.registerExchange(
                validExchange1,
                "direct",
            );
            const queue = connect.registerQueue(validQueue);
            const exchange2 = connect.registerExchange(
                validExchange2,
                "direct",
            );

            if (!exchange1 || !exchange2 || !queue) {
                done(new Error("Failed to register exchange or queue"));
                return;
            }

            exchange2.bind(exchange1);
            queue.bind(exchange2);

            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    const message = new Message(
                        { blue: "rabbit" },
                        { contentType: "application/json" },
                    );
                    exchange1.send(message);
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should create an exchange, queue and binding and send and receive a object Message", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange = getExchangeName();
            const validQueue = getQueueName();

            const exchange = connect.registerExchange(validExchange, "direct");
            const queue = connect.registerQueue(validQueue);
            queue.bind(exchange);

            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    const message = new Message(
                        { blue: "rabbit" },
                        { contentType: "application/json" },
                    );
                    exchange.send(message);
                })
                .catch((error) => {
                    done(error);
                });
        });
        it("Should reconnect when sending a Message to an Queue after a broken connection", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validQueue = getQueueName();
            const queue = connect.registerQueue(validQueue);

            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    connect
                        .close()
                        .then(() => {
                            const message = new Message(
                                { blue: "rabbit" },
                                { contentType: "application/json" },
                            );
                            queue.send(message);
                        })
                        .catch((error) => {
                            done(error);
                        });
                })
                .catch((error) => {
                    done(error);
                });
        });
        it("Should unbind queues and exchange", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange1 = getExchangeName();
            const validQueue = getQueueName();
            const validExchange2 = getExchangeName();
            const exchange1 = connect.registerExchange(
                validExchange1,
                "direct",
            );
            const queue = connect.registerQueue(validQueue);
            const exchange2 = connect.registerExchange(
                validExchange2,
                "direct",
            );

            if (!exchange1 || !exchange2 || !queue) {
                done(new Error("Failed to register exchange or queue"));
                return;
            }

            exchange2.bind(exchange1);
            queue.bind(exchange2);

            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        exchange2
                            .unbind(exchange1)
                            .then(() => {
                                return queue.unbind(exchange2);
                            })
                            .then(() => {
                                clean(connect, done);
                            });
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    connect
                        .close()
                        .then(() => {
                            const message = new Message(
                                { blue: "rabbit" },
                                { contentType: "application/json" },
                            );
                            queue.send(message);
                        })
                        .catch((error) => {
                            done(error);
                        });
                })
                .catch((error) => {
                    done(error);
                });
        });
        it("Should delete queues and exchange", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange1 = getExchangeName();
            const validQueue = getQueueName();
            const validExchange2 = getExchangeName();
            const exchange1 = connect.registerExchange(
                validExchange1,
                "direct",
            );
            const queue = connect.registerQueue(validQueue);
            const exchange2 = connect.registerExchange(
                validExchange2,
                "direct",
            );

            if (!exchange1 || !exchange2 || !queue) {
                done(new Error("Failed to register exchange or queue"));
                return;
            }

            exchange2.bind(exchange1);
            queue.bind(exchange2);

            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        exchange2
                            .deleteExchange()
                            .then(() => {
                                return queue.deleteQueue();
                            })
                            .then(() => {
                                clean(connect, done);
                            });
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    connect
                        .close()
                        .then(() => {
                            const message = new Message(
                                { blue: "rabbit" },
                                { contentType: "application/json" },
                            );
                            queue.send(message);
                        })
                        .catch((error) => {
                            done(error);
                        });
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should reconnect when sending a Message to an Exchange after a broken connection", (done) => {
            const connect = getConnection();
            const promisedConnection = connect.init();

            if (!promisedConnection) {
                done(new Error("Corrupt Connection"));
                return;
            }

            const validExchange1 = getExchangeName();
            const validQueue = getQueueName();
            const validExchange2 = getExchangeName();
            const exchange1 = connect.registerExchange(
                validExchange1,
                "direct",
            );
            const queue = connect.registerQueue(validQueue);
            const exchange2 = connect.registerExchange(
                validExchange2,
                "direct",
            );

            if (!exchange1 || !exchange2 || !queue) {
                done(new Error("Failed to register exchange or queue"));
                return;
            }

            exchange2.bind(exchange1);
            queue.bind(exchange2);

            queue.subscribeConsumer(
                (msg) => {
                    try {
                        expect(msg.getContent()).to.be.equal({
                            blue: "rabbit",
                        });
                        clean(connect, done);
                    } catch (error) {
                        clean(connect, done, error);
                    }
                },
                { noAck: true },
            );

            connect
                .initializeTopology()
                .then(() => {
                    connect
                        .close()
                        .then(() => {
                            const message = new Message(
                                { blue: "rabbit" },
                                { contentType: "application/json" },
                            );
                            exchange1.send(message);
                        })
                        .catch((error) => {
                            done(error);
                        });
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Should not subscribe 2 consumers for the same queue", (done) => {
            const connect = getConnection();

            const validExchange = getExchangeName();
            const validQueue = getQueueName();

            const exchange = connect.registerExchange(validExchange, "direct");
            const queue = connect.registerQueue(validQueue);

            queue.bind(exchange);
            try {
                queue.subscribeConsumer(
                    (message) => {
                        clean(
                            connect,
                            done,
                            new Error("Received unexpected message"),
                        );
                    },
                    { noAck: true },
                );
                queue.subscribeConsumer(
                    (message) => {
                        clean(
                            connect,
                            done,
                            new Error("Received unexpected message"),
                        );
                    },
                    { noAck: true },
                );
            } catch (error) {
                expect(error.message).equal("consumer-already-established");
                clean(connect, done);
            }
        });

        it("Should close a queue multiple times without generating errors", (done) => {
            const connection = getConnection();
            const queueName = getQueueName();
            let queue = connection.registerQueue(queueName);

            connection.initializeTopology().then(
                () => {
                    queue.closeQueue();
                    queue.closeQueue()!.then(() => {
                        queue = connection.registerQueue(queueName);
                        queue.init()!.then(() => {
                            clean(connection, done);
                        });
                    });
                },
                (err) => {
                    done(err);
                },
            );
        });
        it("Should delete a queue multiple times without generating errors", (done) => {
            const connection = getConnection();
            const queueName = getQueueName();
            let queue = connection.registerQueue(queueName);

            connection.initializeTopology().then(
                () => {
                    queue.deleteQueue();
                    queue.deleteQueue()!.then(() => {
                        queue = connection.registerQueue(queueName);
                        queue.init()!.then(() => {
                            clean(connection, done);
                        });
                    });
                },
                (err) => {
                    done(err);
                },
            );
        });
        it("Should close a exchange multiple times without generating errors", (done) => {
            const connection = getConnection();
            const exchangeName = getExchangeName();
            let exchange = connection.registerQueue(exchangeName);

            connection.initializeTopology().then(
                () => {
                    exchange.closeQueue();
                    exchange.closeQueue()!.then(() => {
                        exchange = connection.registerQueue(exchangeName);
                        exchange.init()!.then(() => {
                            clean(connection, done);
                        });
                    });
                },
                (err) => {
                    done(err);
                },
            );
        });
        it("Should delete a exchange multiple times without generating errors", (done) => {
            const connection = getConnection();
            const exchangeName = getExchangeName();
            let exchange = connection.registerQueue(exchangeName);

            connection.initializeTopology().then(
                () => {
                    exchange.deleteQueue();
                    exchange.deleteQueue()!.then(() => {
                        exchange = connection.registerQueue(exchangeName);
                        exchange.init()!.then(() => {
                            clean(connection, done);
                        });
                    });
                },
                (err) => {
                    done(err);
                },
            );
        });

        it("Should set a pre fetch count to a queue", (done) => {
            const connect = getConnection();
            const queueName = getQueueName();
            const queue = connect.registerQueue(queueName);

            connect.initializeTopology().then(
                () => {
                    queue.prefetch(3);
                    clean(connect, done);
                },
                (err) => {
                    done(err);
                },
            );
        });

        it("Should not connect to a non existing queue with 'noCreate: true'", (done) => {
            const connect = getConnection();
            const queueName = getQueueName();
            connect.registerQueue(queueName, { noCreate: true });

            connect
                .initializeTopology()
                .then(() => {
                    clean(
                        connect,
                        done,
                        new Error("Unexpected existing queue"),
                    );
                })
                .catch((err) => {
                    expect(err.message).to.contain("NOT-FOUND");
                    clean(connect, done);
                });
        });

        it("Should connect to an existing queue with 'noCreate: true'", (done) => {
            const connection = getConnection();
            const queueName = getQueueName();
            connection.registerQueue(queueName);

            connection.initializeTopology().then(() => {
                const queue = connection.registerQueue(queueName, {
                    noCreate: true,
                });
                queue
                    .init()!
                    .then(() => {
                        clean(connection, done);
                    })
                    .catch((err) => {
                        clean(connection, done, err);
                    });
            });
        });

        it("Should not connect to a non existing exchange with 'noCreate: true'", (done) => {
            const connection = getConnection();
            const exchangeName = getExchangeName();
            connection.registerExchange(exchangeName, "direct", {
                noCreate: true,
            });

            connection
                .initializeTopology()
                .then(() => {
                    clean(
                        connection,
                        done,
                        new Error(
                            "Unexpected existing exchange: " + exchangeName,
                        ),
                    );
                })
                .catch((err) => {
                    expect(err.message).to.contain("NOT-FOUND");
                    clean(connection, done);
                });
        });

        it("Should connect to an existing exchange with 'noCreate: true'", (done) => {
            const connection = getConnection();

            const exchangeName = getExchangeName();
            connection.registerExchange(exchangeName, "fanout");

            connection.initializeTopology().then(() => {
                const exchange = connection.registerExchange(
                    exchangeName,
                    "fanout",
                    { noCreate: true },
                );
                exchange
                    .init()!
                    .then(() => {
                        clean(connection, done);
                    })
                    .catch((err) => {
                        clean(connection, done, err);
                    });
            });
        });
    });
});
