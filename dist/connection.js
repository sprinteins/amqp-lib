"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AmqpLib = __importStar(require("amqplib/callback_api"));
const events_1 = require("events");
const exchange_1 = require("./exchange");
const log_1 = __importDefault(require("./log"));
const queue_1 = require("./queue");
class Connection extends events_1.EventEmitter {
    constructor(url = "amqp://localhost", reconnectStrategy = {
        interval: 2000,
        retries: 0,
    }) {
        super();
        // public variable
        this.isConnected = false;
        this.alreadyOnceConnected = false;
        this._rebuilding = false;
        this._isClosing = false;
        this._retry = -1;
        this.url = url;
        this.reconnectStrategy = reconnectStrategy;
        this._exchanges = {};
        this._queues = {};
        this._bindings = {};
        this.tryToConnect = this.tryToConnect.bind(this);
        this.initConnection = this.initConnection.bind(this);
        this.buildConnection();
    }
    reCreateWithTopology(error) {
        return __awaiter(this, void 0, void 0, function* () {
            log_1.default.warn(`Connection error occurred: ${error.message}`, {
                module: "amqp",
            });
            log_1.default.debug(`Re establishing Connection now`, { module: "amqp" });
            this.buildConnection();
            Object.keys(this._exchanges).forEach((key) => {
                const exchange = this._exchanges[key];
                log_1.default.debug(`Rebuild Exchange: ${exchange.name}`, { module: "amqp" });
                exchange.buildExchange();
            });
            Object.keys(this._queues).forEach((key) => {
                const queue = this._queues[key];
                const consumer = queue.consumer;
                log_1.default.debug(`Rebuild Queue: ${queue.name}`, { module: "amqp" });
                queue.buildQueue();
                if (consumer) {
                    queue.initConsumer();
                }
            });
            Object.keys(this._bindings).forEach((key) => {
                const binding = this._bindings[key];
                log_1.default.debug(`Rebuild binding from: ${binding.origin.name} to ${binding.target.name}`, { module: "amqp" });
                binding.buildBinding();
            });
            log_1.default.debug(`Trying to initialize topology`, { module: "amqp" });
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.initializeTopology();
                    log_1.default.debug(`Rebuild Successful`, { module: "amqp" });
                    resolve();
                }
                catch (error) {
                    log_1.default.debug(`Rebuild Failed: ${error.message}`, {
                        module: "amqp",
                    });
                    reject(error);
                }
            }));
        });
    }
    initializeTopology() {
        const allTopologies = [];
        Object.keys(this._exchanges).forEach((key) => {
            const exchange = this._exchanges[key];
            allTopologies.push(exchange.init());
        });
        Object.keys(this._queues).forEach((key) => {
            const queue = this._queues[key];
            allTopologies.push(queue.init());
        });
        Object.keys(this._bindings).forEach((key) => {
            const binding = this._bindings[key];
            allTopologies.push(binding.init());
        });
        return Promise.all(allTopologies);
    }
    deRegisterTopology() {
        const allTopologies = [];
        Object.keys(this._exchanges).forEach((key) => {
            const exchange = this._exchanges[key];
            allTopologies.push(exchange.deleteExchange());
        });
        Object.keys(this._queues).forEach((key) => {
            const queue = this._queues[key];
            allTopologies.push(queue.deleteQueue());
        });
        Object.keys(this._bindings).forEach((key) => {
            const binding = this._bindings[key];
            allTopologies.push(binding.deleteBinding());
        });
        return Promise.all(allTopologies);
    }
    registerExchange(name, type, options) {
        let exchange = this._exchanges[name];
        if (!exchange) {
            exchange = new exchange_1.Exchange(this, name, type, options);
        }
        return exchange;
    }
    registerQueue(name, options) {
        let queue = this._queues[name];
        if (!queue) {
            queue = new queue_1.Queue(this, name, options);
        }
        return queue;
    }
    registerTopology(topology) {
        const allTopologies = [];
        if (topology.exchanges) {
            topology.exchanges.forEach((exchange) => {
                const exchangePromise = this.registerExchange(exchange.name, exchange.type, exchange.options);
                allTopologies.push(exchangePromise.init());
            });
        }
        if (topology.queues) {
            topology.queues.forEach((queue) => {
                const queuePromise = this.registerQueue(queue.name, queue.options);
                allTopologies.push(queuePromise.init());
            });
        }
        if (topology.bindings) {
            topology.bindings.forEach((binding) => {
                const origin = this.registerExchange(binding.origin);
                let target;
                if (binding.exchange) {
                    target = this.registerExchange(binding.exchange);
                }
                else if (binding.queue) {
                    target = this.registerQueue(binding.queue);
                }
                else {
                    throw new Error("Define exchange or queue one of them");
                }
                allTopologies.push(target.bind(origin, binding.expression, binding.args));
            });
        }
        return Promise.all(allTopologies);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isClosing = true;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this._promisedConnection;
                if (this._connection) {
                    this._connection.close((error) => {
                        if (!error) {
                            this.isConnected = false;
                            this.emit("closed_connection");
                            resolve();
                        }
                        reject(error);
                    });
                }
            }));
        });
    }
    addExchange(exchange) {
        this._exchanges[exchange.name] = exchange;
    }
    addQueue(queue) {
        this._queues[queue.name] = queue;
    }
    addBinding(name, binding) {
        this._bindings[name] = binding;
    }
    removeExchange(name) {
        delete this._exchanges[name];
    }
    removeQueue(name) {
        delete this._queues[name];
    }
    removeBinding(name) {
        delete this._bindings[name];
    }
    init() {
        return this._promisedConnection;
    }
    get connection() {
        return this._connection;
    }
    get exchanges() {
        return this._exchanges;
    }
    get queues() {
        return this._queues;
    }
    get bindings() {
        return this._bindings;
    }
    /**
     * Private methods
     */
    buildConnection() {
        try {
            if (this._rebuilding) {
                // one build process at a time
                log_1.default.debug("Connection rebuild in progress, making an active connection attempt", { module: "amqp" });
                return;
            }
            this._retry = -1;
            this._rebuilding = true;
            this._isClosing = false;
            this._promisedConnection = new Promise(this.tryToConnect);
        }
        catch (error) {
            this._rebuilding = false;
            log_1.default.warn("Error establishing connection", { module: "amqp" });
            this.emit("error_connection", error);
        }
    }
    tryToConnect(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            this.initConnection(0, (error) => {
                if (error) {
                    reject(error);
                }
                this._rebuilding = false;
                if (this.alreadyOnceConnected) {
                    log_1.default.warn("Connection re established", { module: "amqp" });
                    this.emit("re_established_connection");
                }
                else {
                    log_1.default.info("Connection established", { module: "amqp" });
                    this.emit("open_connection");
                    this.alreadyOnceConnected = true;
                }
                resolve();
            });
        });
    }
    initConnection(retry, callback) {
        AmqpLib.connect(this.url, (error, connection) => {
            if (!error) {
                this._connection = connection;
                this.isConnected = true;
                connection.on("error", this.restart);
                connection.on("error", this.onClose);
                this.alreadyOnceConnected = false;
                callback();
            }
            else {
                // make sure we only retry once
                if (retry <= this._retry) {
                    log_1.default.warn("rety issues" + retry, { module: "amqp" });
                    return;
                }
                log_1.default.warn("Error connection failed", { module: "amqp" });
                this._retry = retry;
                if (this.reconnectStrategy.retries === 0 ||
                    this.reconnectStrategy.retries > retry) {
                    log_1.default.warn(`Retry attempt:  ${retry}`, {
                        module: "amqp",
                    });
                    this.emit("trying_connect");
                    setTimeout(this.initConnection, this.reconnectStrategy.interval, retry + 1, callback);
                }
                else {
                    // error no retry strategy
                    log_1.default.warn(`Connection failed: all retry attempts exhausted:  ${retry}`, { module: "amqp" });
                    callback(error);
                }
            }
        });
    }
    restart(error) {
        if (this._connection) {
            this._connection.removeListener("error", this.restart);
            this.reCreateWithTopology(error);
        }
    }
    onClose() {
        if (this._connection) {
            this._connection.removeListener("close", this.onClose);
            if (!this._isClosing) {
                this.emit("lost_connection");
                this.restart(new Error("Connection closed by remote host"));
            }
        }
    }
}
exports.Connection = Connection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb25uZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhEQUFnRDtBQUNoRCxtQ0FBc0M7QUFFdEMseUNBQWtFO0FBQ2xFLGdEQUF3QjtBQUN4QixtQ0FBeUQ7QUFnQ3pELE1BQWEsVUFBVyxTQUFRLHFCQUFZO0lBbUJ4QyxZQUNJLEdBQUcsR0FBRyxrQkFBa0IsRUFDeEIsb0JBQXVDO1FBQ25DLFFBQVEsRUFBRSxJQUFJO1FBQ2QsT0FBTyxFQUFFLENBQUM7S0FDYjtRQUVELEtBQUssRUFBRSxDQUFDO1FBekJaLGtCQUFrQjtRQUNYLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBSW5CLHlCQUFvQixHQUFHLEtBQUssQ0FBQztRQUc3QixnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUM3QixlQUFVLEdBQVksS0FBSyxDQUFDO1FBa0JoQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO1FBRTNDLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBRXBCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUVZLG9CQUFvQixDQUFDLEtBQVk7O1lBQzFDLGFBQUcsQ0FBQyxJ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YyxFQUNuQixJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUMvQixLQUFLLEdBQUcsQ0FBQyxFQUNULFFBQVEsQ0FDWCxDQUFDO2lCQUNMO3FCQUFNO29CQUNILDBCQUEwQjtvQkFDMUIsYUFBRyxDQUFDLElBQUksQ0FDSixxREFBcUQsS0FBSyxFQUFFLEVBQzVELEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUNyQixDQUFDO29CQUNGLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDbkI7YUFDSjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztJQUVPLE9BQU8sQ0FBQyxLQUFZO1FBQ3hCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsQztJQUNMLENBQUM7SUFFTyxPQUFPO1FBQ1gsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7YUFDL0Q7U0FDSjtJQUNMLENBQUM7Q0FDSjtBQXpXRCxnQ0F5V0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBBbXFwTGliIGZyb20gXCJhbXFwbGliL2NhbGxiYWNrX2FwaVwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcImV2ZW50c1wiO1xuaW1wb3J0IHsgQmluZGluZywgQ2xpZW50IH0gZnJvbSBcIi4vYmluZGluZ1wiO1xuaW1wb3J0IHsgRXhjaGFuZ2UsIE9wdGlvbnMgYXMgRXhjaGFuZ2VPcHRpb25zIH0gZnJvbSBcIi4vZXhjaGFuZ2VcIjtcbmltcG9ydCBsb2cgZnJvbSBcIi4vbG9nXCI7XG5pbXBvcnQgeyBPcHRpb25zIGFzIFF1ZXVlT3B0aW9ucywgUXVldWUgfSBmcm9tIFwiLi9xdWV1ZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlY29ubmVjdFN0cmF0ZWd5IHtcbiAgICByZXRyaWVzOiBudW1iZXI7XG4gICAgaW50ZXJ2YWw6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUb3BvbG9neSB7XG4gICAgZXhjaGFuZ2VzOiBFeGNoYW5nZUludGVyZmFjZVtdO1xuICAgIHF1ZXVlczogUXVldWVJbnRlcmZhY2VbXTtcbiAgICBiaW5kaW5nczogQmluZGluZ0ludGVyZmFjZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2hhbmdlSW50ZXJmYWNlIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdHlwZT86IHN0cmluZztcbiAgICBvcHRpb25zPzogb2JqZWN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXVlSW50ZXJmYWNlIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgb3B0aW9ucz86IG9iamVjdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCaW5kaW5nSW50ZXJmYWNlIHtcbiAgICBvcmlnaW46IHN0cmluZztcbiAgICBxdWV1ZT86IHN0cmluZztcbiAgICBleGNoYW5nZT86IHN0cmluZztcbiAgICBleHByZXNzaW9uPzogc3RyaW5nO1xuICAgIGFyZ3M/OiBvYmplY3Q7XG59XG5cbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICAvLyBwdWJsaWMgdmFyaWFibGVcbiAgICBwdWJsaWMgaXNDb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgIHByaXZhdGUgdXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZWNvbm5lY3RTdHJhdGVneTogUmVjb25uZWN0U3RyYXRlZ3k7XG4gICAgcHJpdmF0ZSBhbHJlYWR5T25jZUNvbm5lY3RlZCA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSBfcmV0cnk6IG51bWJlcjtcbiAgICBwcml2YXRlIF9yZWJ1aWxkaW5nOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaXNDbG9zaW5nOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIF9leGNoYW5nZXM6IHsgW2lkOiBzdHJpbmddOiBFeGNoYW5nZSB9O1xuICAgIHByaXZhdGUgX3F1ZXVlczogeyBbaWQ6IHN0cmluZ106IFF1ZXVlIH07XG4gICAgcHJpdmF0ZSBfYmluZGluZ3M6IHsgW2lkOiBzdHJpbmddOiBCaW5kaW5nIH07XG5cbiAgICBwcml2YXRlIF9jb25uZWN0aW9uPzogQW1xcExpYi5Db25uZWN0aW9uO1xuICAgIHByaXZhdGUgX3Byb21pc2VkQ29ubmVjdGlvbj86IFByb21pc2U8dm9pZD47XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgdXJsID0gXCJhbXFwOi8vbG9jYWxob3N0XCIsXG4gICAgICAgIHJlY29ubmVjdFN0cmF0ZWd5OiBSZWNvbm5lY3RTdHJhdGVneSA9IHtcbiAgICAgICAgICAgIGludGVydmFsOiAyMDAwLFxuICAgICAgICAgICAgcmV0cmllczogMCxcbiAgICAgICAgfSxcbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9yZXRyeSA9IC0xO1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3RTdHJhdGVneSA9IHJlY29ubmVjdFN0cmF0ZWd5O1xuXG4gICAgICAgIHRoaXMuX2V4Y2hhbmdlcyA9IHt9O1xuICAgICAgICB0aGlzLl9xdWV1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5fYmluZGluZ3MgPSB7fTtcblxuICAgICAgICB0aGlzLnRyeVRvQ29ubmVjdCA9IHRoaXMudHJ5VG9Db25uZWN0LmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMuaW5pdENvbm5lY3Rpb24gPSB0aGlzLmluaXRDb25uZWN0aW9uLmJpbmQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5idWlsZENvbm5lY3Rpb24oKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcmVDcmVhdGVXaXRoVG9wb2xvZ3koZXJyb3I6IEVycm9yKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxvZy53YXJuKGBDb25uZWN0aW9uIGVycm9yIG9jY3VycmVkOiAke2Vycm9yLm1lc3NhZ2V9YCwge1xuICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbG9nLmRlYnVnKGBSZSBlc3RhYmxpc2hpbmcgQ29ubmVjdGlvbiBub3dgLCB7IG1vZHVsZTogXCJhbXFwXCIgfSk7XG4gICAgICAgIHRoaXMuYnVpbGRDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5fZXhjaGFuZ2VzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhjaGFuZ2U6IEV4Y2hhbmdlID0gdGhpcy5fZXhjaGFuZ2VzW2tleV07XG4gICAgICAgICAgICBsb2cuZGVidWcoYFJlYnVpbGQgRXhjaGFuZ2U6ICR7ZXhjaGFuZ2UubmFtZX1gLCB7IG1vZHVsZTogXCJhbXFwXCIgfSk7XG4gICAgICAgICAgICBleGNoYW5nZS5idWlsZEV4Y2hhbmdlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9xdWV1ZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWV1ZTogUXVldWUgPSB0aGlzLl9xdWV1ZXNba2V5XTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnN1bWVyID0gcXVldWUuY29uc3VtZXI7XG4gICAgICAgICAgICBsb2cuZGVidWcoYFJlYnVpbGQgUXVldWU6ICR7cXVldWUubmFtZX1gLCB7IG1vZHVsZTogXCJhbXFwXCIgfSk7XG4gICAgICAgICAgICBxdWV1ZS5idWlsZFF1ZXVlKCk7XG4gICAgICAgICAgICBpZiAoY29uc3VtZXIpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5pbml0Q29uc3VtZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX2JpbmRpbmdzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmluZGluZzogQmluZGluZyA9IHRoaXMuX2JpbmRpbmdzW2tleV07XG4gICAgICAgICAgICBsb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgYFJlYnVpbGQgYmluZGluZyBmcm9tOiAke2JpbmRpbmcub3JpZ2luLm5hbWV9IHRvICR7YmluZGluZy50YXJnZXQubmFtZX1gLFxuICAgICAgICAgICAgICAgIHsgbW9kdWxlOiBcImFtcXBcIiB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJpbmRpbmcuYnVpbGRCaW5kaW5nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxvZy5kZWJ1ZyhgVHJ5aW5nIHRvIGluaXRpYWxpemUgdG9wb2xvZ3lgLCB7IG1vZHVsZTogXCJhbXFwXCIgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplVG9wb2xvZ3koKTtcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoYFJlYnVpbGQgU3VjY2Vzc2Z1bGAsIHsgbW9kdWxlOiBcImFtcXBcIiB9KTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhgUmVidWlsZCBGYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gLCB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHB1YmxpYyBpbml0aWFsaXplVG9wb2xvZ3koKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgICAgIGNvbnN0IGFsbFRvcG9sb2dpZXM6IChQcm9taXNlPHVua25vd24+IHwgdW5kZWZpbmVkKVtdID0gW107XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX2V4Y2hhbmdlcykuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGV4Y2hhbmdlOiBFeGNoYW5nZSA9IHRoaXMuX2V4Y2hhbmdlc1trZXldO1xuICAgICAgICAgICAgYWxsVG9wb2xvZ2llcy5wdXNoKGV4Y2hhbmdlLmluaXQoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9xdWV1ZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWV1ZTogUXVldWUgPSB0aGlzLl9xdWV1ZXNba2V5XTtcbiAgICAgICAgICAgIGFsbFRvcG9sb2dpZXMucHVzaChxdWV1ZS5pbml0KCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5fYmluZGluZ3MpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBiaW5kaW5nOiBCaW5kaW5nID0gdGhpcy5fYmluZGluZ3Nba2V5XTtcbiAgICAgICAgICAgIGFsbFRvcG9sb2dpZXMucHVzaChiaW5kaW5nLmluaXQoKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChhbGxUb3BvbG9naWVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVSZWdpc3RlclRvcG9sb2d5KCk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBjb25zdCBhbGxUb3BvbG9naWVzOiBQcm9taXNlPHVua25vd24+W10gPSBbXTtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5fZXhjaGFuZ2VzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXhjaGFuZ2U6IEV4Y2hhbmdlID0gdGhpcy5fZXhjaGFuZ2VzW2tleV07XG4gICAgICAgICAgICBhbGxUb3BvbG9naWVzLnB1c2goZXhjaGFuZ2UuZGVsZXRlRXhjaGFuZ2UoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLl9xdWV1ZXMpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWV1ZTogUXVldWUgPSB0aGlzLl9xdWV1ZXNba2V5XTtcbiAgICAgICAgICAgIGFsbFRvcG9sb2dpZXMucHVzaChxdWV1ZS5kZWxldGVRdWV1ZSgpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX2JpbmRpbmdzKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYmluZGluZzogQmluZGluZyA9IHRoaXMuX2JpbmRpbmdzW2tleV07XG4gICAgICAgICAgICBhbGxUb3BvbG9naWVzLnB1c2goYmluZGluZy5kZWxldGVCaW5kaW5nKCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoYWxsVG9wb2xvZ2llcyk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlZ2lzdGVyRXhjaGFuZ2UoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgdHlwZT86IHN0cmluZyxcbiAgICAgICAgb3B0aW9ucz86IEV4Y2hhbmdlT3B0aW9ucyxcbiAgICApOiBFeGNoYW5nZSB7XG4gICAgICAgIGxldCBleGNoYW5nZSA9IHRoaXMuX2V4Y2hhbmdlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFleGNoYW5nZSkge1xuICAgICAgICAgICAgZXhjaGFuZ2UgPSBuZXcgRXhjaGFuZ2UodGhpcywgbmFtZSwgdHlwZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4Y2hhbmdlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWdpc3RlclF1ZXVlKG5hbWU6IHN0cmluZywgb3B0aW9ucz86IFF1ZXVlT3B0aW9ucyk6IFF1ZXVlIHtcbiAgICAgICAgbGV0IHF1ZXVlID0gdGhpcy5fcXVldWVzW25hbWVdO1xuICAgICAgICBpZiAoIXF1ZXVlKSB7XG4gICAgICAgICAgICBxdWV1ZSA9IG5ldyBRdWV1ZSh0aGlzLCBuYW1lLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcXVldWU7XG4gICAgfVxuXG4gICAgcHVibGljIHJlZ2lzdGVyVG9wb2xvZ3kodG9wb2xvZ3k6IFRvcG9sb2d5KSB7XG4gICAgICAgIGNvbnN0IGFsbFRvcG9sb2dpZXM6IChQcm9taXNlPHVua25vd24+IHwgdW5kZWZpbmVkKVtdID0gW107XG4gICAgICAgIGlmICh0b3BvbG9neS5leGNoYW5nZXMpIHtcbiAgICAgICAgICAgIHRvcG9sb2d5LmV4Y2hhbmdlcy5mb3JFYWNoKChleGNoYW5nZTogRXhjaGFuZ2VJbnRlcmZhY2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBleGNoYW5nZVByb21pc2UgPSB0aGlzLnJlZ2lzdGVyRXhjaGFuZ2UoXG4gICAgICAgICAgICAgICAgICAgIGV4Y2hhbmdlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGV4Y2hhbmdlLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGV4Y2hhbmdlLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBhbGxUb3BvbG9naWVzLnB1c2goZXhjaGFuZ2VQcm9taXNlLmluaXQoKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3BvbG9neS5xdWV1ZXMpIHtcbiAgICAgICAgICAgIHRvcG9sb2d5LnF1ZXVlcy5mb3JFYWNoKChxdWV1ZTogUXVldWVJbnRlcmZhY2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWV1ZVByb21pc2UgPSB0aGlzLnJlZ2lzdGVyUXVldWUoXG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBhbGxUb3BvbG9naWVzLnB1c2gocXVldWVQcm9taXNlLmluaXQoKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3BvbG9neS5iaW5kaW5ncykge1xuICAgICAgICAgICAgdG9wb2xvZ3kuYmluZGluZ3MuZm9yRWFjaCgoYmluZGluZzogQmluZGluZ0ludGVyZmFjZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IHRoaXMucmVnaXN0ZXJFeGNoYW5nZShiaW5kaW5nLm9yaWdpbik7XG4gICAgICAgICAgICAgICAgbGV0IHRhcmdldDogQ2xpZW50O1xuICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nLmV4Y2hhbmdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHRoaXMucmVnaXN0ZXJFeGNoYW5nZShiaW5kaW5nLmV4Y2hhbmdlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGJpbmRpbmcucXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGhpcy5yZWdpc3RlclF1ZXVlKGJpbmRpbmcucXVldWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRlZmluZSBleGNoYW5nZSBvciBxdWV1ZSBvbmUgb2YgdGhlbVwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhbGxUb3BvbG9naWVzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5iaW5kKG9yaWdpbiwgYmluZGluZy5leHByZXNzaW9uLCBiaW5kaW5nLmFyZ3MpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChhbGxUb3BvbG9naWVzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgY2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuX2lzQ2xvc2luZyA9IHRydWU7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9wcm9taXNlZENvbm5lY3Rpb247XG4gICAgICAgICAgICBpZiAodGhpcy5fY29ubmVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uY2xvc2UoKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChcImNsb3NlZF9jb25uZWN0aW9uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRFeGNoYW5nZShleGNoYW5nZTogRXhjaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fZXhjaGFuZ2VzW2V4Y2hhbmdlLm5hbWVdID0gZXhjaGFuZ2U7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFF1ZXVlKHF1ZXVlOiBRdWV1ZSkge1xuICAgICAgICB0aGlzLl9xdWV1ZXNbcXVldWUubmFtZV0gPSBxdWV1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQmluZGluZyhuYW1lOiBzdHJpbmcsIGJpbmRpbmc6IEJpbmRpbmcpIHtcbiAgICAgICAgdGhpcy5fYmluZGluZ3NbbmFtZV0gPSBiaW5kaW5nO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVFeGNoYW5nZShuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2V4Y2hhbmdlc1tuYW1lXTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlUXVldWUobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9xdWV1ZXNbbmFtZV07XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZUJpbmRpbmcobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9iaW5kaW5nc1tuYW1lXTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb21pc2VkQ29ubmVjdGlvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGNvbm5lY3Rpb24oKTogQW1xcExpYi5Db25uZWN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb247XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBleGNoYW5nZXMoKTogQ29ubmVjdGlvbltcIl9leGNoYW5nZXNcIl0ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXhjaGFuZ2VzO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgcXVldWVzKCk6IENvbm5lY3Rpb25bXCJfcXVldWVzXCJdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlcztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGJpbmRpbmdzKCk6IENvbm5lY3Rpb25bXCJfYmluZGluZ3NcIl0ge1xuICAgICAgICByZXR1cm4gdGhpcy5fYmluZGluZ3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSBtZXRob2RzXG4gICAgICovXG5cbiAgICBwcml2YXRlIGJ1aWxkQ29ubmVjdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZWJ1aWxkaW5nKSB7XG4gICAgICAgICAgICAgICAgLy8gb25lIGJ1aWxkIHByb2Nlc3MgYXQgYSB0aW1lXG4gICAgICAgICAgICAgICAgbG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICBcIkNvbm5lY3Rpb24gcmVidWlsZCBpbiBwcm9ncmVzcywgbWFraW5nIGFuIGFjdGl2ZSBjb25uZWN0aW9uIGF0dGVtcHRcIixcbiAgICAgICAgICAgICAgICAgICAgeyBtb2R1bGU6IFwiYW1xcFwiIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3JldHJ5ID0gLTE7XG4gICAgICAgICAgICB0aGlzLl9yZWJ1aWxkaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2lzQ2xvc2luZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICB0aGlzLl9wcm9taXNlZENvbm5lY3Rpb24gPSBuZXcgUHJvbWlzZSh0aGlzLnRyeVRvQ29ubmVjdCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWJ1aWxkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBsb2cud2FybihcIkVycm9yIGVzdGFibGlzaGluZyBjb25uZWN0aW9uXCIsIHsgbW9kdWxlOiBcImFtcXBcIiB9KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChcImVycm9yX2Nvbm5lY3Rpb25cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0cnlUb0Nvbm5lY3QoXG4gICAgICAgIHJlc29sdmU6ICgpID0+IHZvaWQsXG4gICAgICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgICApIHtcblxuICAgICAgdGhpcy5pbml0Q29ubmVjdGlvbigwLCAoZXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSAge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZWJ1aWxkaW5nID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLmFscmVhZHlPbmNlQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgIGxvZy53YXJuKFwiQ29ubmVjdGlvbiByZSBlc3RhYmxpc2hlZFwiLCB7IG1vZHVsZTogXCJhbXFwXCIgfSk7XG4gICAgICAgICAgICAgIHRoaXMuZW1pdChcInJlX2VzdGFibGlzaGVkX2Nvbm5lY3Rpb25cIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbG9nLmluZm8oXCJDb25uZWN0aW9uIGVzdGFibGlzaGVkXCIsIHsgbW9kdWxlOiBcImFtcXBcIiB9KTtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0KFwib3Blbl9jb25uZWN0aW9uXCIpO1xuICAgICAgICAgICAgICB0aGlzLmFscmVhZHlPbmNlQ29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdENvbm5lY3Rpb24ocmV0cnk6IG51bWJlciwgY2FsbGJhY2s6IChlcnJvcj86IEVycm9yKSA9PiB2b2lkKSB7XG4gICAgICBBbXFwTGliLmNvbm5lY3QodGhpcy51cmwsIChlcnJvciwgY29ubmVjdGlvbikgPT4ge1xuICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICAgICAgICAgIHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29ubmVjdGlvbi5vbihcImVycm9yXCIsIHRoaXMucmVzdGFydCk7XG4gICAgICAgICAgICBjb25uZWN0aW9uLm9uKFwiZXJyb3JcIiwgdGhpcy5vbkNsb3NlKTtcbiAgICAgICAgICAgIHRoaXMuYWxyZWFkeU9uY2VDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2Ugb25seSByZXRyeSBvbmNlXG4gICAgICAgICAgICBpZiAocmV0cnkgPD0gdGhpcy5fcmV0cnkpIHtcbiAgICAgICAgICAgICAgICBsb2cud2FybihcInJldHkgaXNzdWVzXCIgKyByZXRyeSwgeyBtb2R1bGU6IFwiYW1xcFwiIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbG9nLndhcm4oXCJFcnJvciBjb25uZWN0aW9uIGZhaWxlZFwiLCB7IG1vZHVsZTogXCJhbXFwXCIgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3JldHJ5ID0gcmV0cnk7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLnJlY29ubmVjdFN0cmF0ZWd5LnJldHJpZXMgPT09IDAgfHxcbiAgICAgICAgICAgICAgICB0aGlzLnJlY29ubmVjdFN0cmF0ZWd5LnJldHJpZXMgPiByZXRyeVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbG9nLndhcm4oYFJldHJ5IGF0dGVtcHQ6ICAke3JldHJ5fWAsIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoXCJ0cnlpbmdfY29ubmVjdFwiKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXRDb25uZWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29ubmVjdFN0cmF0ZWd5LmludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICByZXRyeSArIDEsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGVycm9yIG5vIHJldHJ5IHN0cmF0ZWd5XG4gICAgICAgICAgICAgICAgbG9nLndhcm4oXG4gICAgICAgICAgICAgICAgICAgIGBDb25uZWN0aW9uIGZhaWxlZDogYWxsIHJldHJ5IGF0dGVtcHRzIGV4aGF1c3RlZDogICR7cmV0cnl9YCxcbiAgICAgICAgICAgICAgICAgICAgeyBtb2R1bGU6IFwiYW1xcFwiIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc3RhcnQoZXJyb3I6IEVycm9yKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uKSB7XG4gICAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIHRoaXMucmVzdGFydCk7XG4gICAgICAgICAgdGhpcy5yZUNyZWF0ZVdpdGhUb3BvbG9neShlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb25uZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uLnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIiwgdGhpcy5vbkNsb3NlKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5faXNDbG9zaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KFwibG9zdF9jb25uZWN0aW9uXCIpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzdGFydChuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGNsb3NlZCBieSByZW1vdGUgaG9zdFwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=