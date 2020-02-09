/// <reference types="node" />
import * as AmqpLib from "amqplib/callback_api";
import { EventEmitter } from "events";
import { Binding } from "./binding";
import { Exchange, Options as ExchangeOptions } from "./exchange";
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
export declare class Connection extends EventEmitter {
    isConnected: boolean;
    private url;
    private reconnectStrategy;
    private alreadyOnceConnected;
    private _retry;
    private _rebuilding;
    private _isClosing;
    private _exchanges;
    private _queues;
    private _bindings;
    private _connection?;
    private _promisedConnection?;
    constructor(url?: string, reconnectStrategy?: ReconnectStrategy);
    reCreateWithTopology(error: Error): Promise<void>;
    initializeTopology(): Promise<unknown>;
    deRegisterTopology(): Promise<unknown>;
    registerExchange(name: string, type?: string, options?: ExchangeOptions): Exchange;
    registerQueue(name: string, options?: QueueOptions): Queue;
    registerTopology(topology: Topology): Promise<unknown[]>;
    close(): Promise<void>;
    addExchange(exchange: Exchange): void;
    addQueue(queue: Queue): void;
    addBinding(name: string, binding: Binding): void;
    removeExchange(name: string): void;
    removeQueue(name: string): void;
    removeBinding(name: string): void;
    init(): Promise<void> | undefined;
    get connection(): AmqpLib.Connection | undefined;
    get exchanges(): Connection["_exchanges"];
    get queues(): Connection["_queues"];
    get bindings(): Connection["_bindings"];
    /**
     * Private methods
     */
    private buildConnection;
    private tryToConnect;
    private initConnection;
    private restart;
    private onClose;
}
