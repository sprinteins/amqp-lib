import * as AmqpLib from "amqplib/callback_api";
import { Binding } from "./binding";
import { Connection } from "./connection";
import { Exchange } from "./exchange";
import log from "./log";
import { ExternalContent, Message, MessageProperties } from "./message";
import { errors } from "./constants";

export interface Options {
  exclusive?: boolean;
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: { [key: string]: string };
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
) => Promise<void> | void;

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

    this.delete = this.delete.bind(this);
    this.close = this.close.bind(this);
    this.connectQueue = this.connectQueue.bind(this);
    this.connectConsumer = this.connectConsumer.bind(this);
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

    await this._promisedQueue;
    try {
      if (!this._channel) {
        throw new Error(errors.corruptChannel);
      }
      this._channel.sendToQueue(this._name, result, newOptions);
    } catch (error) {
      const queueName = this._name;
      const connection = this._connection;
      await connection.reCreateWithTopology(error);
      connection.queues[queueName].publish(content, newOptions);
    }
  }

  public buildQueue() {
    this._promisedQueue = new Promise<InitResult>(this.connectQueue);
  }

  public init(): Promise<InitResult> | undefined {
    return this._promisedQueue;
  }

  public async deleteQueue(): Promise<PurgeResult> {
    if (!this._deleting) {
      return new Promise(this.delete);
    }
    return this._deleting;
  }

  public async closeQueue(): Promise<void> {
    if (!this._closing) {
      return new Promise(this.close);
    }
    return this._closing;
  }

  public subscribeConsumer(
    consume: Consumer,
    options: ConsumerOptions = {},
  ): Promise<void> | undefined {
    if (this._promisedConsumer) {
      throw new Error(errors.consumerAlreadyEstablished);
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
    return new Promise(async (resolve, reject) => {
      await this._promisedConsumer;

      if (!this._channel) {
        reject(new Error(errors.corruptChannel));
        return;
      }

      if (!this._consumerTag) {
        reject(new Error(errors.corruptChannel));
        return;
      }
      this._channel.cancel(this._consumerTag, (error: Error, ok: AmqpLib.Replies.Empty) => {
        if (error) {
          reject(error);
        } else {
          delete this._promisedConsumer;
          delete this._consumer;
          delete this._consumerOptions;
          delete this._consumerStopping;
          resolve();
        }
      });
    });
  }

  public send(message: Message) {
    message.send(this);
  }

  public async prefetch(count: number): Promise<void> {
    await this._promisedQueue;
    if (!this._channel) {
      throw new Error(errors.corruptChannel);
    }
    this._channel.prefetch(count);
    this._options.prefetch = count;
  }

  public recover(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this._promisedQueue;
      if (!this._channel) {
        throw new Error(errors.corruptChannel);
      }
      this._channel.recover((error: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public rpc(params: object): Promise<Message> {
    return new Promise<Message>(async (resolve, reject) => {
      await this._promisedQueue;
      this.initRpc(resolve, reject, params);
    });
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
    args: object = {},
  ): Promise<void> {
    return this._connection.bindings[
      Binding.GenerateId(origin, this, expression)
    ].deleteBinding();
  }

  public initConsumer() {
    this._promisedConsumer = new Promise<ConsumerResult>(this.connectConsumer);
  }

  public get connection(): Connection {
    return this._connection;
  }

  public get channel(): AmqpLib.Channel {
    if (!this._channel) {
      throw new Error(errors.corruptChannel);
    }
    return this._channel;
  }

  get name() {
    return this._name;
  }

  get consumer() {
    return this._consumer;
  }

  /**
   * Private methods
   */

  private async connectQueue(
    resolve: (value: InitResult) => void,
    reject: (error: Error) => void,
  ) {
    try {
      await this._connection.init();
      const internalConnection = this._connection.connection;

      if (!internalConnection) {
        throw new Error(errors.corruptChannel);
      }

      internalConnection.createChannel((error: Error, channel: AmqpLib.Channel) => {
        if (!error) {
          this._channel = channel;

          if (this._options.noCreate) {
            this._channel.checkQueue(
              this._name,
              this.assertQueue(resolve, reject),
            );
          } else {
            this._channel.assertQueue(
              this._name,
              this._options,
              this.assertQueue(resolve, reject),
            );
          }
          return;
        }
        reject(error);
      });
    } catch (error) {
      // error
      log.error(
        `Failed to create channel from the connection: ${error.message}`,
        {
          module: "amqp",
        },
      );
    }
  }

  private assertQueue(
    resolve: (value: InitResult) => void,
    reject: (error: Error) => void,
  ) {
    return (error: Error, ok: AmqpLib.Replies.Empty) => {
      if (error) {
        log.error(`Failed to assert|check queue ${this._name}.`, {
          module: "amqp",
        });
        this._connection.removeQueue(this._name);
        reject(error);
      } else {
        if (this._options.prefetch && this._channel) {
          this._channel.prefetch(this._options.prefetch);
        }
        resolve(ok as InitResult);
      }
    };
  }

  private async delete(
    resolve: (value?: PurgeResult) => void,
    reject: (error: Error) => void,
  ) {
    await this._promisedQueue;
    await Binding.RemoveBindings(this);
    if (!this._channel) {
      reject(new Error(errors.corruptChannel));
      return;
    }

    await this.unsubscribeConsumer();
    this._channel.deleteQueue(this._name, {}, (error: Error, ok: AmqpLib.Replies.DeleteQueue) => {
      if (error) {
        reject(error);
      } else {
        this.invalidate(resolve, reject, ok);
      }
    });
  }

  private async close(resolve: () => void, reject: (error: Error) => void) {
    await this._promisedQueue;
    await Binding.RemoveBindings(this);
    if (!this._channel) {
      reject(new Error(errors.corruptChannel));
      return;
    }
    await this.unsubscribeConsumer();
    this.invalidate(resolve, reject);
  }

  private invalidate(
    resolve: (value?: PurgeResult) => void,
    reject: (error: Error) => void,
    value?: PurgeResult,
  ) {
    delete this._promisedQueue; // invalidate promise
    this._connection.removeQueue(this._name);

    if (!this._channel) {
      reject(new Error(errors.corruptChannel));
      return;
    }
    this._channel.close((error: Error) => {
      if (error) {
        reject(error);
      } else {
        delete this._channel;
        delete this._connection;
        resolve(value as PurgeResult);
      }
    });
  }

  private async connectConsumer(
    resolve: (result: ConsumerResult) => void,
    reject: (error: Error) => void,
  ) {
    await this._promisedQueue;

    if (!this._channel) {
      reject(new Error(errors.corruptChannel));
      return;
    }

    this._channel.consume(
      this._name,
      this.consumerWrapper,
      this._consumerOptions,
      (error: Error, ok: AmqpLib.Replies.Consume) => {
        if (error) {
          reject(error);
        } else {
          this._consumerTag = ok.consumerTag;
          resolve(ok);
        }
      },
    );

  }

  private async consumerWrapper(message: AmqpLib.Message | null) {

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
        throw new Error(errors.requiredConsumerFunction);
      }

      if (!this._channel) {
        throw new Error(errors.corruptChannel);
      }
      await this._consumer(result);

      if (message.properties.replyTo) {
        const options = {};
        const value = Queue.Serialize(result, options);

        this._channel.sendToQueue(message.properties.replyTo, value, options);
      }
    } catch (error) {
      log.error(`Consume function returned error: ${error.message}`);
    }
  }

  // TODO: first attempt improve later
  private initRpc(
    resolve: (message: Message) => void,
    reject: (error: Error) => void,
    parmas: ExternalContent,
  ) {
    let consumerTag: string;

    if (!this._channel) {
      reject(new Error(errors.corruptChannel));
      return;
    }

    this._channel.consume(
      DIRECT_QUEUE,
      (result: AmqpLib.Message | null) => {
        if (!this._channel) {
          reject(new Error(errors.corruptChannel));
          return;
        }

        if (!result) {
          reject(new Error(errors.noMessageConsumed));
          return;
        }

        this._channel.cancel(consumerTag);
        const answer = new Message(result.content, result.properties);
        answer.setFields(result.fields);
        resolve(answer);
      },
      { noAck: true },
      (error: Error, ok: AmqpLib.Replies.Consume) => {
        if (error) {
          reject(error);
        } else {
          consumerTag = ok.consumerTag;
          const message = new Message(parmas, {
            replyTo: DIRECT_QUEUE,
          });
          message.send(this);
        }
      },
    );
  }
}
