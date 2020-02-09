/// <reference types="node" />
import * as AmqpLib from "amqplib/callback_api";
import { Client } from "./binding";
declare enum MessageType {
    EntityMessage = "entity",
    ActionMessage = "event"
}
export declare type ExternalContent = Buffer | string | JSON | {};
export interface Properties {
    contentType?: string;
    contentEncoding?: string;
    headers?: AmqpLib.MessagePropertyHeaders;
    deliveryMode?: boolean | number;
    priority?: number;
    correlationId?: string;
    replyTo?: string;
    expiration?: string;
    messageId?: string;
    timestamp?: number;
    type?: MessageType;
    userId?: string;
    appId?: string;
    clusterId?: string;
    CC?: string | string[];
    mandatory?: boolean;
    persistent?: boolean;
    BCC?: string | string[];
}
export declare class Message {
    private content;
    private properties;
    private _fields?;
    private _channel?;
    private _message?;
    constructor(content: ExternalContent, options: Properties);
    getContent(): ExternalContent;
    getProperties(): Properties;
    setMessageChannel(channel: AmqpLib.Channel): void;
    setMessage(message: AmqpLib.Message): void;
    setFields(fields: AmqpLib.MessageFields): void;
    setChannel(channel?: AmqpLib.Channel): void;
    ack(all?: boolean): void;
    reject(requeue?: boolean): void;
    nack(all?: boolean, requeue?: boolean): void;
    send(target: Client, routingKey?: string): Promise<void>;
    get fields(): AmqpLib.MessageFields | undefined;
    /**
     * Private methods
     */
    private sendMessage;
    private setBufferContent;
}
export {};
