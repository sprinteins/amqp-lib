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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjaGFuZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXhjaGFuZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBb0M7QUFFcEMsZ0RBQXdCO0FBRXhCLG1DQUFnQztBQWVoQyxNQUFhLFFBQVE7SUFXbkIsWUFDRSxVQUFzQixFQUN0QixJQUFZLEVBQ1osT0FBZSxFQUFFLEVBQ2pCLFVBQW1CLEVBQUU7UUFFckIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFFeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFbkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFWSxPQUFPLENBQ2xCLE9BQXdCLEVBQ3hCLFVBQVUsR0FBRyxFQUFFLEVBQ2YsT0FBbUI7O1lBRW5CLE1BQU0sVUFBVSxxQkFBUSxPQUFPLENBQUUsQ0FBQztZQUVsQyxNQUFNLE1BQU0sR0FBRyxhQUFLLENBQUMsU0FBUyxDQUM1QixPQUFPLEVBQ1AsVUFBVSxDQUNYLENBQUM7WUFFRixNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUM3QixJQUFJO2dCQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGlC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SUFFTyxVQUFVLENBQUMsT0FBbUIsRUFBRSxNQUE4QjtRQUNwRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDbkMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxxQkFBcUI7WUFDcEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNmO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUN4QixPQUFPLEVBQUUsQ0FBQzthQUNYO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF0T0QsNEJBc09DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQW1xcExpYiBmcm9tIFwiYW1xcGxpYi9jYWxsYmFja19hcGlcIjtcbmltcG9ydCB7IEJpbmRpbmcgfSBmcm9tIFwiLi9iaW5kaW5nXCI7XG5pbXBvcnQgeyBDb25uZWN0aW9uIH0gZnJvbSBcIi4vY29ubmVjdGlvblwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi9sb2dcIjtcbmltcG9ydCB7IEV4dGVybmFsQ29udGVudCwgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCIuL21lc3NhZ2VcIjtcbmltcG9ydCB7IFF1ZXVlIH0gZnJvbSBcIi4vcXVldWVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpb25zIHtcbiAgZHVyYWJsZT86IGJvb2xlYW47XG4gIGludGVybmFsPzogYm9vbGVhbjtcbiAgYXV0b0RlbGV0ZT86IGJvb2xlYW47XG4gIGFsdGVybmF0ZUV4Y2hhbmdlPzogc3RyaW5nO1xuICBhcmd1bWVudHM/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuICBub0NyZWF0ZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzdWx0IHtcbiAgZXhjaGFuZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEV4Y2hhbmdlIHtcbiAgcHJpdmF0ZSBfY29ubmVjdGlvbjogQ29ubmVjdGlvbjtcbiAgcHJpdmF0ZSBfbmFtZTogc3RyaW5nO1xuICBwcml2YXRlIF90eXBlOiBzdHJpbmc7XG4gIHByaXZhdGUgX29wdGlvbnM6IE9wdGlvbnM7XG4gIHByaXZhdGUgX2NoYW5uZWw/OiBBbXFwTGliLkNoYW5uZWw7XG5cbiAgcHJpdmF0ZSBfcHJvbWlzZWRFeGNoYW5nZT86IFByb21pc2U8UmVzdWx0PjtcbiAgcHJpdmF0ZSBfZGVsZXRpbmc/OiBQcm9taXNlPHZvaWQ+O1xuICBwcml2YXRlIF9jbG9zaW5nPzogUHJvbWlzZTx2b2lkPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBzdHJpbmcgPSBcIlwiLFxuICAgIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgdGhpcy5fdHlwZSA9IHR5cGU7XG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICB0aGlzLmNvbm5lY3RFeGNoYW5nZSA9IHRoaXMuY29ubmVjdEV4Y2hhbmdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5kZWxldGUgPSB0aGlzLmRlbGV0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY2xvc2UgPSB0aGlzLmNsb3NlLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmJ1aWxkRXhjaGFuZ2UoKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBwdWJsaXNoKFxuICAgIGNvbnRlbnQ6IEV4dGVybmFsQ29udGVudCxcbiAgICByb3V0aW5nS2V5ID0gXCJcIixcbiAgICBvcHRpb25zOiBQcm9wZXJ0aWVzLFxuICApIHtcbiAgICBjb25zdCBuZXdPcHRpb25zID0geyAuLi5vcHRpb25zIH07XG5cbiAgICBjb25zdCByZXN1bHQgPSBRdWV1ZS5TZXJpYWxpemUoXG4gICAgICBjb250ZW50LFxuICAgICAgbmV3T3B0aW9ucyxcbiAgICApO1xuXG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRFeGNoYW5nZTtcbiAgICB0cnkge1xuICAgICAgaWYgKCF0aGlzLl9jaGFubmVsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fY2hhbm5lbC5wdWJsaXNoKHRoaXMuX25hbWUsIHJvdXRpbmdLZXksIHJlc3VsdCwgbmV3T3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGV4Y2hhbmdlTmFtZSA9IHRoaXMuX25hbWU7XG4gICAgICBjb25zdCBjb25uZWN0aW9uID0gdGhpcy5fY29ubmVjdGlvbjtcbiAgICAgIGF3YWl0IGNvbm5lY3Rpb24ucmVDcmVhdGVXaXRoVG9wb2xvZ3koZXJyb3IpO1xuICAgICAgY29ubmVjdGlvbi5leGNoYW5nZXNbZXhjaGFuZ2VOYW1lXS5wdWJsaXNoKFxuICAgICAgICBjb250ZW50LFxuICAgICAgICByb3V0aW5nS2V5LFxuICAgICAgICBuZXdPcHRpb25zLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYnVpbGRFeGNoYW5nZSgpIHtcbiAgICB0aGlzLl9wcm9taXNlZEV4Y2hhbmdlID0gbmV3IFByb21pc2UodGhpcy5jb25uZWN0RXhjaGFuZ2UpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGRlbGV0ZUV4Y2hhbmdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5fZGVsZXRpbmcpIHtcbiAgICAgIHRoaXMuX2RlbGV0aW5nID0gbmV3IFByb21pc2UodGhpcy5kZWxldGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZGVsZXRpbmc7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgY2xvc2VFeGNoYW5nZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuX2Nsb3NpbmcpIHtcbiAgICAgIHRoaXMuX2Nsb3NpbmcgPSBuZXcgUHJvbWlzZSh0aGlzLmNsb3NlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2Nsb3Npbmc7XG4gIH1cblxuICBwdWJsaWMgc2VuZChtZXNzYWdlOiBNZXNzYWdlLCByb3V0aW5nS2V5ID0gXCJcIikge1xuICAgIG1lc3NhZ2Uuc2VuZCh0aGlzLCByb3V0aW5nS2V5KTtcbiAgfVxuXG4gIHB1YmxpYyBpbml0KCk6IFByb21pc2U8UmVzdWx0PiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3Byb21pc2VkRXhjaGFuZ2U7XG4gIH1cblxuICBwdWJsaWMgYmluZChcbiAgICBvcmlnaW46IEV4Y2hhbmdlLFxuICAgIGV4cHJlc3Npb24gPSBcIlwiLFxuICAgIGFyZ3M6IG9iamVjdCA9IHt9LFxuICApOiBQcm9taXNlPEJpbmRpbmc+IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBiaW5kaW5nID0gbmV3IEJpbmRpbmcob3JpZ2luLCB0aGlzLCBleHByZXNzaW9uLCBhcmdzKTtcbiAgICByZXR1cm4gYmluZGluZy5pbml0KCk7XG4gIH1cblxuICBwdWJsaWMgdW5iaW5kKG9yaWdpbjogRXhjaGFuZ2UsIGV4cHJlc3Npb24gPSBcIlwiLCBhcmdzOiBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiB0aGlzLl9jb25uZWN0aW9uLmJpbmRpbmdzW1xuICAgICAgQmluZGluZy5HZW5lcmF0ZUlkKG9yaWdpbiwgdGhpcywgZXhwcmVzc2lvbilcbiAgICBdLmRlbGV0ZUJpbmRpbmcoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY29ubmVjdGlvbigpOiBDb25uZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbjtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgY2hhbm5lbCgpOiBBbXFwTGliLkNoYW5uZWwge1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBDaGFubmVsXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2hhbm5lbDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9uYW1lO1xuICB9XG5cbiAgcHVibGljIGdldCB0eXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogUHJpdmF0ZSBtZXRob2RzXG4gICAqL1xuXG4gIHByaXZhdGUgYXN5bmMgY29ubmVjdEV4Y2hhbmdlKFxuICAgIHJlc29sdmU6ICh2YWx1ZTogUmVzdWx0KSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgKSB7XG4gICAgdHJ5IHtcblxuICAgICAgYXdhaXQgdGhpcy5fY29ubmVjdGlvbi5pbml0KCk7XG5cbiAgICAgIGNvbnN0IGludGVybmFsQ29ubmVjdGlvbiA9IHRoaXMuX2Nvbm5lY3Rpb24uY29ubmVjdGlvbjtcblxuICAgICAgaWYgKCFpbnRlcm5hbENvbm5lY3Rpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdCBjb25uZWN0aW9uXCIpO1xuICAgICAgfVxuXG4gICAgICBpbnRlcm5hbENvbm5lY3Rpb24uY3JlYXRlQ2hhbm5lbCgoZXJyb3I6IEVycm9yLCBjaGFubmVsOiBBbXFwTGliLkNoYW5uZWwpID0+IHtcbiAgICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICAgIHRoaXMuX2NoYW5uZWwgPSBjaGFubmVsO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMubm9DcmVhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NoYW5uZWwuY2hlY2tFeGNoYW5nZShcbiAgICAgICAgICAgICAgdGhpcy5fbmFtZSxcbiAgICAgICAgICAgICAgdGhpcy5hc3NlcnRFeGNoYW5nZShyZXNvbHZlLCByZWplY3QpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY2hhbm5lbC5hc3NlcnRFeGNoYW5nZShcbiAgICAgICAgICAgICAgdGhpcy5fbmFtZSxcbiAgICAgICAgICAgICAgdGhpcy5fdHlwZSxcbiAgICAgICAgICAgICAgdGhpcy5fb3B0aW9ucyxcbiAgICAgICAgICAgICAgdGhpcy5hc3NlcnRFeGNoYW5nZShyZXNvbHZlLCByZWplY3QpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fY29ubmVjdGlvbi5hZGRFeGNoYW5nZSh0aGlzKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gZXJyb3JcbiAgICAgIGxvZy5lcnJvcihcbiAgICAgICAgYEZhaWxlZCB0byBjcmVhdGUgY2hhbm5lbCBmcm9tIHRoZSBjb25uZWN0aW9uOiAke2Vycm9yLm1lc3NhZ2V9YCxcbiAgICAgICAge1xuICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0RXhjaGFuZ2UoXG4gICAgcmVzb2x2ZTogKHZhbHVlOiBSZXN1bHQpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICByZXR1cm4gKGVycm9yOiBFcnJvciB8IHVuZGVmaW5lZCwgb2s6IEFtcXBMaWIuUmVwbGllcy5FbXB0eSkgPT4ge1xuICAgICAgaWYgKCFlcnJvcikge1xuICAgICAgICByZXNvbHZlKG9rIGFzIFJlc3VsdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZy5lcnJvcihgRmFpbGVkIHRvIGFzc2VydHxjaGVjayBleGNoYW5nZWAsIHtcbiAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fY29ubmVjdGlvbi5yZW1vdmVFeGNoYW5nZSh0aGlzLm5hbWUpO1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGUocmVzb2x2ZTogKCkgPT4gdm9pZCwgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkKSB7XG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRFeGNoYW5nZTtcbiAgICBhd2FpdCBCaW5kaW5nLlJlbW92ZUJpbmRpbmdzKHRoaXMpO1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbm5lbC5kZWxldGVFeGNoYW5nZSh0aGlzLl9uYW1lLCB7fSwgKGVyciwgb2spID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmludmFsaWRhdGUocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2xvc2UocmVzb2x2ZTogKCkgPT4gdm9pZCwgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkKSB7XG4gICAgYXdhaXQgdGhpcy5fcHJvbWlzZWRFeGNoYW5nZTtcbiAgICBhd2FpdCBCaW5kaW5nLlJlbW92ZUJpbmRpbmdzKHRoaXMpO1xuICAgIHRoaXMuaW52YWxpZGF0ZShyZXNvbHZlLCByZWplY3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbnZhbGlkYXRlKHJlc29sdmU6ICgpID0+IHZvaWQsIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCkge1xuICAgIGlmICghdGhpcy5fY2hhbm5lbCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIkNvcnJ1cHQgQ2hhbm5lbFwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbm5lbC5jbG9zZSgoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICBkZWxldGUgdGhpcy5fcHJvbWlzZWRFeGNoYW5nZTsgLy8gaW52YWxpZGF0ZSBwcm9taXNlXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLnJlbW92ZUV4Y2hhbmdlKHRoaXMuX25hbWUpO1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgdGhpcy5fY2hhbm5lbDtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2Nvbm5lY3Rpb247XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIl19