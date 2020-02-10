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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBb0M7QUFHcEMsZ0RBQXdCO0FBQ3hCLHVDQUF3RTtBQTRDeEUsTUFBTSxZQUFZLEdBQUcsdUJBQXVCLENBQUM7QUFFN0MsTUFBYSxLQUFLO0lBd0NoQixZQUFZLFVBQXNCLEVBQUUsSUFBWSxFQUFFLFVBQW1CLEVBQUU7UUFWL0Qsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1FBV3pDLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1FBRXhCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQXBETSxNQUFNLENBQUMsU0FBUyxDQUNyQixPQUF3QixFQUN4QixPQUEwQjtRQUUxQixJQUFJLE9BQU8sT0FBTyxLQUFL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QyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xCLENBQUMsRUFDRCxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFDZixDQUFDLEtBQVksRUFBRSxFQUFPLEVBQUUsRUFBRTtZQUN4QixJQUFJLEtBQUssRUFBRTtnQkFDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDZjtpQkFBTTtnQkFDTCxXQUFXLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQztnQkFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLE1BQU0sRUFBRTtvQkFDbEMsT0FBTyxFQUFFLFlBQVk7aUJBQ3RCLENBQUMsQ0FBQztnQkFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BCO1FBQ0gsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFqY0Qsc0JBaWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQW1xcExpYiBmcm9tIFwiYW1xcGxpYi9jYWxsYmFja19hcGlcIjtcbmltcG9ydCB7IEJpbmRpbmcgfSBmcm9tIFwiLi9iaW5kaW5nXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vY29ubmVjdGlvblwiO1xuaW1wb3J0IHsgRXhjaGFuZ2UgfSBmcm9tIFwiLi9leGNoYW5nZVwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi9sb2dcIjtcbmltcG9ydCB7IEV4dGVybmFsQ29udGVudCwgTWVzc2FnZSwgTWVzc2FnZVByb3BlcnRpZXMgfSBmcm9tIFwiLi9tZXNzYWdlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIGV4Y2x1c2l2ZT86IGJvb2xlYW47XG4gIGR1cmFibGU/OiBib29sZWFuO1xuICBhdXRvRGVsZXRlPzogYm9vbGVhbjtcbiAgYXJndW1lbnRzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgbWVzc2FnZVR0bD86IG51bWJlcjtcbiAgZXhwaXJlcz86IG51bWJlcjtcbiAgZGVhZExldHRlckV4Y2hhbmdlPzogc3RyaW5nO1xuICBtYXhMZW5ndGg/OiBudW1iZXI7XG4gIHByZWZldGNoPzogbnVtYmVyO1xuICBub0NyZWF0ZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdFJlc3VsdCB7XG4gIHF1ZXVlOiBzdHJpbmc7XG4gIG1lc3NhZ2VDb3VudDogbnVtYmVyO1xuICBjb25zdW1lckNvdW50OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHVyZ2VSZXN1bHQge1xuICBtZXNzYWdlQ291bnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25zdW1lck9wdGlvbnMge1xuICBjb25zdW1lclRhZz86IHN0cmluZztcbiAgbm9Mb2NhbD86IGJvb2xlYW47XG4gIG5vQWNrPzogYm9vbGVhbjtcbiAgbWFudWFsQWNrPzogYm9vbGVhbjtcbiAgZXhjbHVzaXZlPzogYm9vbGVhbjtcbiAgcHJpb3JpdHk/OiBudW1iZXI7XG4gIGFyZ3VtZW50cz86IG9iamVjdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25zdW1lclJlc3VsdCB7XG4gIGNvbnN1bWVyVGFnOiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIENvbnN1bWVyID0gKFxuICBtc2c6IE1lc3NhZ2UsXG4gIGNoYW5uZWw/OiBBbXFwTGliLkNoYW5uZWwsXG4pID0+IFByb21pc2U8dm9pZD4gfCB2b2lkO1xuXG5jb25zdCBESVJFQ1RfUVVFVUUgPSBcImFtcS5yYWJiaXRtcS5yZXBseS10b1wiO1xuXG5leHBvcnQgY2xhc3MgUXVldWUge1xuICBwdWJsaWMgc3RhdGljIFNlcmlhbGl6ZShcbiAgICBjb250ZW50OiBFeHRlcm5hbENvbnRlbnQsXG4gICAgb3B0aW9uczogTWVzc2FnZVByb3BlcnRpZXMsXG4gICk6IEJ1ZmZlciB7XG4gICAgaWYgKHR5cGVvZiBjb250ZW50ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gbmV3IEJ1ZmZlcihjb250ZW50KTtcbiAgICB9IGVsc2UgaWYgKCEoY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIG9wdGlvbnMuY29udGVudFR5cGUgPSBcImFwcGxpY2F0aW9uL2pzb25cIjtcbiAgICAgIHJldHVybiBuZXcgQnVmZmVyKEpTT04uc3RyaW5naWZ5KGNvbnRlbnQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHN0YXRpYyBEZXNlcmlhbGl6ZShtZXNzYWdlOiBBbXFwTGliLk1lc3NhZ2UpOiBNZXNzYWdlIHwgc3RyaW5nIHtcbiAgICBjb25zdCBjb250ZW50ID0gbWVzc2FnZS5jb250ZW50LnRvU3RyaW5nKCk7XG4gICAgaWYgKG1lc3NhZ2UucHJvcGVydGllcy5jb250ZW50VHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb247XG4gIHByaXZhdGUgX25hbWU6IHN0cmluZztcbiAgcHJpdmF0ZSBfb3B0aW9uczogT3B0aW9ucztcblxuICBwcml2YXRlIF9kZWxldGluZz86IFByb21pc2U8UHVyZ2VSZXN1bHQ+O1xuICBwcml2YXRlIF9jbG9zaW5nPzogUHJvbWlzZTx2b2lkPjtcblxuICBwcml2YXRlIF9jb25zdW1lclN0b3BwaW5nOiBib29sZWFuID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfY29uc3VtZXI/OiBDb25zdW1lcjtcbiAgcHJpdmF0ZSBfY29uc3VtZXJPcHRpb25zPzogQ29uc3VtZXJPcHRpb25zO1xuICBwcml2YXRlIF9jb25zdW1lclRhZz86IHN0cmluZztcbiAgcHJpdmF0ZSBfY2hhbm5lbD86IEFtcXBMaWIuQ2hhbm5lbDtcblxuICBwcml2YXRlIF9wcm9taXNlZFF1ZXVlPzogUHJvbWlzZTxJbml0UmVzdWx0PjtcbiAgcHJpdmF0ZSBfcHJvbWlzZWRDb25zdW1lcj86IFByb21pc2U8Q29uc3VtZXJSZXN1bHQ+O1xuXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IENvbm5lY3Rpb24sIG5hbWU6IHN0cmluZywgb3B0aW9uczogT3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLmRlbGV0ZSA9IHRoaXMuZGVsZXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5jbG9zZSA9IHRoaXMuY2xvc2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNvbm5lY3RRdWV1ZSA9IHRoaXMuY29ubmVjdFF1ZXVlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5jb25uZWN0Q29uc3VtZXIgPSB0aGlzLmNvbm5lY3RDb25zdW1lci5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY29uc3VtZXJXcmFwcGVyID0gdGhpcy5jb25zdW1lcldyYXBwZXIuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuX2Nvbm5lY3Rpb24uYWRkUXVldWUodGhpcyk7XG4gICAgdGhpcy5idWlsZFF1ZXVlKCk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcHVibGlzaChjb250ZW50OiBFeHRlcm5hbENvbnRlbnQsIG9wdGlvbnM6IG9iamVjdCA9IHt9KSB7XG4gICAgY29uc3QgbmV3T3B0aW9ucyA9IHsgLi4ub3B0aW9ucyB9O1xuICAgIGNvbnN0IHJlc3VsdCA9IFF1ZXVlLlNlcmlhbGl6ZShcbiAgICAgIGNvbnRlbnQsXG4gICAgICBuZXdPcHRpb25zIGFzIEFtcXBMaWIuTWVzc2FnZVByb3BlcnRpZXMsXG4gICAgKTtcblxuICAgIGF3YWl0IHRoaXMuX3Byb21pc2VkUXVldWU7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIik7XG4gICAgICB9XG4gICAgICB0aGlzLl9jaGFubmVsLnNlbmRUb1F1ZXVlKHRoaXMuX25hbWUsIHJlc3VsdCwgbmV3T3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IHF1ZXVlTmFtZSA9IHRoaXMuX25hbWU7XG4gICAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5fY29ubmVjdGlvbjtcbiAgICAgIGF3YWl0IGNvbm5lY3Rpb24ucmVDcmVhdGVXaXRoVG9wb2xvZ3koZXJyb3IpO1xuICAgICAgY29ubmVjdGlvbi5xdWV1ZXNbcXVldWVOYW1lXS5wdWJsaXNoKGNvbnRlbnQsIG5ld09wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBidWlsZFF1ZXVlKCkge1xuICAgIHRoaXMuX3Byb21pc2VkUXVldWUgPSBuZXcgUHJvbWlzZTxJbml0UmVzdWx0Pih0aGlzLmNvbm5lY3RRdWV1ZSk7XG4gIH1cblxuICBwdWJsaWMgaW5pdCgpOiBQcm9taXNlPEluaXRSZXN1bHQ+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZWRRdWV1ZTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBkZWxldGVRdWV1ZSgpOiBQcm9taXNlPFB1cmdlUmVzdWx0PiB7XG4gICAgaWYgKCF0aGlzLl9kZWxldGluZykge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHRoaXMuZGVsZXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2RlbGV0aW5nO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGNsb3NlUXVldWUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9jbG9zaW5nKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UodGhpcy5jbG9zZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jbG9zaW5nO1xuICB9XG5cbiAgcHVibGljIHN1YnNjcmliZUNvbnN1bWVyKFxuICAgIGNvbnN1bWU6IENvbnN1bWVyLFxuICAgIG9wdGlvbnM6IENvbnN1bWVyT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPHZvaWQ+IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fcHJvbWlzZWRDb25zdW1lcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uc3VtZXIgYWxyZWFkeSBlc3RhYmxpc2hlZFwiKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jb25zdW1lck9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuX2NvbnN1bWVyID0gY29uc3VtZTtcbiAgICB0aGlzLmluaXRDb25zdW1lcigpO1xuICAgIHJldHVybiB0aGlzLl9wcm9taXNlZENvbnN1bWVyO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHVuc3Vic2NyaWJlQ29uc3VtZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9wcm9taXNlZENvbnN1bWVyIHx8IHRoaXMuX2NvbnN1bWVyU3RvcHBpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jb25zdW1lclN0b3BwaW5nID0gdHJ1ZTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRDb25zdW1lcjtcblxuICAgICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5fY29uc3VtZXJUYWcpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ29uc3VtZXJcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9jaGFubmVsLmNhbmNlbCh0aGlzLl9jb25zdW1lclRhZywgKGVycm9yOiBFcnJvciwgb2s6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9wcm9taXNlZENvbnN1bWVyO1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jb25zdW1lcjtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fY29uc3VtZXJPcHRpb25zO1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jb25zdW1lclN0b3BwaW5nO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgc2VuZChtZXNzYWdlOiBNZXNzYWdlKSB7XG4gICAgbWVzc2FnZS5zZW5kKHRoaXMpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHByZWZldGNoKGNvdW50OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZFF1ZXVlO1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpO1xuICAgIH1cbiAgICB0aGlzLl9jaGFubmVsLnByZWZldGNoKGNvdW50KTtcbiAgICB0aGlzLl9vcHRpb25zLnByZWZldGNoID0gY291bnQ7XG4gIH1cblxuICBwdWJsaWMgcmVjb3ZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRRdWV1ZTtcbiAgICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIik7XG4gICAgICB9XG4gICAgICB0aGlzLl9jaGFubmVsLnJlY292ZXIoKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgcnBjKHBhcmFtczogb2JqZWN0KTogUHJvbWlzZTxNZXNzYWdlPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPE1lc3NhZ2U+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuX3Byb21pc2VkUXVldWU7XG4gICAgICB0aGlzLmluaXRScGMocmVzb2x2ZSwgcmVqZWN0LCBwYXJhbXMpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGJpbmQoXG4gICAgb3JpZ2luOiBFeGNoYW5nZSxcbiAgICBleHByZXNzaW9uID0gXCJcIixcbiAgICBhcmdzOiBvYmplY3QgPSB7fSxcbiAgKTogUHJvbWlzZTxCaW5kaW5nPiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgYmluZGluZyA9IG5ldyBCaW5kaW5nKG9yaWdpbiwgdGhpcywgZXhwcmVzc2lvbiwgYXJncyk7XG4gICAgcmV0dXJuIGJpbmRpbmcuaW5pdCgpO1xuICB9XG5cbiAgcHVibGljIHVuYmluZChcbiAgICBvcmlnaW46IEV4Y2hhbmdlLFxuICAgIGV4cHJlc3Npb24gPSBcIlwiLFxuICAgIGFyZ3M6IG9iamVjdCA9IHt9LFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5iaW5kaW5nc1tcbiAgICAgIEJpbmRpbmcuR2VuZXJhdGVJZChvcmlnaW4sIHRoaXMsIGV4cHJlc3Npb24pXG4gICAgXS5kZWxldGVCaW5kaW5nKCk7XG4gIH1cblxuICBwdWJsaWMgaW5pdENvbnN1bWVyKCkge1xuICAgIHRoaXMuX3Byb21pc2VkQ29uc3VtZXIgPSBuZXcgUHJvbWlzZTxDb25zdW1lclJlc3VsdD4odGhpcy5jb25uZWN0Q29uc3VtZXIpO1xuICB9XG5cbiAgcHVibGljIGdldCBjb25uZWN0aW9uKCk6IENvbm5lY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uO1xuICB9XG5cbiAgcHVibGljIGdldCBjaGFubmVsKCk6IEFtcXBMaWIuQ2hhbm5lbCB7XG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jaGFubmVsO1xuICB9XG5cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cblxuICBnZXQgY29uc3VtZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnN1bWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaXZhdGUgbWV0aG9kc1xuICAgKi9cblxuICBwcml2YXRlIGFzeW5jIGNvbm5lY3RRdWV1ZShcbiAgICByZXNvbHZlOiAodmFsdWU6IEluaXRSZXN1bHQpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5fY29ubmVjdGlvbi5pbml0KCk7XG4gICAgICBjb25zdCBpbnRlcm5hbENvbm5lY3Rpb24gPSB0aGlzLl9jb25uZWN0aW9uLmNvbm5lY3Rpb247XG5cbiAgICAgIGlmICghaW50ZXJuYWxDb25uZWN0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHQgY29ubmVjdGlvblwiKTtcbiAgICAgIH1cblxuICAgICAgaW50ZXJuYWxDb25uZWN0aW9uLmNyZWF0ZUNoYW5uZWwoKGVycm9yOiBFcnJvciwgY2hhbm5lbDogQW1xcExpYi5DaGFubmVsKSA9PiB7XG4gICAgICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgICB0aGlzLl9jaGFubmVsID0gY2hhbm5lbDtcblxuICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLm5vQ3JlYXRlKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGFubmVsLmNoZWNrUXVldWUoXG4gICAgICAgICAgICAgIHRoaXMuX25hbWUsXG4gICAgICAgICAgICAgIHRoaXMuYXNzZXJ0UXVldWUocmVzb2x2ZSwgcmVqZWN0KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NoYW5uZWwuYXNzZXJ0UXVldWUoXG4gICAgICAgICAgICAgIHRoaXMuX25hbWUsXG4gICAgICAgICAgICAgIHRoaXMuX29wdGlvbnMsXG4gICAgICAgICAgICAgIHRoaXMuYXNzZXJ0UXVldWUocmVzb2x2ZSwgcmVqZWN0KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIGVycm9yXG4gICAgICBsb2cuZXJyb3IoXG4gICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIGNoYW5uZWwgZnJvbSB0aGUgY29ubmVjdGlvbjogJHtlcnJvci5tZXNzYWdlfWAsXG4gICAgICAgIHtcbiAgICAgICAgICBtb2R1bGU6IFwiYW1xcFwiLFxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzc2VydFF1ZXVlKFxuICAgIHJlc29sdmU6ICh2YWx1ZTogSW5pdFJlc3VsdCkgPT4gdm9pZCxcbiAgICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQsXG4gICkge1xuICAgIHJldHVybiAoZXJyb3I6IEVycm9yLCBvazogQW1xcExpYi5SZXBsaWVzLkVtcHR5KSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgbG9nLmVycm9yKGBGYWlsZWQgdG8gYXNzZXJ0fGNoZWNrIHF1ZXVlICR7dGhpcy5fbmFtZX0uYCwge1xuICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9jb25uZWN0aW9uLnJlbW92ZVF1ZXVlKHRoaXMuX25hbWUpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMucHJlZmV0Y2ggJiYgdGhpcy5fY2hhbm5lbCkge1xuICAgICAgICAgIHRoaXMuX2NoYW5uZWwucHJlZmV0Y2godGhpcy5fb3B0aW9ucy5wcmVmZXRjaCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShvayBhcyBJbml0UmVzdWx0KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGUoXG4gICAgcmVzb2x2ZTogKHZhbHVlPzogUHVyZ2VSZXN1bHQpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZFF1ZXVlO1xuICAgIGF3YWl0IEJpbmRpbmcuUmVtb3ZlQmluZGluZ3ModGhpcyk7XG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnVuc3Vic2NyaWJlQ29uc3VtZXIoKTtcbiAgICB0aGlzLl9jaGFubmVsLmRlbGV0ZVF1ZXVlKHRoaXMuX25hbWUsIHt9LCAoZXJyb3I6IEVycm9yLCBvazogYW55KSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShyZXNvbHZlLCByZWplY3QsIG9rKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2xvc2UocmVzb2x2ZTogKCkgPT4gdm9pZCwgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkKSB7XG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRRdWV1ZTtcbiAgICBhd2FpdCBCaW5kaW5nLlJlbW92ZUJpbmRpbmdzKHRoaXMpO1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudW5zdWJzY3JpYmVDb25zdW1lcigpO1xuICAgIHRoaXMuaW52YWxpZGF0ZShyZXNvbHZlLCByZWplY3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbnZhbGlkYXRlKFxuICAgIHJlc29sdmU6ICh2YWx1ZT86IFB1cmdlUmVzdWx0KSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgICB2YWx1ZT86IFB1cmdlUmVzdWx0LFxuICApIHtcbiAgICBkZWxldGUgdGhpcy5fcHJvbWlzZWRRdWV1ZTsgLy8gaW52YWxpZGF0ZSBwcm9taXNlXG4gICAgdGhpcy5fY29ubmVjdGlvbi5yZW1vdmVRdWV1ZSh0aGlzLl9uYW1lKTtcblxuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX2NoYW5uZWwuY2xvc2UoKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgdGhpcy5fY2hhbm5lbDtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2Nvbm5lY3Rpb247XG4gICAgICAgIHJlc29sdmUodmFsdWUgYXMgUHVyZ2VSZXN1bHQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjb25uZWN0Q29uc3VtZXIoXG4gICAgcmVzb2x2ZTogKHJlc3VsdDogQ29uc3VtZXJSZXN1bHQpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZFF1ZXVlO1xuXG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGFubmVsLmNvbnN1bWUoXG4gICAgICB0aGlzLl9uYW1lLFxuICAgICAgdGhpcy5jb25zdW1lcldyYXBwZXIsXG4gICAgICB0aGlzLl9jb25zdW1lck9wdGlvbnMsXG4gICAgICAoZXJyb3I6IEVycm9yLCBvazogQW1xcExpYi5SZXBsaWVzLkNvbnN1bWUpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9jb25zdW1lclRhZyA9IG9rLmNvbnN1bWVyVGFnO1xuICAgICAgICAgIHJlc29sdmUob2spO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG5cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29uc3VtZXJXcmFwcGVyKG1lc3NhZ2U6IEFtcXBMaWIuTWVzc2FnZSB8IG51bGwpIHtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIW1lc3NhZ2UpIHtcbiAgICAgICAgLy8gVE9ETzogbm90IHN1cmUgd2hhdCBoYXBwZW5zIGhlcmVcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBuZXcgTWVzc2FnZShtZXNzYWdlLmNvbnRlbnQsIG1lc3NhZ2UucHJvcGVydGllcyk7XG4gICAgICByZXN1bHQuc2V0RmllbGRzKG1lc3NhZ2UuZmllbGRzKTtcbiAgICAgIHJlc3VsdC5zZXRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgcmVzdWx0LnNldENoYW5uZWwodGhpcy5fY2hhbm5lbCk7XG5cbiAgICAgIGlmICghdGhpcy5fY29uc3VtZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWlyZWQgQ29uc3VtZSBmdW5jdGlvblwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IHRoaXMuX2NvbnN1bWVyKHJlc3VsdCk7XG5cbiAgICAgIGlmIChtZXNzYWdlLnByb3BlcnRpZXMucmVwbHlUbykge1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge307XG4gICAgICAgIGNvbnN0IHZhbHVlID0gUXVldWUuU2VyaWFsaXplKHJlc3VsdCwgb3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fY2hhbm5lbC5zZW5kVG9RdWV1ZShtZXNzYWdlLnByb3BlcnRpZXMucmVwbHlUbywgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2cuZXJyb3IoYENvbnN1bWUgZnVuY3Rpb24gcmV0dXJuZWQgZXJyb3I6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cblxuICAvLyBUT0RPOiBmaXJzdCBhdHRlbXB0IGltcHJvdmUgbGF0ZXJcbiAgcHJpdmF0ZSBpbml0UnBjKFxuICAgIHJlc29sdmU6IChtZXNzYWdlOiBNZXNzYWdlKSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgICBwYXJtYXM6IEV4dGVybmFsQ29udGVudCxcbiAgKSB7XG4gICAgbGV0IGNvbnN1bWVyVGFnOiBzdHJpbmc7XG5cbiAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NoYW5uZWwuY29uc3VtZShcbiAgICAgIERJUkVDVF9RVUVVRSxcbiAgICAgIChyZXN1bHQ6IEFtcXBMaWIuTWVzc2FnZSB8IG51bGwpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiTm8gbWVzc2FnZSBjb25zdW1lZFwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY2hhbm5lbC5jYW5jZWwoY29uc3VtZXJUYWcpO1xuICAgICAgICBjb25zdCBhbnN3ZXIgPSBuZXcgTWVzc2FnZShyZXN1bHQuY29udGVudCwgcmVzdWx0LnByb3BlcnRpZXMpO1xuICAgICAgICBhbnN3ZXIuc2V0RmllbGRzKHJlc3VsdC5maWVsZHMpO1xuICAgICAgICByZXNvbHZlKGFuc3dlcik7XG4gICAgICB9LFxuICAgICAgeyBub0FjazogdHJ1ZSB9LFxuICAgICAgKGVycm9yOiBFcnJvciwgb2s6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN1bWVyVGFnID0gb2suY29uc3VtZXJUYWc7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9IG5ldyBNZXNzYWdlKHBhcm1hcywge1xuICAgICAgICAgICAgcmVwbHlUbzogRElSRUNUX1FVRVVFLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIG1lc3NhZ2Uuc2VuZCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICApO1xuICB9XG59XG4iXX0=