import * as AmqpLib from "amqplib/callback_api";
import { Binding } from "./binding";
import { Connection } from "./connection";
import { ExternalContent, Message, MessageProperties } from "./message";
export interface Options {
    durable?: boolean;
    internal?: boolean;
    autoDelete?: boolean;
    alternateExchange?: string;
    arguments?: {
        [key: string]: string;
    };
    noCreate?: boolean;
}
export interface Result {
    exchange: string;
}
export declare class Exchange {
    private _connection;
    private _name;
    private _type;
    private _options;
    private _channel?;
    private _promisedExchange?;
    private _deleting?;
    private _closing?;
    constructor(connection: Connection, name: string, type?: string, options?: Options);
    publish(content: ExternalContent, routingKey: string | undefined, options: MessageProperties): Promise<void>;
    buildExchange(): Promise<void>;
    deleteExchange(): Promise<void>;
    closeExchange(): Promise<void>;
    send(message: Message, routingKey?: string): void;
    init(): Promise<Result> | undefined;
    bind(origin: Exchange, expression?: string, args?: object): Promise<Binding> | undefined;
    unbind(origin: Exchange, expression?: string, args?: object): Promise<void>;
    get connection(): Connection;
    get channel(): AmqpLib.Channel;
    get name(): string;
    get type(): string;
    /**
     * Private methods
     */
    private connectExchange;
    private assertExchange;
    private delete;
    private close;
    private invalidate;
}
