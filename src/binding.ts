import { Exchange } from "./exchange";
import log from "./log";
import { Queue } from "./queue";

export type Client = Exchange | Queue;

export class Binding {
  public static GenerateId(
    origin: Client,
    target: Client,
    expression?: string,
  ): string {
    const pattern = expression || "";
    return (
      "[" +
      origin.name +
      "]to" +
      (target instanceof Queue ? "Queue" : "Exchange") +
      "[" +
      target.name +
      "]" +
      pattern
    );
  }

  public static RemoveBindings(client: Client) {
    const connection = client.connection;
    const allBindings: Promise<void>[] = [];
    const bindings = connection.bindings;
    Object.keys(bindings).forEach((key: string) => {
      const binding: Binding = bindings[key];
      if (binding._origin === client || binding._target === client) {
        allBindings.push(binding.deleteBinding());
      }
    });

    return Promise.all(allBindings);
  }

  private _origin: Exchange;
  private _target: Client;
  private _expression: string;
  private _args: { [key: string]: string };

  private promisedBinding?: Promise<Binding>;

  constructor(origin: Exchange, target: Client, expression = "", args = {}) {
    this._origin = origin;
    this._target = target;
    this._expression = expression;
    this._args = args;

    this.connectBinding = this.connectBinding.bind(this);

    this._target.connection.addBinding(
      Binding.GenerateId(this._origin, this._target, this._expression),
      this,
    );
    this.buildBinding();
  }

  public buildBinding() {
    this.promisedBinding = new Promise<Binding>(this.connectBinding);
  }

  public init(): Promise<Binding> | undefined {
    return this.promisedBinding;
  }

  public deleteBinding(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this._target.init();
      if (this._target instanceof Queue) {
        this.deleteQueueAsTarget(resolve, reject);
      } else {
        this.deleteExchangeAsTarget(resolve, reject);
      }
    });
  }

  public get origin() {
    return this._origin;
  }

  public get target() {
    return this._target;
  }

  /**
   * Private methods
   */

  private async connectBinding(resolve: (binding?: Binding) => void, reject: (error: Error) => void) {
    await this._target.init();
    if (this._target instanceof Queue) {
      this.processQueueAsTarget(resolve, reject);
    } else {
      this.processExchangeAsTarget(resolve, reject);
    }
  }

  private async processQueueAsTarget(
    resolve: (binding?: Binding) => void,
    reject: (error: Error) => void,
  ) {
    const queue = this._target;
    queue.channel.bindQueue(
      queue.name,
      this._origin.name,
      this._expression,
      this._args,
      (error, ok) => {
        if (error) {
          log.error(
            `Failed to create queue binding (${this._origin.name} -> ${queue.name})`,
            {
              module: "amqp",
            },
          );
          queue.connection.removeBinding(
            Binding.GenerateId(this._origin, this._target, this._expression),
          );
          reject(error);
        } else {
          resolve(this);
        }
      },
    );
  }
  private async deleteQueueAsTarget(
    resolve: () => void,
    reject: (error: Error) => void,
  ) {
    const queue = this._target;
    queue.channel.unbindQueue(
      queue.name,
      this._origin.name,
      this._expression,
      this._args,
      (error: Error, ok: any) => {
        if (error) {
          log.error(
            `Failed to unbind queue binding (${this._origin.name} -> ${queue.name})`,
            {
              module: "amqp",
            },
          );
          reject(error);
        } else {
          queue.connection.removeBinding(
            Binding.GenerateId(this._origin, this._target, this._expression),
          );
          resolve();
        }
      },
    );
  }

  private async processExchangeAsTarget(
    resolve: (binding?: Binding) => void,
    reject: (error: Error) => void,
  ) {
    const exchange = this._target;
    await exchange.init();
    exchange.channel.bindExchange(
      exchange.name,
      this._origin.name,
      this._expression,
      this._args,
      (error: Error, ok: any) => {
        if (error) {
          log.error(
            `Failed to create exchange binding (${this._origin.name} -> ${exchange.name})`,
            {
              module: "amqp",
            },
          );
          exchange.connection.removeBinding(
            Binding.GenerateId(this._origin, this._target, this._expression),
          );
          reject(error);
        } else {
          resolve(this);
        }
      },
    );
  }
  private async deleteExchangeAsTarget(
    resolve: () => void,
    reject: (error: Error) => void,
  ) {
    const exchange = this._target;
    await exchange.init();
    exchange.channel.unbindExchange(
      exchange.name,
      this._origin.name,
      this._expression,
      this._args,
      (error: Error, ok: any) => {
        if (error) {
          log.error(
            `Failed to unbind exchange binding (${this._origin.name} -> ${exchange.name})`,
            {
              module: "amqp",
            },
          );
          reject(error);
        } else {
          exchange.connection.removeBinding(
            Binding.GenerateId(this._origin, this._target, this._expression),
          );
          resolve();
        }
      },
    );
  }
}
