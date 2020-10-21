import * as AmqpLib from "amqplib";
import { Binding } from "./binding";
import { Connection } from "./connection";
import { AmqpLibErrors } from "./constants";
import { Exchange } from "./exchange";
import log from "./log";
import { ExternalContent, Message, MessageProperties } from "./message";

export interface Options {
  exclusive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: { [key: string]: string | number | boolean };
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

export type Consumer = (
  msg: Message,
  channel?: AmqpLib.Channel,
) => Promise<void | number> | void;

const DIRECT_QUEUE = "amq.rabbitmq.reply-to";

export class Queue {
  public static Serialize(
    content: ExternalContent,
    options: MessageProperties,
  ): Buffer {
    if (typeof content === "string") {
      return new Buffer(content);
    } else if (!(content instanceof Buffer)) {
      options.contentType = "application/json";
      return new Buffer(JSON.stringify(content));
    } else {
      return content;
    }
  }

  public static Deserialize(message: AmqpLib.Message): Message | string {
    const content = message.content.toString();
    if (message.properties.contentType === "application/json") {
      return JSON.parse(content);
    }
    return content;
  }

  private _connection: Connection;
  private _name: string;
  private _options: Options;

  private _deleting?: Promise<PurgeResult>;
  private _closing?: Promise<void>;
  private _purging?: Promise<AmqpLib.Replies.PurgeQueue>;

  private _consumerStopping: boolean = false;

  private _consumer?: Consumer;
  private _consumerOptions?: ConsumerOptions;
  private _consumerTag?: string;
  private _channel?: AmqpLib.Channel;

  private _promisedQueue?: Promise<InitResult>;
  private _promisedConsumer?: Promise<ConsumerResult>;

  constructor(connection: Connection, name: string, options: Options = {}) {
    this._connection = connection;
    this._name = name;
    this._options = options;
    this.consumerWrapper = this.consumerWrapper.bind(this);

    this._connection.addQueue(this);
    this.buildQueue();
  }

  public async publish(content: ExternalContent, options: object = {}) {
    const newOptions = { ...options };
    const result = Queue.Serialize(
      content,
      newOptions as AmqpLib.MessageProperties,
    );
    try {
      await this._promisedQueue;
      this.guardedChannel().sendToQueue(this._name, result, newOptions);
    } catch (error) {
      const queueName = this._name;
      const connection = this._connection;
      await connection.reCreateWithTopology(error);
      connection.queues[queueName].publish(content, newOptions);
    }
  }

  public buildQueue() {
    this._promisedQueue = this.connectQueue();
  }

  public init(): Promise<InitResult> | undefined {
    return this._promisedQueue;
  }

  public deleteQueue(): Promise<PurgeResult> {
    if (!this._deleting) {
      this._deleting = this.delete();
    }
    return this._deleting;
  }

  public closeQueue(): Promise<void> {
    if (!this._closing) {
      this._closing = this.close();
    }
    return this._closing;
  }

  public purgeQueue(): Promise<AmqpLib.Replies.PurgeQueue> {
    if (!this._purging) {
      this._purging = this.purge();
    }
    return this._purging;
  }

  public subscribeConsumer(
    consume: Consumer,
    options: ConsumerOptions = {},
  ): Promise<void> | undefined {

    if (this._promisedConsumer) {
      throw new Error(AmqpLibErrors.consumerAlreadyEstablished);
    }

    this._consumerOptions = options;
    this._consumer = consume;
    this.initConsumer();
    return this._promisedConsumer;
  }

  public async unsubscribeConsumer(): Promise<void> {
    if (!this._promisedConsumer || this._consumerStopping) {
      return;
    }

    this._consumerStopping = true;

    await this._promisedConsumer;

    if (!this._consumerTag) {
      throw new Error(AmqpLibErrors.corruptConsumer);
    }

    await this.guardedChannel().cancel(this._consumerTag);
    delete this._promisedConsumer;
    delete this._consumer;
    delete this._consumerOptions;
    delete this._consumerStopping;
  }

  public async send(message: Message): Promise<void> {
    await message.send(this);
  }

  public async prefetch(count: number): Promise<void> {
    await this._promisedQueue;
    this.guardedChannel().prefetch(count);
    this._options.prefetch = count;
  }

  public async recover(): Promise<AmqpLib.Replies.Empty> {
    await this._promisedQueue;
    return this.guardedChannel().recover();
  }

  public async rpc(params: object): Promise<Message> {
      await this._promisedQueue;
      return this.initRpc(params);
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
    expression = "",
  ): Promise<void> {
    return this._connection.bindings[
      Binding.GenerateId(origin, this, expression)
    ].deleteBinding();
  }

  public initConsumer(): void {
    this._promisedConsumer = this.connectConsumer();
  }

  public get connection(): Connection {
    return this._connection;
  }

  public get channel(): AmqpLib.Channel {
    return this.guardedChannel();
  }

  get name(): string {
    return this._name;
  }

  get consumer(): Consumer | undefined {
    return this._consumer;
  }

  /**
   * Private methods
   */

  private async connectQueue(): Promise<InitResult> {
    try {
      await this._connection.init();
      const internalConnection = this._connection.connection;

      if (!internalConnection) {
        throw new Error(AmqpLibErrors.corruptConnection);
      }

      this._channel = await internalConnection.createChannel();
      let result: InitResult;
      if (this._options.noCreate) {
        result = await this._channel.checkQueue(this._name);
      } else {
        result = await this._channel.assertQueue(this._name, this._options);
      }
      if (this._options.prefetch && this._channel) {
        this._channel.prefetch(this._options.prefetch);
      }
      return result;
    } catch (error) {
      log.error(
        `Failed to create channel from the connection: ${error.message}`,
        {
          module: "amqp",
        },
      );
      this._connection.removeQueue(this._name);
      throw error;
    }
  }

  private async delete(): Promise<PurgeResult> {
    await this._promisedQueue;
    await Binding.RemoveBindings(this);
    await this.unsubscribeConsumer();
    const ok = await this.guardedChannel().deleteQueue(this._name);
    await this.invalidate();
    return ok;
  }

  private async close(): Promise<void> {
    await this._promisedQueue;
    await Binding.RemoveBindings(this);
    await this.unsubscribeConsumer();
    await this.invalidate();
  }

  private async purge(): Promise<AmqpLib.Replies.PurgeQueue> {
    await this._promisedQueue;
    const ok = await this.guardedChannel().purgeQueue(this._name);
    return ok;
  }

  private async invalidate(): Promise<void> {
    delete this._promisedQueue; // invalidate promise
    this._connection.removeQueue(this._name);
    await this.guardedChannel().close();
    delete this._channel;
    delete this._connection;
  }

  private async connectConsumer(): Promise<ConsumerResult> {
    await this._promisedQueue;
    const ok = await this.guardedChannel().consume(
      this._name,
      this.consumerWrapper,
      this._consumerOptions);
    this._consumerTag = ok.consumerTag;
    return ok;
  }

  private async consumerWrapper(message: AmqpLib.Message | null): Promise<void> {
    try {
      if (!message) {
        // TODO: not sure what happens here
        return;
      }

      const result = new Message(message.content, message.properties);
      result.setFields(message.fields);
      result.setMessage(message);
      result.setChannel(this._channel);

      if (!this._consumer) {
        throw new Error(AmqpLibErrors.requiredConsumerFunction);
      }
      await this._consumer(result);

      if (message.properties.replyTo) {
        const options = {};
        const value = Queue.Serialize(result, options);
        this.guardedChannel().sendToQueue(message.properties.replyTo, value, options);
      }
    } catch (error) {
      log.error(`Consume function returned error: ${error.message}`);
    }
  }

  // TODO: first attempt improve later
  private async initRpc(parmas: ExternalContent): Promise<Message> {
    let consumerTag: string;

    return new Promise((resolve) => {
        this.guardedChannel().consume(
          DIRECT_QUEUE,
          (result: AmqpLib.Message | null) => {

            const msg = this.guardedResult(result);
            this.guardedChannel().cancel(consumerTag);
            const answer = new Message(msg.content, msg.properties);
            answer.setFields(msg.fields);
            resolve(answer);
          },
        { noAck: true }).then(async (ok) => {
            consumerTag = ok.consumerTag;
            const message = new Message(parmas, {
                replyTo: DIRECT_QUEUE,
              });
            await message.send(this);
          });
      });
  }

  private guardedChannel(): AmqpLib.Channel {
    if (!this._channel) {
      throw new Error(AmqpLibErrors.corruptChannel);
    }
    return this._channel;
  }

  private guardedResult(result: AmqpLib.Message | null): AmqpLib.Message {
    if (!result) {
      throw new Error(AmqpLibErrors.noMessageConsumed);
    }
    return result;
  }
}
