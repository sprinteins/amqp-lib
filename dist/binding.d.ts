import { Exchange } from "./exchange";
import { Queue } from "./queue";
export declare type Client = Exchange | Queue;
export declare class Binding {
    static GenerateId(origin: Client, target: Client, expression?: string): string;
    static RemoveBindings(client: Client): Promise<void[]>;
    private _origin;
    private _target;
    private _expression;
    private _args;
    private promisedBinding?;
    constructor(origin: Exchange, target: Client, expression?: string, args?: {});
    buildBinding(): void;
    init(): Promise<Binding> | undefined;
    deleteBinding(): Promise<void>;
    get origin(): Exchange;
    get target(): Client;
    /**
     * Private methods
     */
    private connectBinding;
    private processQueueAsTarget;
    private deleteQueueAsTarget;
    private processExchangeAsTarget;
    private deleteExchangeAsTarget;
}
