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
var MessageType;
(function (MessageType) {
    MessageType["EntityMessage"] = "entity";
    MessageType["ActionMessage"] = "event";
})(MessageType || (MessageType = {}));
class Message {
    constructor(content, options) {
        this.properties = options;
        this.content = this.setBufferContent(content);
    }
    getContent() {
        let content = this.content.toString();
        if (this.properties.contentType === "application/json") {
            content = JSON.parse(content);
        }
        return content;
    }
    getProperties() {
        return this.properties;
    }
    setMessageChannel(channel) {
        this._channel = channel;
    }
    setMessage(message) {
        this._message = message;
    }
    setFields(fields) {
        this._fields = fields;
    }
    setChannel(channel) {
        this._channel = channel;
    }
    ack(all) {
        if (this._channel && this._message) {
            this._channel.ack(this._message, all);
        }
        else {
            throw new Error("Channel or message undefined");
        }
    }
    reject(requeue = false) {
        if (this._channel && this._message) {
            this._channel.reject(this._message, requeue);
        }
        else {
            throw new Error("Channel or message undefined");
        }
    }
    nack(all, requeue) {
        if (this._channel && this._message) {
            this._channel.nack(this._message, all, requeue);
        }
        else {
            throw new Error("Channel or message undefined");
        }
    }
    send(target, routingKey = "") {
        return __awaiter(this, void 0, void 0, function* () {
            let exchange = "";
            let key = routingKey;
            if (target instanceof queue_1.Queue) {
                key = target.name;
            }
            else {
                exchange = target.name;
            }
            yield target.init();
            yield this.sendMessage(target, key, exchange);
        });
    }
    get fields() {
        return this._fields;
    }
    /**
     * Private methods
     */
    sendMessage(target, routingKey, exchange) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                target.channel.publish(exchange, routingKey, this.content, this.properties);
            }
            catch (error) {
                log_1.default.debug(`Send message to broker error ${error.message}`, {
                    module: "amqp",
                });
                const targetName = target.name;
                const connection = target.connection;
                log_1.default.debug(`Send message to broker error, reCreateTopology reconnect`, {
                    module: "amqp",
                });
                yield connection.reCreateWithTopology(error);
                log_1.default.debug(`Retrying to send message`, {
                    module: "amqp",
                });
                if (target instanceof queue_1.Queue) {
                    connection.queues[targetName].publish(this.content, this.properties);
                }
                else {
                    connection.exchanges[targetName].publish(this.content, routingKey, this.properties);
                }
            }
        });
    }
    setBufferContent(content) {
        if (typeof content === "string") {
            return new Buffer(content);
        }
        else if (!(content instanceof Buffer)) {
            this.properties.contentType =
                "application/json";
            return new Buffer(JSON.stringify(content));
        }
        else {
            return content;
        }
    }
}
exports.Message = Message;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tZXNzYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBRUEsZ0RBQXdCO0FBQ3hCLG1DQUFnQztBQUVoQyxJQUFLLFdBR0o7QUFIRCxXQUFLLFdBQVc7SUFDWix1Q0FBd0IsQ0FBQTtJQUN4QixzQ0FBdUIsQ0FBQTtBQUMzQixDQUFDLEVBSEksV0FBVyxLQUFYLFdBQVcsUUFHZjtBQXlCRCxNQUFhLE9BQU87SUFRaEIsWUFBWSxPQUF3QixFQUFFLE9BQW1CO1FBQ3JELElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFTSxVQUFVO1FBQ2IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxLQUFLLGtCQUFrQixFQUFFO1lBQ3BELE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVNLGFBQWE7UUFDaEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQzNCLENBQUM7SUFDTSxpQkFBaUIsQ0FBQyxPQUF3QjtRQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUM1QixDQUFDO0lBRU0sVUFBVSxDQUFDLE9BQXdCO1FBQ3RDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO0lBQzVCLENBQUM7SUFFTSxTQUFTLENBQUMsTUFBNkI7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVNLFVBQVUsQ0FBQyxPQUF5QjtRQUN2QyxJQUFJLENBQUMs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cUJBQU07b0JBQ0gsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQ1osVUFBVSxFQUNWLElBQUksQ0FBQyxVQUFVLENBQ2xCLENBQUM7aUJBQ0w7YUFDSjtRQUNMLENBQUM7S0FBQTtJQUVPLGdCQUFnQixDQUFDLE9BQXdCO1FBQzdDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQzdCLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDOUI7YUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksTUFBTSxDQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXO2dCQUN2QixrQkFBa0IsQ0FBQztZQUN2QixPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0gsT0FBTyxPQUFPLENBQUM7U0FDbEI7SUFDTCxDQUFDO0NBQ0o7QUE5SUQsMEJBOElDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQW1xcExpYiBmcm9tIFwiYW1xcGxpYi9jYWxsYmFja19hcGlcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuL2JpbmRpbmdcIjtcbmltcG9ydCBsb2cgZnJvbSBcIi4vbG9nXCI7XG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gXCIuL3F1ZXVlXCI7XG5cbmVudW0gTWVzc2FnZVR5cGUge1xuICAgIEVudGl0eU1lc3NhZ2UgPSBcImVudGl0eVwiLFxuICAgIEFjdGlvbk1lc3NhZ2UgPSBcImV2ZW50XCIsXG59XG5cbmV4cG9ydCB0eXBlIEV4dGVybmFsQ29udGVudCA9IEJ1ZmZlciB8IHN0cmluZyB8IEpTT04gfCB7fTtcblxuZXhwb3J0IGludGVyZmFjZSBQcm9wZXJ0aWVzIHtcbiAgICBjb250ZW50VHlwZT86IHN0cmluZztcbiAgICBjb250ZW50RW5jb2Rpbmc/OiBzdHJpbmc7XG4gICAgaGVhZGVycz86IEFtcXBMaWIuTWVzc2FnZVByb3BlcnR5SGVhZGVycztcbiAgICBkZWxpdmVyeU1vZGU/OiBib29sZWFuIHwgbnVtYmVyO1xuICAgIHByaW9yaXR5PzogbnVtYmVyO1xuICAgIGNvcnJlbGF0aW9uSWQ/OiBzdHJpbmc7XG4gICAgcmVwbHlUbz86IHN0cmluZztcbiAgICBleHBpcmF0aW9uPzogc3RyaW5nO1xuICAgIG1lc3NhZ2VJZD86IHN0cmluZztcbiAgICB0aW1lc3RhbXA/OiBudW1iZXI7XG4gICAgdHlwZT86IE1lc3NhZ2VUeXBlO1xuICAgIHVzZXJJZD86IHN0cmluZztcbiAgICBhcHBJZD86IHN0cmluZztcbiAgICBjbHVzdGVySWQ/OiBzdHJpbmc7XG4gICAgQ0M/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbiAgICBtYW5kYXRvcnk/OiBib29sZWFuO1xuICAgIHBlcnNpc3RlbnQ/OiBib29sZWFuO1xuICAgIEJDQz86IHN0cmluZyB8IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgY2xhc3MgTWVzc2FnZSB7XG4gICAgcHJpdmF0ZSBjb250ZW50OiBCdWZmZXI7XG4gICAgcHJpdmF0ZSBwcm9wZXJ0aWVzOiBQcm9wZXJ0aWVzO1xuXG4gICAgcHJpdmF0ZSBfZmllbGRzPzogQW1xcExpYi5NZXNzYWdlRmllbGRzO1xuICAgIHByaXZhdGUgX2NoYW5uZWw/OiBBbXFwTGliLkNoYW5uZWw7XG4gICAgcHJpdmF0ZSBfbWVzc2FnZT86IEFtcXBMaWIuTWVzc2FnZTtcblxuICAgIGNvbnN0cnVjdG9yKGNvbnRlbnQ6IEV4dGVybmFsQ29udGVudCwgb3B0aW9uczogUHJvcGVydGllcykge1xuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLnNldEJ1ZmZlckNvbnRlbnQoY29udGVudCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldENvbnRlbnQoKTogRXh0ZXJuYWxDb250ZW50IHtcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLmNvbnRlbnQudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5jb250ZW50VHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IFByb3BlcnRpZXMge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9wZXJ0aWVzO1xuICAgIH1cbiAgICBwdWJsaWMgc2V0TWVzc2FnZUNoYW5uZWwoY2hhbm5lbDogQW1xcExpYi5DaGFubmVsKSB7XG4gICAgICAgIHRoaXMuX2NoYW5uZWwgPSBjaGFubmVsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRNZXNzYWdlKG1lc3NhZ2U6IEFtcXBMaWIuTWVzc2FnZSkge1xuICAgICAgICB0aGlzLl9tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0RmllbGRzKGZpZWxkczogQW1xcExpYi5NZXNzYWdlRmllbGRzKSB7XG4gICAgICAgIHRoaXMuX2ZpZWxkcyA9IGZpZWxkcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Q2hhbm5lbChjaGFubmVsPzogQW1xcExpYi5DaGFubmVsKSB7XG4gICAgICAgIHRoaXMuX2NoYW5uZWwgPSBjaGFubmVsO1xuICAgIH1cblxuICAgIHB1YmxpYyBhY2soYWxsPzogYm9vbGVhbikge1xuICAgICAgICBpZiAodGhpcy5fY2hhbm5lbCAmJiB0aGlzLl9tZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGFubmVsLmFjayh0aGlzLl9tZXNzYWdlLCBhbGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2hhbm5lbCBvciBtZXNzYWdlIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZWplY3QocmVxdWV1ZTogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGFubmVsICYmIHRoaXMuX21lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX2NoYW5uZWwucmVqZWN0KHRoaXMuX21lc3NhZ2UsIHJlcXVldWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2hhbm5lbCBvciBtZXNzYWdlIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBuYWNrKGFsbD86IGJvb2xlYW4sIHJlcXVldWU/OiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGFubmVsICYmIHRoaXMuX21lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX2NoYW5uZWwubmFjayh0aGlzLl9tZXNzYWdlLCBhbGwsIHJlcXVldWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2hhbm5lbCBvciBtZXNzYWdlIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBzZW5kKHRhcmdldDogQ2xpZW50LCByb3V0aW5nS2V5OiBzdHJpbmcgPSBcIlwiKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCBleGNoYW5nZSA9IFwiXCI7XG4gICAgICAgIGxldCBrZXkgPSByb3V0aW5nS2V5O1xuXG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBRdWV1ZSkge1xuICAgICAgICAgICAga2V5ID0gdGFyZ2V0Lm5hbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleGNoYW5nZSA9IHRhcmdldC5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGFyZ2V0LmluaXQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZW5kTWVzc2FnZSh0YXJnZXQsIGtleSwgZXhjaGFuZ2UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgZmllbGRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmllbGRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByaXZhdGUgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgcHJpdmF0ZSBhc3luYyBzZW5kTWVzc2FnZShcbiAgICAgICAgdGFyZ2V0OiBDbGllbnQsXG4gICAgICAgIHJvdXRpbmdLZXk6IHN0cmluZyxcbiAgICAgICAgZXhjaGFuZ2U6IHN0cmluZyxcbiAgICApIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhcmdldC5jaGFubmVsLnB1Ymxpc2goXG4gICAgICAgICAgICAgICAgZXhjaGFuZ2UsXG4gICAgICAgICAgICAgICAgcm91dGluZ0tleSxcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhgU2VuZCBtZXNzYWdlIHRvIGJyb2tlciBlcnJvciAke2Vycm9yLm1lc3NhZ2V9YCwge1xuICAgICAgICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE5hbWUgPSB0YXJnZXQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSB0YXJnZXQuY29ubmVjdGlvbjtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICBgU2VuZCBtZXNzYWdlIHRvIGJyb2tlciBlcnJvciwgcmVDcmVhdGVUb3BvbG9neSByZWNvbm5lY3RgLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5yZUNyZWF0ZVdpdGhUb3BvbG9neShlcnJvcik7XG4gICAgICAgICAgICBsb2cuZGVidWcoYFJldHJ5aW5nIHRvIHNlbmQgbWVzc2FnZWAsIHtcbiAgICAgICAgICAgICAgICBtb2R1bGU6IFwiYW1xcFwiLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24ucXVldWVzW3RhcmdldE5hbWVdLnB1Ymxpc2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZXhjaGFuZ2VzW3RhcmdldE5hbWVdLnB1Ymxpc2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCxcbiAgICAgICAgICAgICAgICAgICAgcm91dGluZ0tleSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldEJ1ZmZlckNvbnRlbnQoY29udGVudDogRXh0ZXJuYWxDb250ZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29udGVudCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIoY29udGVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIShjb250ZW50IGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmNvbnRlbnRUeXBlID1cbiAgICAgICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKEpTT04uc3RyaW5naWZ5KGNvbnRlbnQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICB9XG4gICAgfVxufVxuIl19