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

        this._target.connection.addBinding(
            Binding.GenerateId(this._origin, this._target, this._expression),
            this,
        );
        this.buildBinding();
    }

    public buildBinding() {
        this.promisedBinding = this.connectBinding();
    }

    public init(): Promise<Binding> | undefined {
        return this.promisedBinding;
    }

    public async deleteBinding(): Promise<void> {
        await this._target.init();
        if (this._target instanceof Queue) {
            await this.deleteQueueAsTarget();
        } else {
            await this.deleteExchangeAsTarget();
        }
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

    private async connectBinding(): Promise<Binding> {
        await this._target.init();
        if (this._target instanceof Queue) {
            return this.processQueueAsTarget();
        }
        return this.processExchangeAsTarget();
    }

    private async processQueueAsTarget(): Promise<Binding> {
        const queue = this._target;
        try {
            await queue.channel.bindQueue(
                queue.name,
                this._origin.name,
                this._expression,
                this._args,
            );
            return this;
        } catch (error) {
            log.error(
                `Failed to create queue binding (${this._origin.name} -> ${queue.name})`,
                {
                    module: "amqp",
                },
            );
            queue.connection.removeBinding(
                Binding.GenerateId(
                    this._origin,
                    this._target,
                    this._expression,
                ),
            );
            throw error;
        }
    }
    private async deleteQueueAsTarget(): Promise<void> {
        const queue = this._target;
        try {
            await queue.channel.unbindQueue(
                queue.name,
                this._origin.name,
                this._expression,
                this._args,
            );
            queue.connection.removeBinding(
                Binding.GenerateId(
                    this._origin,
                    this._target,
                    this._expression,
                ),
            );
        } catch (error) {
            log.error(
                `Failed to unbind queue binding (${this._origin.name} -> ${queue.name})`,
                {
                    module: "amqp",
                },
            );
            throw error;
        }
    }

    private async processExchangeAsTarget(): Promise<Binding> {
        const exchange = this._target;
        await exchange.init();
        try {
            await exchange.channel.bindExchange(
                exchange.name,
                this._origin.name,
                this._expression,
                this._args,
            );
            return this;
        } catch (error) {
            log.error(
                `Failed to create exchange binding (${this._origin.name} -> ${exchange.name})`,
                {
                    module: "amqp",
                },
            );
            exchange.connection.removeBinding(
                Binding.GenerateId(
                    this._origin,
                    this._target,
                    this._expression,
                ),
            );
            throw error;
        }
    }
    private async deleteExchangeAsTarget(): Promise<void> {
        const exchange = this._target;
        await exchange.init();
        try {
            await exchange.channel.unbindExchange(
                exchange.name,
                this._origin.name,
                this._expression,
                this._args,
            );
            exchange.connection.removeBinding(
                Binding.GenerateId(
                    this._origin,
                    this._target,
                    this._expression,
                ),
            );
        } catch (error) {
            log.error(
                `Failed to unbind exchange binding (${this._origin.name} -> ${exchange.name})`,
                {
                    module: "amqp",
                },
            );
            throw error;
        }
    }
}
