/// <reference types="node" />
import * as AmqpLib from "amqplib/callback_api";
import { Binding } from "./binding";
import { Connection } from "./connection";
import { Exchange } from "./exchange";
import { ExternalContent, Message, Properties } from "./message";
export interface Options {
    exclusive?: boolean;
    durable?: boolean;
    autoDelete?: boolean;
    arguments?: {
        [key: string]: string;
    };
    messageTtl?: number;
    expires?: number;
    deadLetterExchange?: string;
    maxLength?: number;
    prefetch?: number;
    noCreate?: boolean;
}
export interface InitResult {
    queue: string;
    messageCount: number;
    consumerCount: number;
}
export interface PurgeResult {
    messageCount: number;
}
export interface ConsumerOptions {
    consumerTag?: string;
    noLocal?: boolean;
    noAck?: boolean;
    manualAck?: boolean;
    exclusive?: boolean;
    priority?: number;
    arguments?: object;
}
export interface ConsumerResult {
    consumerTag: string;
}
export declare type Consumer = (msg: Message, channel?: AmqpLib.Channel) => Promise<void> | void;
export declare class Queue {
    static Serialize(content: ExternalContent, options: Properties): Buffer;
    static Deserialize(message: AmqpLib.Message): Message | string;
    private _connection;
    private _name;
    private _options;
    private _deleting?;
    private _closing?;
    private _consumerStopping;
    private _consumer?;
    private _consumerOptions?;
    private _consumerTag?;
    private _channel?;
    private _promisedQueue?;
    private _promisedConsumer?;
    constructor(connection: Connection, name: string, options?: Options);
    publish(content: ExternalContent, options?: object): Promise<void>;
    buildQueue(): void;
    init(): Promise<InitResult> | undefined;
    deleteQueue(): Promise<PurgeResult>;
    closeQueue(): Promise<void>;
    subscribeConsumer(consume: Consumer, options?: ConsumerOptions): Promise<void> | undefined;
    unsubscribeConsumer(): Promise<void>;
    send(message: Message): void;
    prefetch(count: number): Promise<void>;
    recover(): Promise<void>;
    rpc(params: object): Promise<Message>;
    bind(origin: Exchange, expression?: string, args?: object): Promise<Binding> | undefined;
    unbind(origin: Exchange, expression?: string, args?: object): Promise<void>;
    initConsumer(): void;
    get connection(): Connection;
    get channel(): AmqpLib.Channel;
    get name(): string;
    get consumer(): Consumer | undefined;
    /**
     * Private methods
     */
    private connectQueue;
    private assertQueue;
    private delete;
    private close;
    private invalidate;
    private connectConsumer;
    private consumerWrapper;
    private initRpc;
}
