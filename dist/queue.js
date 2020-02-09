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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const binding_1 = require("./binding");
const log_1 = __importDefault(require("./log"));
const message_1 = require("./message");
const DIRECT_QUEUE = "amq.rabbitmq.reply-to";
class Queue {
    constructor(connection, name, options = {}) {
        this._consumerStopping = false;
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
    static Serialize(content, options) {
        if (typeof content === "string") {
            return new Buffer(content);
        }
        else if (!(content instanceof Buffer)) {
            options.contentType = "application/json";
            return new Buffer(JSON.stringify(content));
        }
        else {
            return content;
        }
    }
    static Deserialize(message) {
        const content = message.content.toString();
        if (message.properties.contentType === "application/json") {
            return JSON.parse(content);
        }
        return content;
    }
    publish(content, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const newOptions = Object.assign({}, options);
            const result = Queue.Serialize(content, newOptions);
            yield this._promisedQueue;
            try {
                if (!this._channel) {
                    throw new Error("Corrupt Channel");
                }
                this._channel.sendToQueue(this._name, result, newOptions);
            }
            catch (error) {
                const queueName = this._name;
                const connection = this._connection;
                yield connection.reCreateWithTopology(error);
                connection.queues[queueName].publish(content, newOptions);
            }
        });
    }
    buildQueue() {
        this._promisedQueue = new Promise(this.connectQueue);
    }
    init() {
        return this._promisedQueue;
    }
    deleteQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._deleting) {
                return new Promise(this.delete);
            }
            return this._deleting;
        });
    }
    closeQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._closing) {
                return new Promise(this.close);
            }
            return this._closing;
        });
    }
    subscribeConsumer(consume, options = {}) {
        if (this._promisedConsumer) {
            throw new Error("Consumer already established");
        }
        this._consumerOptions = options;
        this._consumer = consume;
        this.initConsumer();
        return this._promisedConsumer;
    }
    unsubscribeConsumer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._promisedConsumer || this._consumerStopping) {
                return;
            }
            this._consumerStopping = true;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this._promisedConsumer;
                if (!this._channel) {
                    reject(new Error("Corrupt Channel"));
                    return;
                }
                if (!this._consumerTag) {
                    reject(new Error("Corrupt Consumer"));
                    return;
                }
                this._channel.cancel(this._consumerTag, (error, ok) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        delete this._promisedConsumer;
                        delete this._consumer;
                        delete this._consumerOptions;
                        delete this._consumerStopping;
                        resolve();
                    }
                });
            }));
        });
    }
    send(message) {
        message.send(this);
    }
    prefetch(count) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._promisedQueue;
            if (!this._channel) {
                throw new Error("Corrupt Channel");
            }
            this._channel.prefetch(count);
            this._options.prefetch = count;
        });
    }
    recover() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield this._promisedQueue;
            if (!this._channel) {
                throw new Error("Corrupt Channel");
            }
            this._channel.recover((error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        }));
    }
    rpc(params) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield this._promisedQueue;
            this.initRpc(resolve, reject, params);
        }));
    }
    bind(origin, expression = "", args = {}) {
        const binding = new binding_1.Binding(origin, this, expression, args);
        return binding.init();
    }
    unbind(origin, expression = "", args = {}) {
        return this._connection.bindings[binding_1.Binding.GenerateId(origin, this, expression)].deleteBinding();
    }
    initConsumer() {
        this._promisedConsumer = new Promise(this.connectConsumer);
    }
    get connection() {
        return this._connection;
    }
    get channel() {
        if (!this._channel) {
            throw new Error("Corrupt Channel");
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
    connectQueue(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._connection.init();
                const internalConnection = this._connection.connection;
                if (!internalConnection) {
                    throw new Error("Corrupt connection");
                }
                internalConnection.createChannel((error, channel) => {
                    if (!error) {
                        this._channel = channel;
                        if (this._options.noCreate) {
                            this._channel.checkQueue(this._name, this.assertQueue(resolve, reject));
                        }
                        else {
                            this._channel.assertQueue(this._name, this._options, this.assertQueue(resolve, reject));
                        }
                        return;
                    }
                    reject(error);
                });
            }
            catch (error) {
                // error
                log_1.default.error(`Failed to create channel from the connection: ${error.message}`, {
                    module: "amqp",
                });
            }
        });
    }
    assertQueue(resolve, reject) {
        return (error, ok) => {
            if (error) {
                log_1.default.error(`Failed to assert|check queue ${this._name}.`, {
                    module: "amqp",
                });
                this._connection.removeQueue(this._name);
                reject(error);
            }
            else {
                if (this._options.prefetch && this._channel) {
                    this._channel.prefetch(this._options.prefetch);
                }
                resolve(ok);
            }
        };
    }
    delete(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._promisedQueue;
            yield binding_1.Binding.RemoveBindings(this);
            if (!this._channel) {
                reject(new Error("Corrupt Channel"));
                return;
            }
            yield this.unsubscribeConsumer();
            this._channel.deleteQueue(this._name, {}, (error, ok) => {
                if (error) {
                    reject(error);
                }
                else {
                    this.invalidate(resolve, reject, ok);
                }
            });
        });
    }
    close(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._promisedQueue;
            yield binding_1.Binding.RemoveBindings(this);
            if (!this._channel) {
                reject(new Error("Corrupt Channel"));
                return;
            }
            yield this.unsubscribeConsumer();
            this.invalidate(resolve, reject);
        });
    }
    invalidate(resolve, reject, value) {
        delete this._promisedQueue; // invalidate promise
        this._connection.removeQueue(this._name);
        if (!this._channel) {
            reject(new Error("Corrupt Channel"));
            return;
        }
        this._channel.close((error) => {
            if (error) {
                reject(error);
            }
            else {
                delete this._channel;
                delete this._connection;
                resolve(value);
            }
        });
    }
    connectConsumer(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._promisedQueue;
            if (!this._channel) {
                reject(new Error("Corrupt Channel"));
                return;
            }
            this._channel.consume(this._name, this.consumerWrapper, this._consumerOptions, (error, ok) => {
                if (error) {
                    reject(error);
                }
                else {
                    this._consumerTag = ok.consumerTag;
                    resolve(ok);
                }
            });
        });
    }
    consumerWrapper(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!message) {
                    // TODO: not sure what happens here
                    return;
                }
                const result = new message_1.Message(message.content, message.properties);
                result.setFields(message.fields);
                result.setMessage(message);
                result.setChannel(this._channel);
                if (!this._consumer) {
                    throw new Error("Required Consume function");
                }
                if (!this._channel) {
                    throw new Error("Corrupt Channel");
                }
                yield this._consumer(result);
                if (message.properties.replyTo) {
                    const options = {};
                    const value = Queue.Serialize(result, options);
                    this._channel.sendToQueue(message.properties.replyTo, value, options);
                }
            }
            catch (error) {
                log_1.default.error(`Consume function returned error: ${error.message}`);
            }
        });
    }
    // TODO: first attempt improve later
    initRpc(resolve, reject, parmas) {
        let consumerTag;
        if (!this._channel) {
            reject(new Error("Corrupt Channel"));
            return;
        }
        this._channel.consume(DIRECT_QUEUE, (result) => {
            if (!this._channel) {
                reject(new Error("Corrupt Channel"));
                return;
            }
            if (!result) {
                reject(new Error("No message consumed"));
                return;
            }
            this._channel.cancel(consumerTag);
            const answer = new message_1.Message(result.content, result.properties);
            answer.setFields(result.fields);
            resolve(answer);
        }, { noAck: true }, (error, ok) => {
            if (error) {
                reject(error);
            }
            else {
                consumerTag = ok.consumerTag;
                const message = new message_1.Message(parmas, {
                    replyTo: DIRECT_QUEUE,
                });
                message.send(this);
            }
        });
    }
}
exports.Queue = Queue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBb0M7QUFHcEMsZ0RBQXdCO0FBQ3hCLHVDQUFpRTtBQTRDakUsTUFBTSxZQUFZLEdBQUcsdUJBQXVCLENBQUM7QUFFN0MsTUFBYSxLQUFLO0lBd0NoQixZQUFZLFVBQXNCLEVBQUUsSUFBWSxFQUFFLFVBQW1CLEVBQUU7UUFWL0Qsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1FBV3pDLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1FBRXhCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQXBETSxNQUFNLENBQUMsU0FBUyxDQUNyQixPQUF3QixFQUN4QixPQUFtQjtRQUVuQixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzVCO2FBQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxZQUFZLE1BQU0sQ0FBQyxFQUFFO1lBQ3ZDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsa0JBQWtCLENBQUM7WUFDekMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDNUM7YUFBTTtZQUNMLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQztJQUVNLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBd0I7UUFDaEQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxLQUFLLGtCQUFrQixFQUFFO1lBQ3pELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM1QjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFrQ1ksT0FBTyxDQUFDLE9BQXdCLEVBQUUsVUFBa0IsRUFBRTs7WUFDakUsTUFBTSxVQUFVLHFCQUFRLE9BQU8sQ0FBRSxDQUFDO1lBQ2xDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQzVCLE9BQU8sRUFDUCxVQUF1QyxDQUN4QyxDQUFDO1lBRUYsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQzFCLElBQUk7Z0JBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztpQkFDcEM7Z0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7YUFDM0Q7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUNwQyxNQUFNLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0MsVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2FBQzNEO1FBQ0gsQ0FBQztLQUFBO0lBRU0sVUFBVTtRQUNmLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxPQUFPLENBQWEsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFTSxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQzdCLENBQUM7SUFFWSxXQUFXOztZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDbkIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDakM7WUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDeEIsQ0FBQztLQUFBO0lBRVksVUFBVTs7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xCLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ2hDO1lBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLENBQUM7S0FBQTtJQUVNLGlCQUFpQixDQUN0QixPQUFpQixFQUNqQixVQUEyQixFQUFFO1FBRTdCLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztTQUNqRDtRQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7UUFDaEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7UUFDekIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO0lBQ2hDLENBQUM7SUFFWSxtQkFBbUI7O1lBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUNyRCxPQUFPO2FBQ1I7WUFFRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBTyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzNDLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUU3QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDbEIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztvQkFDckMsT0FBTztpQkFDUjtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtvQkFDdEIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztvQkFDdEMsT0FBTztpQkFDUjtnQkFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsS0FBWSxFQUFFLEVBQU8sRUFBRSxFQUFFO29CQUNoRSxJQUFJLEtBQUssRUFBRTt3QkFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ2Y7eUJBQU07d0JBQ0wsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7d0JBQzlCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQzt3QkFDdEIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7d0JBQzdCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO3dCQUM5QixPQUFPLEVBQUUsQ0FBQztxQkFDWDtnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQUE7SUFFTSxJQUFJLENBQUMsT0FBZ0I7UUFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRVksUUFBUSxDQUFDLEtBQWE7O1lBQ2pDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ2pDLENBQUM7S0FBQTtJQUVNLE9BQU87UUFDWixPQUFPLElBQUksT0FBTyxDQUFDLENBQU8sT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzNDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFZLEVBQUUsRUFBRTtnQkFDckMsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNmO3FCQUFNO29CQUNMLE9BQU8sRUFBRSxDQUFDO2lCQUNYO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVNLEdBQUcsQ0FBQyxNQUFjO1FBQ3ZCLE9BQU8sSUFBSSxPQUFPLENBQVUsQ0FBTyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDcEQsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVNLElBQUksQ0FDVCxNQUFnQixFQUNoQixVQUFVLEdBQUcsRUFBRSxFQUNmLE9BQWUsRUFBRTtRQUVqQixNQUFNLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUQsT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVNLE1BQU0sQ0FDWCxNQUFnQixFQUNoQixVQUFVLEdBQUcsRUFBRSxFQUNmLE9BQWUsRUFBRTtRQUVqQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUM5QixpQkFBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUM3QyxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3BCLENBQUM7SUFFTSxZQUFZO1FBQ2pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLE9BQU8sQ0FBaUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRCxJQUFXLFVBQVU7UUFDbkIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRCxJQUFXLE9BQU87UUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ3BDO1FBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7O09BRUc7SUFFVyxZQUFZLENBQ3hCLE9BQW9DLEVBQ3BDLE1BQThCOztZQUU5QixJQUFJO2dCQUNGLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztnQkFFdkQsSUFBSSxDQUFDLGtCQUFrQixFQUFFO29CQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7aUJBQ3ZDO2dCQUVELGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEtBQVksRUFBRSxPQUF3QixFQUFFLEVBQUU7b0JBQzFFLElBQUksQ0FBQyxLQUFLLEVBQUU7d0JBQ1YsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7d0JBRXhCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7NEJBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUN0QixJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUNsQyxDQUFDO3lCQUNIOzZCQUFNOzRCQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUN2QixJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksQ0FBQyxRQUFRLEVBQ2IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQ2xDLENBQUM7eUJBQ0g7d0JBQ0QsT0FBTztxQkFDUjtvQkFDRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQyxDQUFDO2FBQ0o7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxRQUFRO2dCQUNSLGFBQUcsQ0FBQyxLQUFLLENBQ1AsaURBQWlELEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFDaEU7b0JBQ0UsTUFBTSxFQUFFLE1BQU07aUJBQ2YsQ0FDRixDQUFDO2FBQ0g7UUFDSCxDQUFDO0tBQUE7SUFFTyxXQUFXLENBQ2pCLE9BQW9DLEVBQ3BDLE1BQThCO1FBRTlCLE9BQU8sQ0FBQyxLQUFZLEVBQUUsRUFBeUIsRUFBRSxFQUFFO1lBQ2pELElBQUksS0FBSyxFQUFFO2dCQUNULGFBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRTtvQkFDdkQsTUFBTSxFQUFFLE1BQU07aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ2Y7aUJBQU07Z0JBQ0wsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNoRDtnQkFDRCxPQUFPLENBQUMsRUFBZ0IsQ0FBQyxDQUFDO2FBQzNCO1FBQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVhLE1BQU0sQ0FDbEIsT0FBc0MsRUFDdEMsTUFBOEI7O1lBRTlCLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUMxQixNQUFNLGlCQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxPQUFPO2FBQ1I7WUFFRCxNQUFNLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsS0FBWSxFQUFFLEVBQU8sRUFBRSxFQUFFO2dCQUNsRSxJQUFJLEtBQUssRUFBRTtvQkFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ2Y7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2lCQUN0QztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRWEsS0FBSyxDQUFDLE9BQW1CLEVBQUUsTUFBOEI7O1lBQ3JFLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUMxQixNQUFNLGlCQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxPQUFPO2FBQ1I7WUFDRCxNQUFNLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25DLENBQUM7S0FBQTtJQUVPLFVBQVUsQ0FDaEIsT0FBc0MsRUFDdEMsTUFBOEIsRUFDOUIsS0FBbUI7UUFFbkIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMscUJBQXFCO1FBQ2pELElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV6QyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE9BQU87U0FDUjtRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDbkMsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ2Y7aUJBQU07Z0JBQ0wsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUNyQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxLQUFvQixDQUFDLENBQUM7YUFDL0I7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFYSxlQUFlLENBQzNCLE9BQXlDLEVBQ3pDLE1BQThCOztZQUU5QixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUM7WUFFMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2xCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUNuQixJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksQ0FBQyxlQUFlLEVBQ3BCLElBQUksQ0FBQyxnQkFBZ0IsRUFDckIsQ0FBQyxLQUFZLEVBQUUsRUFBMkIsRUFBRSxFQUFFO2dCQUM1QyxJQUFJLEtBQUssRUFBRTtvQkFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ2Y7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDO29CQUNuQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ2I7WUFDSCxDQUFDLENBQ0YsQ0FBQztRQUVKLENBQUM7S0FBQTtJQUVhLGVBQWUsQ0FBQyxPQUErQjs7WUFFM0QsSUFBSTtnQkFDRixJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNaLG1DQUFtQztvQkFDbkMsT0FBTztpQkFDUjtnQkFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGlCQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzQixNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFakMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7b0JBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztpQkFDOUM7Z0JBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztpQkFDcEM7Z0JBQ0QsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUU3QixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFO29CQUM5QixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7b0JBQ25CLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO29CQUUvQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQ3ZFO2FBQ0Y7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxhQUFHLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzthQUNoRTtRQUNILENBQUM7S0FBQTtJQUVELG9DQUFvQztJQUM1QixPQUFPLENBQ2IsT0FBbUMsRUFDbkMsTUFBOEIsRUFDOUIsTUFBdUI7UUFFdkIsSUFBSSxXQUFtQixDQUFDO1FBRXhCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDckMsT0FBTztTQUNSO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQ25CLFlBQVksRUFDWixDQUFDLE1BQThCLEVBQUUsRUFBRTtZQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbEIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDckMsT0FBTzthQUNSO1lBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDWCxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxPQUFPO2FBQ1I7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGlCQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xCLENBQUMsRUFDRCxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFDZixDQUFDLEtBQVksRUFBRSxFQUFPLEVBQUUsRUFBRTtZQUN4QixJQUFJLEtBQUssRUFBRTtnQkFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDZjtpQkFBTTtnQkFDTCxXQUFXLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQztnQkFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLE1BQU0sRUFBRTtvQkFDbEMsT0FBTyxFQUFFLFlBQVk7aUJBQ3RCLENBQUMsQ0FBQztnQkFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFqY0Qsc0JBaWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQW1xcExpYiBmcm9tIFwiYW1xcGxpYi9jYWxsYmFja19hcGlcIjtcbmltcG9ydCB7IEJpbmRpbmcgfSBmcm9tIFwiLi9iaW5kaW5nXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vY29ubmVjdGlvblwiO1xuaW1wb3J0IHsgRXhjaGFuZ2UgfSBmcm9tIFwiLi9leGNoYW5nZVwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi9sb2dcIjtcbmltcG9ydCB7IEV4dGVybmFsQ29udGVudCwgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCIuL21lc3NhZ2VcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgZXhjbHVzaXZlPzogYm9vbGVhbjtcbiAgZHVyYWJsZT86IGJvb2xlYW47XG4gIGF1dG9EZWxldGU/OiBib29sZWFuO1xuICBhcmd1bWVudHM/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBtZXNzYWdlVHRsPzogbnVtYmVyO1xuICBleHBpcmVzPzogbnVtYmVyO1xuICBkZWFkTGV0dGVyRXhjaGFuZ2U/OiBzdHJpbmc7XG4gIG1heExlbmd0aD86IG51bWJlcjtcbiAgcHJlZmV0Y2g/OiBudW1iZXI7XG4gIG5vQ3JlYXRlPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbml0UmVzdWx0IHtcbiAgcXVldWU6IHN0cmluZztcbiAgbWVzc2FnZUNvdW50OiBudW1iZXI7XG4gIGNvbnN1bWVyQ291bnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQdXJnZVJlc3VsdCB7XG4gIG1lc3NhZ2VDb3VudDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnN1bWVyT3B0aW9ucyB7XG4gIGNvbnN1bWVyVGFnPzogc3RyaW5nO1xuICBub0xvY2FsPzogYm9vbGVhbjtcbiAgbm9BY2s/OiBib29sZWFuO1xuICBtYW51YWxBY2s/OiBib29sZWFuO1xuICBleGNsdXNpdmU/OiBib29sZWFuO1xuICBwcmlvcml0eT86IG51bWJlcjtcbiAgYXJndW1lbnRzPzogb2JqZWN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnN1bWVyUmVzdWx0IHtcbiAgY29uc3VtZXJUYWc6IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgQ29uc3VtZXIgPSAoXG4gIG1zZzogTWVzc2FnZSxcbiAgY2hhbm5lbD86IEFtcXBMaWIuQ2hhbm5lbCxcbikgPT4gUHJvbWlzZTx2b2lkPiB8IHZvaWQ7XG5cbmNvbnN0IERJUkVDVF9RVUVVRSA9IFwiYW1xLnJhYmJpdG1xLnJlcGx5LXRvXCI7XG5cbmV4cG9ydCBjbGFzcyBRdWV1ZSB7XG4gIHB1YmxpYyBzdGF0aWMgU2VyaWFsaXplKFxuICAgIGNvbnRlbnQ6IEV4dGVybmFsQ29udGVudCxcbiAgICBvcHRpb25zOiBQcm9wZXJ0aWVzLFxuICApOiBCdWZmZXIge1xuICAgIGlmICh0eXBlb2YgY29udGVudCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuIG5ldyBCdWZmZXIoY29udGVudCk7XG4gICAgfSBlbHNlIGlmICghKGNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICBvcHRpb25zLmNvbnRlbnRUeXBlID0gXCJhcHBsaWNhdGlvbi9qc29uXCI7XG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlcihKU09OLnN0cmluZ2lmeShjb250ZW50KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgRGVzZXJpYWxpemUobWVzc2FnZTogQW1xcExpYi5NZXNzYWdlKTogTWVzc2FnZSB8IHN0cmluZyB7XG4gICAgY29uc3QgY29udGVudCA9IG1lc3NhZ2UuY29udGVudC50b1N0cmluZygpO1xuICAgIGlmIChtZXNzYWdlLnByb3BlcnRpZXMuY29udGVudFR5cGUgPT09IFwiYXBwbGljYXRpb24vanNvblwiKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShjb250ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBwcml2YXRlIF9jb25uZWN0aW9uOiBDb25uZWN0aW9uO1xuICBwcml2YXRlIF9uYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgX29wdGlvbnM6IE9wdGlvbnM7XG5cbiAgcHJpdmF0ZSBfZGVsZXRpbmc/OiBQcm9taXNlPFB1cmdlUmVzdWx0PjtcbiAgcHJpdmF0ZSBfY2xvc2luZz86IFByb21pc2U8dm9pZD47XG5cbiAgcHJpdmF0ZSBfY29uc3VtZXJTdG9wcGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2NvbnN1bWVyPzogQ29uc3VtZXI7XG4gIHByaXZhdGUgX2NvbnN1bWVyT3B0aW9ucz86IENvbnN1bWVyT3B0aW9ucztcbiAgcHJpdmF0ZSBfY29uc3VtZXJUYWc/OiBzdHJpbmc7XG4gIHByaXZhdGUgX2NoYW5uZWw/OiBBbXFwTGliLkNoYW5uZWw7XG5cbiAgcHJpdmF0ZSBfcHJvbWlzZWRRdWV1ZT86IFByb21pc2U8SW5pdFJlc3VsdD47XG4gIHByaXZhdGUgX3Byb21pc2VkQ29uc3VtZXI/OiBQcm9taXNlPENvbnN1bWVyUmVzdWx0PjtcblxuICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uOiBDb25uZWN0aW9uLCBuYW1lOiBzdHJpbmcsIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgdGhpcy5kZWxldGUgPSB0aGlzLmRlbGV0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY2xvc2UgPSB0aGlzLmNsb3NlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5jb25uZWN0UXVldWUgPSB0aGlzLmNvbm5lY3RRdWV1ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY29ubmVjdENvbnN1bWVyID0gdGhpcy5jb25uZWN0Q29uc3VtZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNvbnN1bWVyV3JhcHBlciA9IHRoaXMuY29uc3VtZXJXcmFwcGVyLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLl9jb25uZWN0aW9uLmFkZFF1ZXVlKHRoaXMpO1xuICAgIHRoaXMuYnVpbGRRdWV1ZSgpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHB1Ymxpc2goY29udGVudDogRXh0ZXJuYWxDb250ZW50LCBvcHRpb25zOiBvYmplY3QgPSB7fSkge1xuICAgIGNvbnN0IG5ld09wdGlvbnMgPSB7IC4uLm9wdGlvbnMgfTtcbiAgICBjb25zdCByZXN1bHQgPSBRdWV1ZS5TZXJpYWxpemUoXG4gICAgICBjb250ZW50LFxuICAgICAgbmV3T3B0aW9ucyBhcyBBbXFwTGliLk1lc3NhZ2VQcm9wZXJ0aWVzLFxuICAgICk7XG5cbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZFF1ZXVlO1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY2hhbm5lbC5zZW5kVG9RdWV1ZSh0aGlzLl9uYW1lLCByZXN1bHQsIG5ld09wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBxdWV1ZU5hbWUgPSB0aGlzLl9uYW1lO1xuICAgICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuX2Nvbm5lY3Rpb247XG4gICAgICBhd2FpdCBjb25uZWN0aW9uLnJlQ3JlYXRlV2l0aFRvcG9sb2d5KGVycm9yKTtcbiAgICAgIGNvbm5lY3Rpb24ucXVldWVzW3F1ZXVlTmFtZV0ucHVibGlzaChjb250ZW50LCBuZXdPcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYnVpbGRRdWV1ZSgpIHtcbiAgICB0aGlzLl9wcm9taXNlZFF1ZXVlID0gbmV3IFByb21pc2U8SW5pdFJlc3VsdD4odGhpcy5jb25uZWN0UXVldWUpO1xuICB9XG5cbiAgcHVibGljIGluaXQoKTogUHJvbWlzZTxJbml0UmVzdWx0PiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb21pc2VkUXVldWU7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZGVsZXRlUXVldWUoKTogUHJvbWlzZTxQdXJnZVJlc3VsdD4ge1xuICAgIGlmICghdGhpcy5fZGVsZXRpbmcpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSh0aGlzLmRlbGV0ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9kZWxldGluZztcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBjbG9zZVF1ZXVlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fY2xvc2luZykge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHRoaXMuY2xvc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2xvc2luZztcbiAgfVxuXG4gIHB1YmxpYyBzdWJzY3JpYmVDb25zdW1lcihcbiAgICBjb25zdW1lOiBDb25zdW1lcixcbiAgICBvcHRpb25zOiBDb25zdW1lck9wdGlvbnMgPSB7fSxcbiAgKTogUHJvbWlzZTx2b2lkPiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuX3Byb21pc2VkQ29uc3VtZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnN1bWVyIGFscmVhZHkgZXN0YWJsaXNoZWRcIik7XG4gICAgfVxuXG4gICAgdGhpcy5fY29uc3VtZXJPcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLl9jb25zdW1lciA9IGNvbnN1bWU7XG4gICAgdGhpcy5pbml0Q29uc3VtZXIoKTtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZWRDb25zdW1lcjtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyB1bnN1YnNjcmliZUNvbnN1bWVyKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fcHJvbWlzZWRDb25zdW1lciB8fCB0aGlzLl9jb25zdW1lclN0b3BwaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY29uc3VtZXJTdG9wcGluZyA9IHRydWU7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuX3Byb21pc2VkQ29uc3VtZXI7XG5cbiAgICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuX2NvbnN1bWVyVGFnKSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0IENvbnN1bWVyXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fY2hhbm5lbC5jYW5jZWwodGhpcy5fY29uc3VtZXJUYWcsIChlcnJvcjogRXJyb3IsIG9rOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fcHJvbWlzZWRDb25zdW1lcjtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fY29uc3VtZXI7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuX2NvbnN1bWVyT3B0aW9ucztcbiAgICAgICAgICBkZWxldGUgdGhpcy5fY29uc3VtZXJTdG9wcGluZztcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHNlbmQobWVzc2FnZTogTWVzc2FnZSkge1xuICAgIG1lc3NhZ2Uuc2VuZCh0aGlzKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBwcmVmZXRjaChjb3VudDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRRdWV1ZTtcbiAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKTtcbiAgICB9XG4gICAgdGhpcy5fY2hhbm5lbC5wcmVmZXRjaChjb3VudCk7XG4gICAgdGhpcy5fb3B0aW9ucy5wcmVmZXRjaCA9IGNvdW50O1xuICB9XG5cbiAgcHVibGljIHJlY292ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuX3Byb21pc2VkUXVldWU7XG4gICAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY2hhbm5lbC5yZWNvdmVyKChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHJwYyhwYXJhbXM6IG9iamVjdCk6IFByb21pc2U8TWVzc2FnZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxNZXNzYWdlPihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLl9wcm9taXNlZFF1ZXVlO1xuICAgICAgdGhpcy5pbml0UnBjKHJlc29sdmUsIHJlamVjdCwgcGFyYW1zKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBiaW5kKFxuICAgIG9yaWdpbjogRXhjaGFuZ2UsXG4gICAgZXhwcmVzc2lvbiA9IFwiXCIsXG4gICAgYXJnczogb2JqZWN0ID0ge30sXG4gICk6IFByb21pc2U8QmluZGluZz4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGJpbmRpbmcgPSBuZXcgQmluZGluZyhvcmlnaW4sIHRoaXMsIGV4cHJlc3Npb24sIGFyZ3MpO1xuICAgIHJldHVybiBiaW5kaW5nLmluaXQoKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmJpbmQoXG4gICAgb3JpZ2luOiBFeGNoYW5nZSxcbiAgICBleHByZXNzaW9uID0gXCJcIixcbiAgICBhcmdzOiBvYmplY3QgPSB7fSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb24uYmluZGluZ3NbXG4gICAgICBCaW5kaW5nLkdlbmVyYXRlSWQob3JpZ2luLCB0aGlzLCBleHByZXNzaW9uKVxuICAgIF0uZGVsZXRlQmluZGluZygpO1xuICB9XG5cbiAgcHVibGljIGluaXRDb25zdW1lcigpIHtcbiAgICB0aGlzLl9wcm9taXNlZENvbnN1bWVyID0gbmV3IFByb21pc2U8Q29uc3VtZXJSZXN1bHQ+KHRoaXMuY29ubmVjdENvbnN1bWVyKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY29ubmVjdGlvbigpOiBDb25uZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbjtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2hhbm5lbCgpOiBBbXFwTGliLkNoYW5uZWwge1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2hhbm5lbDtcbiAgfVxuXG4gIGdldCBuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG5cbiAgZ2V0IGNvbnN1bWVyKCkge1xuICAgIHJldHVybiB0aGlzLl9jb25zdW1lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcml2YXRlIG1ldGhvZHNcbiAgICovXG5cbiAgcHJpdmF0ZSBhc3luYyBjb25uZWN0UXVldWUoXG4gICAgcmVzb2x2ZTogKHZhbHVlOiBJbml0UmVzdWx0KSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuX2Nvbm5lY3Rpb24uaW5pdCgpO1xuICAgICAgY29uc3QgaW50ZXJuYWxDb25uZWN0aW9uID0gdGhpcy5fY29ubmVjdGlvbi5jb25uZWN0aW9uO1xuXG4gICAgICBpZiAoIWludGVybmFsQ29ubmVjdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IGNvbm5lY3Rpb25cIik7XG4gICAgICB9XG5cbiAgICAgIGludGVybmFsQ29ubmVjdGlvbi5jcmVhdGVDaGFubmVsKChlcnJvcjogRXJyb3IsIGNoYW5uZWw6IEFtcXBMaWIuQ2hhbm5lbCkgPT4ge1xuICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgdGhpcy5fY2hhbm5lbCA9IGNoYW5uZWw7XG5cbiAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5ub0NyZWF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fY2hhbm5lbC5jaGVja1F1ZXVlKFxuICAgICAgICAgICAgICB0aGlzLl9uYW1lLFxuICAgICAgICAgICAgICB0aGlzLmFzc2VydFF1ZXVlKHJlc29sdmUsIHJlamVjdCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jaGFubmVsLmFzc2VydFF1ZXVlKFxuICAgICAgICAgICAgICB0aGlzLl9uYW1lLFxuICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLFxuICAgICAgICAgICAgICB0aGlzLmFzc2VydFF1ZXVlKHJlc29sdmUsIHJlamVjdCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBlcnJvclxuICAgICAgbG9nLmVycm9yKFxuICAgICAgICBgRmFpbGVkIHRvIGNyZWF0ZSBjaGFubmVsIGZyb20gdGhlIGNvbm5lY3Rpb246ICR7ZXJyb3IubWVzc2FnZX1gLFxuICAgICAgICB7XG4gICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnRRdWV1ZShcbiAgICByZXNvbHZlOiAodmFsdWU6IEluaXRSZXN1bHQpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICByZXR1cm4gKGVycm9yOiBFcnJvciwgb2s6IEFtcXBMaWIuUmVwbGllcy5FbXB0eSkgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGxvZy5lcnJvcihgRmFpbGVkIHRvIGFzc2VydHxjaGVjayBxdWV1ZSAke3RoaXMuX25hbWV9LmAsIHtcbiAgICAgICAgICBtb2R1bGU6IFwiYW1xcFwiLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fY29ubmVjdGlvbi5yZW1vdmVRdWV1ZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLl9vcHRpb25zLnByZWZldGNoICYmIHRoaXMuX2NoYW5uZWwpIHtcbiAgICAgICAgICB0aGlzLl9jaGFubmVsLnByZWZldGNoKHRoaXMuX29wdGlvbnMucHJlZmV0Y2gpO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUob2sgYXMgSW5pdFJlc3VsdCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZGVsZXRlKFxuICAgIHJlc29sdmU6ICh2YWx1ZT86IFB1cmdlUmVzdWx0KSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgKSB7XG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRRdWV1ZTtcbiAgICBhd2FpdCBCaW5kaW5nLlJlbW92ZUJpbmRpbmdzKHRoaXMpO1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy51bnN1YnNjcmliZUNvbnN1bWVyKCk7XG4gICAgdGhpcy5fY2hhbm5lbC5kZWxldGVRdWV1ZSh0aGlzLl9uYW1lLCB7fSwgKGVycm9yOiBFcnJvciwgb2s6IGFueSkgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmludmFsaWRhdGUocmVzb2x2ZSwgcmVqZWN0LCBvayk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNsb3NlKHJlc29sdmU6ICgpID0+IHZvaWQsIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCkge1xuICAgIGF3YWl0IHRoaXMuX3Byb21pc2VkUXVldWU7XG4gICAgYXdhaXQgQmluZGluZy5SZW1vdmVCaW5kaW5ncyh0aGlzKTtcbiAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnVuc3Vic2NyaWJlQ29uc3VtZXIoKTtcbiAgICB0aGlzLmludmFsaWRhdGUocmVzb2x2ZSwgcmVqZWN0KTtcbiAgfVxuXG4gIHByaXZhdGUgaW52YWxpZGF0ZShcbiAgICByZXNvbHZlOiAodmFsdWU/OiBQdXJnZVJlc3VsdCkgPT4gdm9pZCxcbiAgICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQsXG4gICAgdmFsdWU/OiBQdXJnZVJlc3VsdCxcbiAgKSB7XG4gICAgZGVsZXRlIHRoaXMuX3Byb21pc2VkUXVldWU7IC8vIGludmFsaWRhdGUgcHJvbWlzZVxuICAgIHRoaXMuX2Nvbm5lY3Rpb24ucmVtb3ZlUXVldWUodGhpcy5fbmFtZSk7XG5cbiAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9jaGFubmVsLmNsb3NlKChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2NoYW5uZWw7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9jb25uZWN0aW9uO1xuICAgICAgICByZXNvbHZlKHZhbHVlIGFzIFB1cmdlUmVzdWx0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29ubmVjdENvbnN1bWVyKFxuICAgIHJlc29sdmU6IChyZXN1bHQ6IENvbnN1bWVyUmVzdWx0KSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgKSB7XG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRRdWV1ZTtcblxuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbm5lbC5jb25zdW1lKFxuICAgICAgdGhpcy5fbmFtZSxcbiAgICAgIHRoaXMuY29uc3VtZXJXcmFwcGVyLFxuICAgICAgdGhpcy5fY29uc3VtZXJPcHRpb25zLFxuICAgICAgKGVycm9yOiBFcnJvciwgb2s6IEFtcXBMaWIuUmVwbGllcy5Db25zdW1lKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fY29uc3VtZXJUYWcgPSBvay5jb25zdW1lclRhZztcbiAgICAgICAgICByZXNvbHZlKG9rKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICApO1xuXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNvbnN1bWVyV3JhcHBlcihtZXNzYWdlOiBBbXFwTGliLk1lc3NhZ2UgfCBudWxsKSB7XG5cbiAgICB0cnkge1xuICAgICAgaWYgKCFtZXNzYWdlKSB7XG4gICAgICAgIC8vIFRPRE86IG5vdCBzdXJlIHdoYXQgaGFwcGVucyBoZXJlXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IE1lc3NhZ2UobWVzc2FnZS5jb250ZW50LCBtZXNzYWdlLnByb3BlcnRpZXMpO1xuICAgICAgcmVzdWx0LnNldEZpZWxkcyhtZXNzYWdlLmZpZWxkcyk7XG4gICAgICByZXN1bHQuc2V0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIHJlc3VsdC5zZXRDaGFubmVsKHRoaXMuX2NoYW5uZWwpO1xuXG4gICAgICBpZiAoIXRoaXMuX2NvbnN1bWVyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcXVpcmVkIENvbnN1bWUgZnVuY3Rpb25cIik7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIik7XG4gICAgICB9XG4gICAgICBhd2FpdCB0aGlzLl9jb25zdW1lcihyZXN1bHQpO1xuXG4gICAgICBpZiAobWVzc2FnZS5wcm9wZXJ0aWVzLnJlcGx5VG8pIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHt9O1xuICAgICAgICBjb25zdCB2YWx1ZSA9IFF1ZXVlLlNlcmlhbGl6ZShyZXN1bHQsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX2NoYW5uZWwuc2VuZFRvUXVldWUobWVzc2FnZS5wcm9wZXJ0aWVzLnJlcGx5VG8sIHZhbHVlLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbG9nLmVycm9yKGBDb25zdW1lIGZ1bmN0aW9uIHJldHVybmVkIGVycm9yOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETzogZmlyc3QgYXR0ZW1wdCBpbXByb3ZlIGxhdGVyXG4gIHByaXZhdGUgaW5pdFJwYyhcbiAgICByZXNvbHZlOiAobWVzc2FnZTogTWVzc2FnZSkgPT4gdm9pZCxcbiAgICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQsXG4gICAgcGFybWFzOiBFeHRlcm5hbENvbnRlbnQsXG4gICkge1xuICAgIGxldCBjb25zdW1lclRhZzogc3RyaW5nO1xuXG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGFubmVsLmNvbnN1bWUoXG4gICAgICBESVJFQ1RfUVVFVUUsXG4gICAgICAocmVzdWx0OiBBbXFwTGliLk1lc3NhZ2UgfCBudWxsKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIikpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIk5vIG1lc3NhZ2UgY29uc3VtZWRcIikpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NoYW5uZWwuY2FuY2VsKGNvbnN1bWVyVGFnKTtcbiAgICAgICAgY29uc3QgYW5zd2VyID0gbmV3IE1lc3NhZ2UocmVzdWx0LmNvbnRlbnQsIHJlc3VsdC5wcm9wZXJ0aWVzKTtcbiAgICAgICAgYW5zd2VyLnNldEZpZWxkcyhyZXN1bHQuZmllbGRzKTtcbiAgICAgICAgcmVzb2x2ZShhbnN3ZXIpO1xuICAgICAgfSxcbiAgICAgIHsgbm9BY2s6IHRydWUgfSxcbiAgICAgIChlcnJvcjogRXJyb3IsIG9rOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdW1lclRhZyA9IG9rLmNvbnN1bWVyVGFnO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBuZXcgTWVzc2FnZShwYXJtYXMsIHtcbiAgICAgICAgICAgIHJlcGx5VG86IERJUkVDVF9RVUVVRSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBtZXNzYWdlLnNlbmQodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuIl19