import * as AmqpLib from "amqplib/callback_api";
import { Client } from "./binding";
import log from "./log";
import { Queue } from "./queue";

export enum MessageType {
    EntityMessage = "entity",
    ActionMessage = "event",
}

export type ExternalContent = Buffer | string | JSON | {};

export interface MessageProperties {
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

export class Message {
    private content: Buffer;
    private properties: MessageProperties;

    private _fields?: AmqpLib.MessageFields;
    private _channel?: AmqpLib.Channel;
    private _message?: AmqpLib.Message;

    constructor(content: ExternalContent, options: MessageProperties) {
        this.properties = options;
        this.content = this.setBufferContent(content);
    }

    public getContent(): ExternalContent {
        let content = this.content.toString();
        if (this.properties.contentType === "application/json") {
            content = JSON.parse(content);
        }
        return content;
    }

    public getProperties(): MessageProperties {
        return this.properties;
    }
    public setMessageChannel(channel: AmqpLib.Channel) {
        this._channel = channel;
    }

    public setMessage(message: AmqpLib.Message) {
        this._message = message;
    }

    public setFields(fields: AmqpLib.MessageFields) {
        this._fields = fields;
    }

    public setChannel(channel?: AmqpLib.Channel) {
        this._channel = channel;
    }

    public ack(all?: boolean) {
        if (this._channel && this._message) {
            this._channel.ack(this._message, all);
        } else {
            throw new Error("Channel or message undefined");
        }
    }

    public reject(requeue: boolean = false) {
        if (this._channel && this._message) {
            this._channel.reject(this._message, requeue);
        } else {
            throw new Error("Channel or message undefined");
        }
    }

    public nack(all?: boolean, requeue?: boolean) {
        if (this._channel && this._message) {
            this._channel.nack(this._message, all, requeue);
        } else {
            throw new Error("Channel or message undefined");
        }
    }

    public async send(target: Client, routingKey: string = ""): Promise<void> {
        let exchange = "";
        let key = routingKey;

        if (target instanceof Queue) {
            key = target.name;
        } else {
            exchange = target.name;
        }

        await target.init();
        await this.sendMessage(target, key, exchange);
    }

    public get fields() {
        return this._fields;
    }

    /**
     * Private methods
     */

    private async sendMessage(
        target: Client,
        routingKey: string,
        exchange: string,
    ) {
        try {
            target.channel.publish(
                exchange,
                routingKey,
                this.content,
                this.properties,
            );
        } catch (error) {
            log.debug(`Send message to broker error ${error.message}`, {
                module: "amqp",
            });
            const targetName = target.name;
            const connection = target.connection;
            log.debug(
                `Send message to broker error, reCreateTopology reconnect`,
                {
                    module: "amqp",
                },
            );

            await connection.reCreateWithTopology(error);
            log.debug(`Retrying to send message`, {
                module: "amqp",
            });

            if (target instanceof Queue) {
                connection.queues[targetName].publish(
                    this.content,
                    this.properties,
                );
            } else {
                connection.exchanges[targetName].publish(
                    this.content,
                    routingKey,
                    this.properties,
                );
            }
        }
    }

    private setBufferContent(content: ExternalContent) {
        if (typeof content === "string") {
            return new Buffer(content);
        } else if (!(content instanceof Buffer)) {
            this.properties.contentType =
                "application/json";
            return new Buffer(JSON.stringify(content));
        } else {
            return content;
        }
    }
}
