import * as AmqpLib from "amqplib";
import { Binding } from "./binding";
import { Connection } from "./connection";
import { AmqpLibErrors } from "./constants";
import log from "./log";
import { ExternalContent, Message, MessageProperties } from "./message";
import { Queue } from "./queue";

export interface Options {
    durable?: boolean;
    internal?: boolean;
    autoDelete?: boolean;
    alternateExchange?: string;
    arguments?: { [key: string]: string };
    noCreate?: boolean;
}

export interface Result {
    exchange: string;
}

export class Exchange {
    private _connection: Connection;
    private _name: string;
    private _type: string;
    private _options: Options;
    private _channel?: AmqpLib.Channel;

    private _promisedExchange?: Promise<Result | AmqpLib.Replies.Empty>;
    private _deleting?: Promise<void>;
    private _closing?: Promise<void>;

    constructor(
        connection: Connection,
        name: string,
        type: string = "",
        options: Options = {},
    ) {
        this._connection = connection;
        this._name = name;
        this._type = type;
        this._options = options;

        this.buildExchange();
    }

    public async publish(
        content: ExternalContent,
        routingKey = "",
        options: MessageProperties,
    ): Promise<void> {
        const newOptions = { ...options };

        const result = Queue.Serialize(content, newOptions);

        await this._promisedExchange;
        try {
            if (!this._channel) {
                throw new Error(AmqpLibErrors.corruptChannel);
            }
            this._channel.publish(this._name, routingKey, result, newOptions);
        } catch (error) {
            const exchangeName = this._name;
            const connection = this._connection;
            await connection.reCreateWithTopology(error);
            connection.exchanges[exchangeName].publish(
                content,
                routingKey,
                newOptions,
            );
        }
    }

    public buildExchange(): void {
        this._promisedExchange = this.connectExchange();
    }

    public deleteExchange(): Promise<void> {
        if (!this._deleting) {
            this._deleting = this.delete();
        }
        return this._deleting;
    }

    public closeExchange(): Promise<void> {
        if (!this._closing) {
            this._closing = this.close();
        }
        return this._closing;
    }

    public async send(message: Message, routingKey = ""): Promise<void> {
        await message.send(this, routingKey);
    }

    public init(): Promise<Result | AmqpLib.Replies.Empty> | undefined {
        return this._promisedExchange;
    }

    public bind(
        origin: Exchange,
        expression = "",
        args: object = {},
    ): Promise<Binding> | undefined {
        const binding = new Binding(origin, this, expression, args);
        return binding.init();
    }

    public unbind(
        origin: Exchange,
        expression = ""): Promise<void> {
        return this._connection.bindings[
            Binding.GenerateId(origin, this, expression)
        ].deleteBinding();
    }

    public get connection(): Connection {
        return this._connection;
    }

    public get channel(): AmqpLib.Channel {
        if (!this._channel) {
            throw new Error(AmqpLibErrors.corruptChannel);
        }
        return this._channel;
    }

    public get name(): string {
        return this._name;
    }

    public get type(): string {
        return this._type;
    }

    /**
     * Private methods
     */

    private async connectExchange(): Promise<Result | AmqpLib.Replies.Empty> {
        try {
            await this._connection.init();

            const internalConnection = this._connection.connection;

            if (!internalConnection) {
                throw new Error("Corrupt connection");
            }

            this._channel = await internalConnection.createChannel();
            let result: Result | AmqpLib.Replies.Empty;
            if (this._options.noCreate) {
                result = await this._channel.checkExchange(this._name);
            } else {
                result = await this._channel.assertExchange(
                    this._name,
                    this._type,
                    this._options,
                );
            }
            this._connection.addExchange(this);
            return result;
        } catch (error) {
            // error
            log.error(
                `Failed to create channel from the connection: ${error.message}`,
                {
                    module: "amqp",
                },
            );
            this._connection.removeExchange(this.name);
            throw error;
        }
    }

    private async delete() {
        await this._promisedExchange;
        await Binding.RemoveBindings(this);
        if (!this._channel) {
            throw new Error(AmqpLibErrors.corruptChannel);
        }

        await this._channel.deleteExchange(this._name, {});
        await this.invalidate();
    }

    private async close() {
        await this._promisedExchange;
        await Binding.RemoveBindings(this);
        await this.invalidate();
    }

    private async invalidate() {
        if (!this._channel) {
            throw new Error(AmqpLibErrors.corruptChannel);
        }
        await this._channel.close();
        delete this._channel;
        delete this._connection;
        delete this._promisedExchange; // invalidate promise
    }
}
