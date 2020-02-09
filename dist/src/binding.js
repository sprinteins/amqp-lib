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
const log_1 = __importDefault(require("./log"));
const queue_1 = require("./queue");
class Binding {
    constructor(origin, target, expression = "", args = {}) {
        this._origin = origin;
        this._target = target;
        this._expression = expression;
        this._args = args;
        this.connectBinding = this.connectBinding.bind(this);
        this._target.connection.addBinding(Binding.GenerateId(this._origin, this._target, this._expression), this);
        this.buildBinding();
    }
    static GenerateId(origin, target, expression) {
        const pattern = expression || "";
        return ("[" +
            origin.name +
            "]to" +
            (target instanceof queue_1.Queue ? "Queue" : "Exchange") +
            "[" +
            target.name +
            "]" +
            pattern);
    }
    static RemoveBindings(client) {
        const connection = client.connection;
        const allBindings = [];
        const bindings = connection.bindings;
        Object.keys(bindings).forEach((key) => {
            const binding = bindings[key];
            if (binding._origin === client || binding._target === client) {
                allBindings.push(binding.deleteBinding());
            }
        });
        return Promise.all(allBindings);
    }
    buildBinding() {
        this.promisedBinding = new Promise(this.connectBinding);
    }
    init() {
        return this.promisedBinding;
    }
    deleteBinding() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield this._target.init();
            if (this._target instanceof queue_1.Queue) {
                this.deleteQueueAsTarget(resolve, reject);
            }
            else {
                this.deleteExchangeAsTarget(resolve, reject);
            }
        }));
    }
    get origin() {
        return this._origin;
    }
    get target() {
        return this._target;
    }
    /**
     * Private methods
     */
    connectBinding(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._target.init();
            if (this._target instanceof queue_1.Queue) {
                this.processQueueAsTarget(resolve, reject);
            }
            else {
                this.processExchangeAsTarget(resolve, reject);
            }
        });
    }
    processQueueAsTarget(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const queue = this._target;
            queue.channel.bindQueue(queue.name, this._origin.name, this._expression, this._args, (error, ok) => {
                if (error) {
                    log_1.default.error(`Failed to create queue binding (${this._origin.name} -> ${queue.name})`, {
                        module: "amqp",
                    });
                    queue.connection.removeBinding(Binding.GenerateId(this._origin, this._target, this._expression));
                    reject(error);
                }
                else {
                    resolve(this);
                }
            });
        });
    }
    deleteQueueAsTarget(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const queue = this._target;
            queue.channel.unbindQueue(queue.name, this._origin.name, this._expression, this._args, (error, ok) => {
                if (error) {
                    log_1.default.error(`Failed to unbind queue binding (${this._origin.name} -> ${queue.name})`, {
                        module: "amqp",
                    });
                    reject(error);
                }
                else {
                    queue.connection.removeBinding(Binding.GenerateId(this._origin, this._target, this._expression));
                    resolve();
                }
            });
        });
    }
    processExchangeAsTarget(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const exchange = this._target;
            yield exchange.init();
            exchange.channel.bindExchange(exchange.name, this._origin.name, this._expression, this._args, (error, ok) => {
                if (error) {
                    log_1.default.error(`Failed to create exchange binding (${this._origin.name} -> ${exchange.name})`, {
                        module: "amqp",
                    });
                    exchange.connection.removeBinding(Binding.GenerateId(this._origin, this._target, this._expression));
                    reject(error);
                }
                else {
                    resolve(this);
                }
            });
        });
    }
    deleteExchangeAsTarget(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const exchange = this._target;
            yield exchange.init();
            exchange.channel.unbindExchange(exchange.name, this._origin.name, this._expression, this._args, (error, ok) => {
                if (error) {
                    log_1.default.error(`Failed to unbind exchange binding (${this._origin.name} -> ${exchange.name})`, {
                        module: "amqp",
                    });
                    reject(error);
                }
                else {
                    exchange.connection.removeBinding(Binding.GenerateId(this._origin, this._target, this._expression));
                    resolve();
                }
            });
        });
    }
}
exports.Binding = Binding;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5kaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLG1DQUFnQztBQUloQyxNQUFhLE9BQU87SUF3Q2xCLFlBQVksTUFBZ0IsRUFBRSxNQUFjLEVBQUUsVUFBVSxHQUFHLEVBQUUsRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUN0RSxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUVsQixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FDaEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUNoRSxJQUFJLENBQ0wsQ0FBQztRQUNGLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBcERNLE1BQU0sQ0FBQyxVQUFVLENBQ3RCLE1BQWMsRUFDZCxNQUFjLEVBQ2QsVUFBbUI7UUFFbkIsTUFBTSxPQUFPLEdBQUcsVUFBVSxJQUFJLEVBQUUsQ0FBQztRQUNqQyxPQUFPLENBQ0wsR0FBRztZQUNILE1BQU0sQ0FBQyxJQUFJO1lBQ1gsS0FBSztZQUNMLENBQUMsTUFBTSxZQUFZLGFBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7WUFDaEQsR0FBRztZQUNILE1BQU0sQ0FBQyxJQUFJO1lBQ1gsR0FBRztZQUNILE9BQU8s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QUMsSUFBSSxHQUFHLEVBQzlFO3dCQUNFLE1BQU0sRUFBRSxNQUFNO3FCQUNmLENBQ0YsQ0FBQztvQkFDRixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ2Y7cUJBQU07b0JBQ0wsUUFBUSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQy9CLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FDakUsQ0FBQztvQkFDRixPQUFPLEVBQUUsQ0FBQztpQkFDWDtZQUNILENBQUMsQ0FDRixDQUFDO1FBQ0osQ0FBQztLQUFBO0NBQ0Y7QUFsTkQsMEJBa05DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXhjaGFuZ2UgfSBmcm9tIFwiLi9leGNoYW5nZVwiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi9sb2dcIjtcbmltcG9ydCB7IFF1ZXVlIH0gZnJvbSBcIi4vcXVldWVcIjtcblxuZXhwb3J0IHR5cGUgQ2xpZW50ID0gRXhjaGFuZ2UgfCBRdWV1ZTtcblxuZXhwb3J0IGNsYXNzIEJpbmRpbmcge1xuICBwdWJsaWMgc3RhdGljIEdlbmVyYXRlSWQoXG4gICAgb3JpZ2luOiBDbGllbnQsXG4gICAgdGFyZ2V0OiBDbGllbnQsXG4gICAgZXhwcmVzc2lvbj86IHN0cmluZyxcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXR0ZXJuID0gZXhwcmVzc2lvbiB8fCBcIlwiO1xuICAgIHJldHVybiAoXG4gICAgICBcIltcIiArXG4gICAgICBvcmlnaW4ubmFtZSArXG4gICAgICBcIl10b1wiICtcbiAgICAgICh0YXJnZXQgaW5zdGFuY2VvZiBRdWV1ZSA/IFwiUXVldWVcIiA6IFwiRXhjaGFuZ2VcIikgK1xuICAgICAgXCJbXCIgK1xuICAgICAgdGFyZ2V0Lm5hbWUgK1xuICAgICAgXCJdXCIgK1xuICAgICAgcGF0dGVyblxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIFJlbW92ZUJpbmRpbmdzKGNsaWVudDogQ2xpZW50KSB7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IGNsaWVudC5jb25uZWN0aW9uO1xuICAgIGNvbnN0IGFsbEJpbmRpbmdzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcbiAgICBjb25zdCBiaW5kaW5ncyA9IGNvbm5lY3Rpb24uYmluZGluZ3M7XG4gICAgT2JqZWN0LmtleXMoYmluZGluZ3MpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBiaW5kaW5nOiBCaW5kaW5nID0gYmluZGluZ3Nba2V5XTtcbiAgICAgIGlmIChiaW5kaW5nLl9vcmlnaW4gPT09IGNsaWVudCB8fCBiaW5kaW5nLl90YXJnZXQgPT09IGNsaWVudCkge1xuICAgICAgICBhbGxCaW5kaW5ncy5wdXNoKGJpbmRpbmcuZGVsZXRlQmluZGluZygpKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChhbGxCaW5kaW5ncyk7XG4gIH1cblxuICBwcml2YXRlIF9vcmlnaW46IEV4Y2hhbmdlO1xuICBwcml2YXRlIF90YXJnZXQ6IENsaWVudDtcbiAgcHJpdmF0ZSBfZXhwcmVzc2lvbjogc3RyaW5nO1xuICBwcml2YXRlIF9hcmdzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xuXG4gIHByaXZhdGUgcHJvbWlzZWRCaW5kaW5nPzogUHJvbWlzZTxCaW5kaW5nPjtcblxuICBjb25zdHJ1Y3RvcihvcmlnaW46IEV4Y2hhbmdlLCB0YXJnZXQ6IENsaWVudCwgZXhwcmVzc2lvbiA9IFwiXCIsIGFyZ3MgPSB7fSkge1xuICAgIHRoaXMuX29yaWdpbiA9IG9yaWdpbjtcbiAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5fZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gICAgdGhpcy5fYXJncyA9IGFyZ3M7XG5cbiAgICB0aGlzLmNvbm5lY3RCaW5kaW5nID0gdGhpcy5jb25uZWN0QmluZGluZy5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5fdGFyZ2V0LmNvbm5lY3Rpb24uYWRkQmluZGluZyhcbiAgICAgIEJpbmRpbmcuR2VuZXJhdGVJZCh0aGlzLl9vcmlnaW4sIHRoaXMuX3RhcmdldCwgdGhpcy5fZXhwcmVzc2lvbiksXG4gICAgICB0aGlzLFxuICAgICk7XG4gICAgdGhpcy5idWlsZEJpbmRpbmcoKTtcbiAgfVxuXG4gIHB1YmxpYyBidWlsZEJpbmRpbmcoKSB7XG4gICAgdGhpcy5wcm9taXNlZEJpbmRpbmcgPSBuZXcgUHJvbWlzZTxCaW5kaW5nPih0aGlzLmNvbm5lY3RCaW5kaW5nKTtcbiAgfVxuXG4gIHB1YmxpYyBpbml0KCk6IFByb21pc2U8QmluZGluZz4gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnByb21pc2VkQmluZGluZztcbiAgfVxuXG4gIHB1YmxpYyBkZWxldGVCaW5kaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLl90YXJnZXQuaW5pdCgpO1xuICAgICAgaWYgKHRoaXMuX3RhcmdldCBpbnN0YW5jZW9mIFF1ZXVlKSB7XG4gICAgICAgIHRoaXMuZGVsZXRlUXVldWVBc1RhcmdldChyZXNvbHZlLCByZWplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZWxldGVFeGNoYW5nZUFzVGFyZ2V0KHJlc29sdmUsIHJlamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IG9yaWdpbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZ2luO1xuICB9XG5cbiAgcHVibGljIGdldCB0YXJnZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RhcmdldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcml2YXRlIG1ldGhvZHNcbiAgICovXG5cbiAgcHJpdmF0ZSBhc3luYyBjb25uZWN0QmluZGluZyhyZXNvbHZlOiAoYmluZGluZz86IEJpbmRpbmcpID0+IHZvaWQsIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCkge1xuICAgIGF3YWl0IHRoaXMuX3RhcmdldC5pbml0KCk7XG4gICAgaWYgKHRoaXMuX3RhcmdldCBpbnN0YW5jZW9mIFF1ZXVlKSB7XG4gICAgICB0aGlzLnByb2Nlc3NRdWV1ZUFzVGFyZ2V0KHJlc29sdmUsIHJlamVjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJvY2Vzc0V4Y2hhbmdlQXNUYXJnZXQocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHByb2Nlc3NRdWV1ZUFzVGFyZ2V0KFxuICAgIHJlc29sdmU6IChiaW5kaW5nPzogQmluZGluZykgPT4gdm9pZCxcbiAgICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQsXG4gICkge1xuICAgIGNvbnN0IHF1ZXVlID0gdGhpcy5fdGFyZ2V0O1xuICAgIHF1ZXVlLmNoYW5uZWwuYmluZFF1ZXVlKFxuICAgICAgcXVldWUubmFtZSxcbiAgICAgIHRoaXMuX29yaWdpbi5uYW1lLFxuICAgICAgdGhpcy5fZXhwcmVzc2lvbixcbiAgICAgIHRoaXMuX2FyZ3MsXG4gICAgICAoZXJyb3IsIG9rKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGxvZy5lcnJvcihcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIHF1ZXVlIGJpbmRpbmcgKCR7dGhpcy5fb3JpZ2luLm5hbWV9IC0+ICR7cXVldWUubmFtZX0pYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgICBxdWV1ZS5jb25uZWN0aW9uLnJlbW92ZUJpbmRpbmcoXG4gICAgICAgICAgICBCaW5kaW5nLkdlbmVyYXRlSWQodGhpcy5fb3JpZ2luLCB0aGlzLl90YXJnZXQsIHRoaXMuX2V4cHJlc3Npb24pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG4gIH1cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGVRdWV1ZUFzVGFyZ2V0KFxuICAgIHJlc29sdmU6ICgpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICBjb25zdCBxdWV1ZSA9IHRoaXMuX3RhcmdldDtcbiAgICBxdWV1ZS5jaGFubmVsLnVuYmluZFF1ZXVlKFxuICAgICAgcXVldWUubmFtZSxcbiAgICAgIHRoaXMuX29yaWdpbi5uYW1lLFxuICAgICAgdGhpcy5fZXhwcmVzc2lvbixcbiAgICAgIHRoaXMuX2FyZ3MsXG4gICAgICAoZXJyb3I6IEVycm9yLCBvazogYW55KSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGxvZy5lcnJvcihcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gdW5iaW5kIHF1ZXVlIGJpbmRpbmcgKCR7dGhpcy5fb3JpZ2luLm5hbWV9IC0+ICR7cXVldWUubmFtZX0pYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXVlLmNvbm5lY3Rpb24ucmVtb3ZlQmluZGluZyhcbiAgICAgICAgICAgIEJpbmRpbmcuR2VuZXJhdGVJZCh0aGlzLl9vcmlnaW4sIHRoaXMuX3RhcmdldCwgdGhpcy5fZXhwcmVzc2lvbiksXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc0V4Y2hhbmdlQXNUYXJnZXQoXG4gICAgcmVzb2x2ZTogKGJpbmRpbmc/OiBCaW5kaW5nKSA9PiB2b2lkLFxuICAgIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZCxcbiAgKSB7XG4gICAgY29uc3QgZXhjaGFuZ2UgPSB0aGlzLl90YXJnZXQ7XG4gICAgYXdhaXQgZXhjaGFuZ2UuaW5pdCgpO1xuICAgIGV4Y2hhbmdlLmNoYW5uZWwuYmluZEV4Y2hhbmdlKFxuICAgICAgZXhjaGFuZ2UubmFtZSxcbiAgICAgIHRoaXMuX29yaWdpbi5uYW1lLFxuICAgICAgdGhpcy5fZXhwcmVzc2lvbixcbiAgICAgIHRoaXMuX2FyZ3MsXG4gICAgICAoZXJyb3I6IEVycm9yLCBvazogYW55KSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGxvZy5lcnJvcihcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIGV4Y2hhbmdlIGJpbmRpbmcgKCR7dGhpcy5fb3JpZ2luLm5hbWV9IC0+ICR7ZXhjaGFuZ2UubmFtZX0pYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgICBleGNoYW5nZS5jb25uZWN0aW9uLnJlbW92ZUJpbmRpbmcoXG4gICAgICAgICAgICBCaW5kaW5nLkdlbmVyYXRlSWQodGhpcy5fb3JpZ2luLCB0aGlzLl90YXJnZXQsIHRoaXMuX2V4cHJlc3Npb24pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG4gIH1cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGVFeGNoYW5nZUFzVGFyZ2V0KFxuICAgIHJlc29sdmU6ICgpID0+IHZvaWQsXG4gICAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkLFxuICApIHtcbiAgICBjb25zdCBleGNoYW5nZSA9IHRoaXMuX3RhcmdldDtcbiAgICBhd2FpdCBleGNoYW5nZS5pbml0KCk7XG4gICAgZXhjaGFuZ2UuY2hhbm5lbC51bmJpbmRFeGNoYW5nZShcbiAgICAgIGV4Y2hhbmdlLm5hbWUsXG4gICAgICB0aGlzLl9vcmlnaW4ubmFtZSxcbiAgICAgIHRoaXMuX2V4cHJlc3Npb24sXG4gICAgICB0aGlzLl9hcmdzLFxuICAgICAgKGVycm9yOiBFcnJvciwgb2s6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBsb2cuZXJyb3IoXG4gICAgICAgICAgICBgRmFpbGVkIHRvIHVuYmluZCBleGNoYW5nZSBiaW5kaW5nICgke3RoaXMuX29yaWdpbi5uYW1lfSAtPiAke2V4Y2hhbmdlLm5hbWV9KWAsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleGNoYW5nZS5jb25uZWN0aW9uLnJlbW92ZUJpbmRpbmcoXG4gICAgICAgICAgICBCaW5kaW5nLkdlbmVyYXRlSWQodGhpcy5fb3JpZ2luLCB0aGlzLl90YXJnZXQsIHRoaXMuX2V4cHJlc3Npb24pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cbiJdfQ==