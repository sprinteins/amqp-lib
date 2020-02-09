import * as AmqpLib from "amqplib/callback_api";
import { EventEmitter } from "events";
import { Binding, Client } from "./binding";
import { Exchange, Options as ExchangeOptions } from "./exchange";
import log from "./log";
import { Options as QueueOptions, Queue } from "./queue";

export interface ReconnectStrategy {
    retries: number;
    interval: number;
}

export interface Topology {
    exchanges: ExchangeInterface[];
    queues: QueueInterface[];
    bindings: BindingInterface[];
}

export interface ExchangeInterface {
    name: string;
    type?: string;
    options?: object;
}

export interface QueueInterface {
    name: string;
    options?: object;
}

export interface BindingInterface {
    origin: string;
    queue?: string;
    exchange?: string;
    expression?: string;
    args?: object;
}

export class Connection extends EventEmitter {
    // public variable
    public isConnected = false;

    private url: string;
    private reconnectStrategy: ReconnectStrategy;
    private alreadyOnceConnected = false;

    private _retry: number;
    private _rebuilding: boolean = false;
    private _isClosing: boolean = false;

    private _exchanges: { [id: string]: Exchange };
    private _queues: { [id: string]: Queue };
    private _bindings: { [id: string]: Binding };

    private _connection?: AmqpLib.Connection;
    private _promisedConnection?: Promise<void>;

    constructor(
        url = "amqp://localhost",
        reconnectStrategy: ReconnectStrategy = {
            interval: 2000,
            retries: 0,
        },
    ) {
        super();

        this._retry = -1;
        this.url = url;
        this.reconnectStrategy = reconnectStrategy;

        this._exchanges = {};
        this._queues = {};
        this._bindings = {};

        this.tryToConnect = this.tryToConnect.bind(this);
        this.initConnection = this.initConnection.bind(this);

        this.buildConnection();
    }

    public async reCreateWithTopology(error: Error): Promise<void> {
        log.warn(`Connection error occurred: ${error.message}`, {
            module: "amqp",
        });

        log.debug(`Re establishing Connection now`, { module: "amqp" });
        this.buildConnection();

        Object.keys(this._exchanges).forEach((key: string) => {
            const exchange: Exchange = this._exchanges[key];
            log.debug(`Rebuild Exchange: ${exchange.name}`, { module: "amqp" });
            exchange.buildExchange();
        });
        Object.keys(this._queues).forEach((key: string) => {
            const queue: Queue = this._queues[key];
            const consumer = queue.consumer;
            log.debug(`Rebuild Queue: ${queue.name}`, { module: "amqp" });
            queue.buildQueue();
            if (consumer) {
                queue.initConsumer();
            }
        });
        Object.keys(this._bindings).forEach((key: string) => {
            const binding: Binding = this._bindings[key];
            log.debug(
                `Rebuild binding from: ${binding.origin.name} to ${binding.target.name}`,
                { module: "amqp" },
            );
            binding.buildBinding();
        });

        log.debug(`Trying to initialize topology`, { module: "amqp" });

        return new Promise(async (resolve, reject) => {
            try {
                await this.initializeTopology();
                log.debug(`Rebuild Successful`, { module: "amqp" });
                resolve();
            } catch (error) {
                log.debug(`Rebuild Failed: ${error.message}`, {
                    module: "amqp",
                });
                reject(error);
            }
        });
    }
    public initializeTopology(): Promise<unknown> {
        const allTopologies: (Promise<unknown> | undefined)[] = [];
        Object.keys(this._exchanges).forEach((key: string) => {
            const exchange: Exchange = this._exchanges[key];
            allTopologies.push(exchange.init());
        });
        Object.keys(this._queues).forEach((key: string) => {
            const queue: Queue = this._queues[key];
            allTopologies.push(queue.init());
        });
        Object.keys(this._bindings).forEach((key: string) => {
            const binding: Binding = this._bindings[key];
            allTopologies.push(binding.init());
        });

        return Promise.all(allTopologies);
    }

    public deRegisterTopology(): Promise<unknown> {
        const allTopologies: Promise<unknown>[] = [];
        Object.keys(this._exchanges).forEach((key: string) => {
            const exchange: Exchange = this._exchanges[key];
            allTopologies.push(exchange.deleteExchange());
        });
        Object.keys(this._queues).forEach((key: string) => {
            const queue: Queue = this._queues[key];
            allTopologies.push(queue.deleteQueue());
        });
        Object.keys(this._bindings).forEach((key: string) => {
            const binding: Binding = this._bindings[key];
            allTopologies.push(binding.deleteBinding());
        });

        return Promise.all(allTopologies);
    }

    public registerExchange(
        name: string,
        type?: string,
        options?: ExchangeOptions,
    ): Exchange {
        let exchange = this._exchanges[name];
        if (!exchange) {
            exchange = new Exchange(this, name, type, options);
        }
        return exchange;
    }

    public registerQueue(name: string, options?: QueueOptions): Queue {
        let queue = this._queues[name];
        if (!queue) {
            queue = new Queue(this, name, options);
        }
        return queue;
    }

    public registerTopology(topology: Topology) {
        const allTopologies: (Promise<unknown> | undefined)[] = [];
        if (topology.exchanges) {
            topology.exchanges.forEach((exchange: ExchangeInterface) => {
                const exchangePromise = this.registerExchange(
                    exchange.name,
                    exchange.type,
                    exchange.options,
                );
                allTopologies.push(exchangePromise.init());
            });
        }

        if (topology.queues) {
            topology.queues.forEach((queue: QueueInterface) => {
                const queuePromise = this.registerQueue(
                    queue.name,
                    queue.options,
                );
                allTopologies.push(queuePromise.init());
            });
        }

        if (topology.bindings) {
            topology.bindings.forEach((binding: BindingInterface) => {
                const origin = this.registerExchange(binding.origin);
                let target: Client;
                if (binding.exchange) {
                    target = this.registerExchange(binding.exchange);
                } else if (binding.queue) {
                    target = this.registerQueue(binding.queue);
                } else {
                    throw new Error("Define exchange or queue one of them");
                }

                allTopologies.push(
                    target.bind(origin, binding.expression, binding.args),
                );
            });
        }

        return Promise.all(allTopologies);
    }

    public async close(): Promise<void> {
        this._isClosing = true;
        return new Promise(async (resolve, reject) => {
            await this._promisedConnection;
            if (this._connection) {
                this._connection.close((error) => {
                    if (!error) {
                        this.isConnected = false;
                        this.emit("closed_connection");
                        resolve();
                    }
                    reject(error);
                });
            }
        });
    }

    public addExchange(exchange: Exchange) {
        this._exchanges[exchange.name] = exchange;
    }

    public addQueue(queue: Queue) {
        this._queues[queue.name] = queue;
    }

    public addBinding(name: string, binding: Binding) {
        this._bindings[name] = binding;
    }

    public removeExchange(name: string) {
        delete this._exchanges[name];
    }

    public removeQueue(name: string) {
        delete this._queues[name];
    }

    public removeBinding(name: string) {
        delete this._bindings[name];
    }

    public init(): Promise<void> | undefined {
        return this._promisedConnection;
    }

    public get connection(): AmqpLib.Connection | undefined {
        return this._connection;
    }

    public get exchanges(): Connection["_exchanges"] {
        return this._exchanges;
    }

    public get queues(): Connection["_queues"] {
        return this._queues;
    }

    public get bindings(): Connection["_bindings"] {
        return this._bindings;
    }

    /**
     * Private methods
     */

    private buildConnection() {
        try {
            if (this._rebuilding) {
                // one build process at a time
                log.debug(
                    "Connection rebuild in progress, making an active connection attempt",
                    { module: "amqp" },
                );
                return;
            }

            this._retry = -1;
            this._rebuilding = true;
            this._isClosing = false;

            this._promisedConnection = new Promise(this.tryToConnect);
        } catch (error) {
            this._rebuilding = false;
            log.warn("Error establishing connection", { module: "amqp" });
            this.emit("error_connection", error);
        }
    }

    private async tryToConnect(
        resolve: () => void,
        reject: (error: Error) => void,
    ) {

      this.initConnection(0, (error) => {
        if (error)  {
          reject(error);
        }

        this._rebuilding = false;
        if (this.alreadyOnceConnected) {
              log.warn("Connection re established", { module: "amqp" });
              this.emit("re_established_connection");
          } else {
              log.info("Connection established", { module: "amqp" });
              this.emit("open_connection");
              this.alreadyOnceConnected = true;
          }
        resolve();
      });
    }

    private initConnection(retry: number, callback: (error?: Error) => void) {
      AmqpLib.connect(this.url, (error, connection) => {
        if (!error) {
            this._connection = connection;
            this.isConnected = true;
            connection.on("error", this.restart);
            connection.on("error", this.onClose);
            this.alreadyOnceConnected = false;
            callback();
        } else {
            // make sure we only retry once
            if (retry <= this._retry) {
                log.warn("rety issues" + retry, { module: "amqp" });
                return;
            }

            log.warn("Error connection failed", { module: "amqp" });

            this._retry = retry;

            if (
                this.reconnectStrategy.retries === 0 ||
                this.reconnectStrategy.retries > retry
            ) {
                log.warn(`Retry attempt:  ${retry}`, {
                    module: "amqp",
                });
                this.emit("trying_connect");
                setTimeout(
                    this.initConnection,
                    this.reconnectStrategy.interval,
                    retry + 1,
                    callback,
                );
            } else {
                // error no retry strategy
                log.warn(
                    `Connection failed: all retry attempts exhausted:  ${retry}`,
                    { module: "amqp" },
                );
                callback(error);
            }
        }
    });
    }

    private restart(error: Error) {
        if (this._connection) {
          this._connection.removeListener("error", this.restart);
          this.reCreateWithTopology(error);
        }
    }

    private onClose() {
        if (this._connection) {
            this._connection.removeListener("close", this.onClose);
            if (!this._isClosing) {
                this.emit("lost_connection");
                this.restart(new Error("Connection closed by remote host"));
            }
        }
    }
}
