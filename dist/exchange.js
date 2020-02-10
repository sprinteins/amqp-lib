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
const queue_1 = require("./queue");
class Exchange {
    constructor(connection, name, type = "", options = {}) {
        this._connection = connection;
        this._name = name;
        this._type = type;
        this._options = options;
        this.connectExchange = this.connectExchange.bind(this);
        this.delete = this.delete.bind(this);
        this.close = this.close.bind(this);
        this.buildExchange();
    }
    publish(content, routingKey = "", options) {
        return __awaiter(this, void 0, void 0, function* () {
            const newOptions = Object.assign({}, options);
            const result = queue_1.Queue.Serialize(content, newOptions);
            yield this._promisedExchange;
            try {
                if (!this._channel) {
                    throw new Error("Corrupt Channel");
                    return;
                }
                this._channel.publish(this._name, routingKey, result, newOptions);
            }
            catch (error) {
                const exchangeName = this._name;
                const connection = this._connection;
                yield connection.reCreateWithTopology(error);
                connection.exchanges[exchangeName].publish(content, routingKey, newOptions);
            }
        });
    }
    buildExchange() {
        return __awaiter(this, void 0, void 0, function* () {
            this._promisedExchange = new Promise(this.connectExchange);
        });
    }
    deleteExchange() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._deleting) {
                this._deleting = new Promise(this.delete);
            }
            return this._deleting;
        });
    }
    closeExchange() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._closing) {
                this._closing = new Promise(this.close);
            }
            return this._closing;
        });
    }
    send(message, routingKey = "") {
        message.send(this, routingKey);
    }
    init() {
        return this._promisedExchange;
    }
    bind(origin, expression = "", args = {}) {
        const binding = new binding_1.Binding(origin, this, expression, args);
        return binding.init();
    }
    unbind(origin, expression = "", args = {}) {
        return this._connection.bindings[binding_1.Binding.GenerateId(origin, this, expression)].deleteBinding();
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
    get type() {
        return this._type;
    }
    /**
     * Private methods
     */
    connectExchange(resolve, reject) {
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
                            this._channel.checkExchange(this._name, this.assertExchange(resolve, reject));
                        }
                        else {
                            this._channel.assertExchange(this._name, this._type, this._options, this.assertExchange(resolve, reject));
                        }
                        return;
                    }
                    reject(error);
                });
                this._connection.addExchange(this);
            }
            catch (error) {
                // error
                log_1.default.error(`Failed to create channel from the connection: ${error.message}`, {
                    module: "amqp",
                });
            }
        });
    }
    assertExchange(resolve, reject) {
        return (error, ok) => {
            if (!error) {
                resolve(ok);
                return;
            }
            log_1.default.error(`Failed to assert|check exchange`, {
                module: "amqp",
            });
            this._connection.removeExchange(this.name);
            reject(error);
        };
    }
    delete(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._promisedExchange;
            yield binding_1.Binding.RemoveBindings(this);
            if (!this._channel) {
                reject(new Error("Corrupt Channel"));
                return;
            }
            this._channel.deleteExchange(this._name, {}, (err, ok) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.invalidate(resolve, reject);
                }
            });
        });
    }
    close(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._promisedExchange;
            yield binding_1.Binding.RemoveBindings(this);
            this.invalidate(resolve, reject);
        });
    }
    invalidate(resolve, reject) {
        if (!this._channel) {
            reject(new Error("Corrupt Channel"));
            return;
        }
        this._channel.close((error) => {
            delete this._promisedExchange; // invalidate promise
            this._connection.removeExchange(this._name);
            if (error) {
                reject(error);
            }
            else {
                delete this._channel;
                delete this._connection;
                resolve();
            }
        });
    }
}
exports.Exchange = Exchange;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjaGFuZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXhjaGFuZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBb0M7QUFFcEMsZ0RBQXdCO0FBRXhCLG1DQUFnQztBQWVoQyxNQUFhLFFBQVE7SUFXbkIsWUFDRSxVQUFzQixFQUN0QixJQUFZLEVBQ1osT0FBZSxFQUFFLEVBQ2pCLFVBQW1CLEVBQUU7UUFFckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFFeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFWSxPQUFPLENBQ2xCLE9BQXdCLEVBQ3hCLFVBQVUsR0FBRyxFQUFFLEVBQ2YsT0FBMEI7O1lBRTFCLE1BQU0sVUFBVSxxQkFBUSxPQUFPLENBQUUsQ0FBQztZQUVsQyxNQUFNLE1BQU0sR0FBRyxhQUFLLENBQUMsU0FBUyxDQUM1QixPQUFPLEVBQ1AsVUFBVSxDQUNYLENBQUM7WUFFRixNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUM3QixJQUFJO2dCQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGlC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SUFFTyxVQUFVLENBQUMsT0FBbUIsRUFBRSxNQUE4QjtRQUNwRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDbkMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxxQkFBcUI7WUFDcEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNmO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUN4QixPQUFPLEVBQUUsQ0FBQzthQUNYO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF0T0QsNEJBc09DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQW1xcExpYiBmcm9tIFwiYW1xcGxpYi9jYWxsYmFja19hcGlcIjtcbmltcG9ydCB7IEJpbmRpbmcgfSBmcm9tIFwiLi9iaW5kaW5nXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vY29ubmVjdGlvblwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi9sb2dcIjtcbmltcG9ydCB7IEV4dGVybmFsQ29udGVudCwgTWVzc2FnZSwgTWVzc2FnZVByb3BlcnRpZXMgfSBmcm9tIFwiLi9tZXNzYWdlXCI7XG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gXCIuL3F1ZXVlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIGR1cmFibGU/OiBib29sZWFuO1xuICBpbnRlcm5hbD86IGJvb2xlYW47XG4gIGF1dG9EZWxldGU/OiBib29sZWFuO1xuICBhbHRlcm5hdGVFeGNoYW5nZT86IHN0cmluZztcbiAgYXJndW1lbnRzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgbm9DcmVhdGU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3VsdCB7XG4gIGV4Y2hhbmdlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBFeGNoYW5nZSB7XG4gIHByaXZhdGUgX2Nvbm5lY3Rpb246IENvbm5lY3Rpb247XG4gIHByaXZhdGUgX25hbWU6IHN0cmluZztcbiAgcHJpdmF0ZSBfdHlwZTogc3RyaW5nO1xuICBwcml2YXRlIF9vcHRpb25zOiBPcHRpb25zO1xuICBwcml2YXRlIF9jaGFubmVsPzogQW1xcExpYi5DaGFubmVsO1xuXG4gIHByaXZhdGUgX3Byb21pc2VkRXhjaGFuZ2U/OiBQcm9taXNlPFJlc3VsdD47XG4gIHByaXZhdGUgX2RlbGV0aW5nPzogUHJvbWlzZTx2b2lkPjtcbiAgcHJpdmF0ZSBfY2xvc2luZz86IFByb21pc2U8dm9pZD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdHlwZTogc3RyaW5nID0gXCJcIixcbiAgICBvcHRpb25zOiBPcHRpb25zID0ge30sXG4gICkge1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgIHRoaXMuX3R5cGUgPSB0eXBlO1xuICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgdGhpcy5jb25uZWN0RXhjaGFuZ2UgPSB0aGlzLmNvbm5lY3RFeGNoYW5nZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZGVsZXRlID0gdGhpcy5kZWxldGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNsb3NlID0gdGhpcy5jbG9zZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5idWlsZEV4Y2hhbmdlKCk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcHVibGlzaChcbiAgICBjb250ZW50OiBFeHRlcm5hbENvbnRlbnQsXG4gICAgcm91dGluZ0tleSA9IFwiXCIsXG4gICAgb3B0aW9uczogTWVzc2FnZVByb3BlcnRpZXMsXG4gICkge1xuICAgIGNvbnN0IG5ld09wdGlvbnMgPSB7IC4uLm9wdGlvbnMgfTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IFF1ZXVlLlNlcmlhbGl6ZShcbiAgICAgIGNvbnRlbnQsXG4gICAgICBuZXdPcHRpb25zLFxuICAgICk7XG5cbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZEV4Y2hhbmdlO1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuX2NoYW5uZWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9jaGFubmVsLnB1Ymxpc2godGhpcy5fbmFtZSwgcm91dGluZ0tleSwgcmVzdWx0LCBuZXdPcHRpb25zKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZXhjaGFuZ2VOYW1lID0gdGhpcy5fbmFtZTtcbiAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSB0aGlzLl9jb25uZWN0aW9uO1xuICAgICAgYXdhaXQgY29ubmVjdGlvbi5yZUNyZWF0ZVdpdGhUb3BvbG9neShlcnJvcik7XG4gICAgICBjb25uZWN0aW9uLmV4Y2hhbmdlc1tleGNoYW5nZU5hbWVdLnB1Ymxpc2goXG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIHJvdXRpbmdLZXksXG4gICAgICAgIG5ld09wdGlvbnMsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBidWlsZEV4Y2hhbmdlKCkge1xuICAgIHRoaXMuX3Byb21pc2VkRXhjaGFuZ2UgPSBuZXcgUHJvbWlzZSh0aGlzLmNvbm5lY3RFeGNoYW5nZSk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZGVsZXRlRXhjaGFuZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9kZWxldGluZykge1xuICAgICAgdGhpcy5fZGVsZXRpbmcgPSBuZXcgUHJvbWlzZSh0aGlzLmRlbGV0ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9kZWxldGluZztcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBjbG9zZUV4Y2hhbmdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fY2xvc2luZykge1xuICAgICAgdGhpcy5fY2xvc2luZyA9IG5ldyBQcm9taXNlKHRoaXMuY2xvc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2xvc2luZztcbiAgfVxuXG4gIHB1YmxpYyBzZW5kKG1lc3NhZ2U6IE1lc3NhZ2UsIHJvdXRpbmdLZXkgPSBcIlwiKSB7XG4gICAgbWVzc2FnZS5zZW5kKHRoaXMsIHJvdXRpbmdLZXkpO1xuICB9XG5cbiAgcHVibGljIGluaXQoKTogUHJvbWlzZTxSZXN1bHQ+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fcHJvbWlzZWRFeGNoYW5nZTtcbiAgfVxuXG4gIHB1YmxpYyBiaW5kKFxuICAgIG9yaWdpbjogRXhjaGFuZ2UsXG4gICAgZXhwcmVzc2lvbiA9IFwiXCIsXG4gICAgYXJnczogb2JqZWN0ID0ge30sXG4gICk6IFByb21pc2U8QmluZGluZz4gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGJpbmRpbmcgPSBuZXcgQmluZGluZyhvcmlnaW4sIHRoaXMsIGV4cHJlc3Npb24sIGFyZ3MpO1xuICAgIHJldHVybiBiaW5kaW5nLmluaXQoKTtcbiAgfVxuXG4gIHB1YmxpYyB1bmJpbmQob3JpZ2luOiBFeGNoYW5nZSwgZXhwcmVzc2lvbiA9IFwiXCIsIGFyZ3M6IG9iamVjdCA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMuX2Nvbm5lY3Rpb24uYmluZGluZ3NbXG4gICAgICBCaW5kaW5nLkdlbmVyYXRlSWQob3JpZ2luLCB0aGlzLCBleHByZXNzaW9uKVxuICAgIF0uZGVsZXRlQmluZGluZygpO1xuICB9XG5cbiAgcHVibGljIGdldCBjb25uZWN0aW9uKCk6IENvbm5lY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uO1xuICB9XG5cbiAgcHVibGljIGdldCBjaGFubmVsKCk6IEFtcXBMaWIuQ2hhbm5lbCB7XG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IENoYW5uZWxcIik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jaGFubmVsO1xuICB9XG5cbiAgcHVibGljIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHR5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcml2YXRlIG1ldGhvZHNcbiAgICovXG5cbiAgcHJpdmF0ZSBhc3luYyBjb25uZWN0RXhjaGFuZ2UoXG4gICAgcmVzb2x2ZTogKHZhbHVlOiBSZXN1bHQpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICB0cnkge1xuXG4gICAgICBhd2FpdCB0aGlzLl9jb25uZWN0aW9uLmluaXQoKTtcblxuICAgICAgY29uc3QgaW50ZXJuYWxDb25uZWN0aW9uID0gdGhpcy5fY29ubmVjdGlvbi5jb25uZWN0aW9uO1xuXG4gICAgICBpZiAoIWludGVybmFsQ29ubmVjdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0IGNvbm5lY3Rpb25cIik7XG4gICAgICB9XG5cbiAgICAgIGludGVybmFsQ29ubmVjdGlvbi5jcmVhdGVDaGFubmVsKChlcnJvcjogRXJyb3IsIGNoYW5uZWw6IEFtcXBMaWIuQ2hhbm5lbCkgPT4ge1xuICAgICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgICAgdGhpcy5fY2hhbm5lbCA9IGNoYW5uZWw7XG5cbiAgICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy5ub0NyZWF0ZSkge1xuICAgICAgICAgICAgdGhpcy5fY2hhbm5lbC5jaGVja0V4Y2hhbmdlKFxuICAgICAgICAgICAgICB0aGlzLl9uYW1lLFxuICAgICAgICAgICAgICB0aGlzLmFzc2VydEV4Y2hhbmdlKHJlc29sdmUsIHJlamVjdCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jaGFubmVsLmFzc2VydEV4Y2hhbmdlKFxuICAgICAgICAgICAgICB0aGlzLl9uYW1lLFxuICAgICAgICAgICAgICB0aGlzLl90eXBlLFxuICAgICAgICAgICAgICB0aGlzLl9vcHRpb25zLFxuICAgICAgICAgICAgICB0aGlzLmFzc2VydEV4Y2hhbmdlKHJlc29sdmUsIHJlamVjdCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmFkZEV4Y2hhbmdlKHRoaXMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBlcnJvclxuICAgICAgbG9nLmVycm9yKFxuICAgICAgICBgRmFpbGVkIHRvIGNyZWF0ZSBjaGFubmVsIGZyb20gdGhlIGNvbm5lY3Rpb246ICR7ZXJyb3IubWVzc2FnZX1gLFxuICAgICAgICB7XG4gICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnRFeGNoYW5nZShcbiAgICByZXNvbHZlOiAodmFsdWU6IFJlc3VsdCkgPT4gdm9pZCxcbiAgICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQsXG4gICkge1xuICAgIHJldHVybiAoZXJyb3I6IEVycm9yIHwgdW5kZWZpbmVkLCBvazogQW1xcExpYi5SZXBsaWVzLkVtcHR5KSA9PiB7XG4gICAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgIHJlc29sdmUob2sgYXMgUmVzdWx0KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbG9nLmVycm9yKGBGYWlsZWQgdG8gYXNzZXJ0fGNoZWNrIGV4Y2hhbmdlYCwge1xuICAgICAgICBtb2R1bGU6IFwiYW1xcFwiLFxuICAgICAgfSk7XG4gICAgICB0aGlzLl9jb25uZWN0aW9uLnJlbW92ZUV4Y2hhbmdlKHRoaXMubmFtZSk7XG4gICAgICByZWplY3QoZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbGV0ZShyZXNvbHZlOiAoKSA9PiB2b2lkLCByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQpIHtcbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZEV4Y2hhbmdlO1xuICAgIGF3YWl0IEJpbmRpbmcuUmVtb3ZlQmluZGluZ3ModGhpcyk7XG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGFubmVsLmRlbGV0ZUV4Y2hhbmdlKHRoaXMuX25hbWUsIHt9LCAoZXJyLCBvaykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjbG9zZShyZXNvbHZlOiAoKSA9PiB2b2lkLCByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQpIHtcbiAgICBhd2FpdCB0aGlzLl9wcm9taXNlZEV4Y2hhbmdlO1xuICAgIGF3YWl0IEJpbmRpbmcuUmVtb3ZlQmluZGluZ3ModGhpcyk7XG4gICAgdGhpcy5pbnZhbGlkYXRlKHJlc29sdmUsIHJlamVjdCk7XG4gIH1cblxuICBwcml2YXRlIGludmFsaWRhdGUocmVzb2x2ZTogKCkgPT4gdm9pZCwgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkKSB7XG4gICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGFubmVsLmNsb3NlKChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9wcm9taXNlZEV4Y2hhbmdlOyAvLyBpbnZhbGlkYXRlIHByb21pc2VcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24ucmVtb3ZlRXhjaGFuZ2UodGhpcy5fbmFtZSk7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9jaGFubmVsO1xuICAgICAgICBkZWxldGUgdGhpcy5fY29ubmVjdGlvbjtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG4iXX0=