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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tZXNzYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBRUEsZ0RBQXdCO0FBQ3hCLG1DQUFnQztBQUVoQyxJQUFLLFdBR0o7QUFIRCxXQUFLLFdBQVc7SUFDWix1Q0FBd0IsQ0FBQTtJQUN4QixzQ0FBdUIsQ0FBQTtBQUMzQixDQUFDLEVBSEksV0FBVyxLQUFYLFdBQVcsUUFHZjtBQXlCRCxNQUFhLE9BQU87SUFRaEIsWUFBWSxPQUF3QixFQUFFLE9BQTBCO1FBQzVELElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFTSxVQUFVO1FBQ2IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN0QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxLQUFLLGtCQUFrQixFQUFFO1lBQ3BELE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVNLGFBQWE7UUFDaEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQzNCLENBQUM7SUFDTSxpQkFBaUIsQ0FBQyxPQUF3QjtRQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUM1QixDQUFDO0lBRU0sVUFBVSxDQUFDLE9BQXdCO1FBQ3RDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO0lBQzVCLENBQUM7SUFFTSxTQUFTLENBQUMsTUFBNkI7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVNLFVBQVUsQ0FBQyxPQUF5QjtRQUN2QyxJQUFJLENBQUMs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cUJBQU07b0JBQ0gsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQ1osVUFBVSxFQUNWLElBQUksQ0FBQyxVQUFVLENBQ2xCLENBQUM7aUJBQ0w7YUFDSjtRQUNMLENBQUM7S0FBQTtJQUVPLGdCQUFnQixDQUFDLE9BQXdCO1FBQzdDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQzdCLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDOUI7YUFBTSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksTUFBTSxDQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXO2dCQUN2QixrQkFBa0IsQ0FBQztZQUN2QixPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0gsT0FBTyxPQUFPLENBQUM7U0FDbEI7SUFDTCxDQUFDO0NBQ0o7QUE5SUQsMEJBOElDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQW1xcExpYiBmcm9tIFwiYW1xcGxpYi9jYWxsYmFja19hcGlcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuL2JpbmRpbmdcIjtcbmltcG9ydCBsb2cgZnJvbSBcIi4vbG9nXCI7XG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gXCIuL3F1ZXVlXCI7XG5cbmVudW0gTWVzc2FnZVR5cGUge1xuICAgIEVudGl0eU1lc3NhZ2UgPSBcImVudGl0eVwiLFxuICAgIEFjdGlvbk1lc3NhZ2UgPSBcImV2ZW50XCIsXG59XG5cbmV4cG9ydCB0eXBlIEV4dGVybmFsQ29udGVudCA9IEJ1ZmZlciB8IHN0cmluZyB8IEpTT04gfCB7fTtcblxuZXhwb3J0IGludGVyZmFjZSBNZXNzYWdlUHJvcGVydGllcyB7XG4gICAgY29udGVudFR5cGU/OiBzdHJpbmc7XG4gICAgY29udGVudEVuY29kaW5nPzogc3RyaW5nO1xuICAgIGhlYWRlcnM/OiBBbXFwTGliLk1lc3NhZ2VQcm9wZXJ0eUhlYWRlcnM7XG4gICAgZGVsaXZlcnlNb2RlPzogYm9vbGVhbiB8IG51bWJlcjtcbiAgICBwcmlvcml0eT86IG51bWJlcjtcbiAgICBjb3JyZWxhdGlvbklkPzogc3RyaW5nO1xuICAgIHJlcGx5VG8/OiBzdHJpbmc7XG4gICAgZXhwaXJhdGlvbj86IHN0cmluZztcbiAgICBtZXNzYWdlSWQ/OiBzdHJpbmc7XG4gICAgdGltZXN0YW1wPzogbnVtYmVyO1xuICAgIHR5cGU/OiBNZXNzYWdlVHlwZTtcbiAgICB1c2VySWQ/OiBzdHJpbmc7XG4gICAgYXBwSWQ/OiBzdHJpbmc7XG4gICAgY2x1c3RlcklkPzogc3RyaW5nO1xuICAgIENDPzogc3RyaW5nIHwgc3RyaW5nW107XG4gICAgbWFuZGF0b3J5PzogYm9vbGVhbjtcbiAgICBwZXJzaXN0ZW50PzogYm9vbGVhbjtcbiAgICBCQ0M/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2Uge1xuICAgIHByaXZhdGUgY29udGVudDogQnVmZmVyO1xuICAgIHByaXZhdGUgcHJvcGVydGllczogTWVzc2FnZVByb3BlcnRpZXM7XG5cbiAgICBwcml2YXRlIF9maWVsZHM/OiBBbXFwTGliLk1lc3NhZ2VGaWVsZHM7XG4gICAgcHJpdmF0ZSBfY2hhbm5lbD86IEFtcXBMaWIuQ2hhbm5lbDtcbiAgICBwcml2YXRlIF9tZXNzYWdlPzogQW1xcExpYi5NZXNzYWdlO1xuXG4gICAgY29uc3RydWN0b3IoY29udGVudDogRXh0ZXJuYWxDb250ZW50LCBvcHRpb25zOiBNZXNzYWdlUHJvcGVydGllcykge1xuICAgICAgICB0aGlzLnByb3BlcnRpZXMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmNvbnRlbnQgPSB0aGlzLnNldEJ1ZmZlckNvbnRlbnQoY29udGVudCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldENvbnRlbnQoKTogRXh0ZXJuYWxDb250ZW50IHtcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0aGlzLmNvbnRlbnQudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHRoaXMucHJvcGVydGllcy5jb250ZW50VHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9qc29uXCIpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcm9wZXJ0aWVzKCk6IE1lc3NhZ2VQcm9wZXJ0aWVzIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvcGVydGllcztcbiAgICB9XG4gICAgcHVibGljIHNldE1lc3NhZ2VDaGFubmVsKGNoYW5uZWw6IEFtcXBMaWIuQ2hhbm5lbCkge1xuICAgICAgICB0aGlzLl9jaGFubmVsID0gY2hhbm5lbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0TWVzc2FnZShtZXNzYWdlOiBBbXFwTGliLk1lc3NhZ2UpIHtcbiAgICAgICAgdGhpcy5fbWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEZpZWxkcyhmaWVsZHM6IEFtcXBMaWIuTWVzc2FnZUZpZWxkcykge1xuICAgICAgICB0aGlzLl9maWVsZHMgPSBmaWVsZHM7XG4gICAgfVxuXG4gICAgcHVibGljIHNldENoYW5uZWwoY2hhbm5lbD86IEFtcXBMaWIuQ2hhbm5lbCkge1xuICAgICAgICB0aGlzLl9jaGFubmVsID0gY2hhbm5lbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWNrKGFsbD86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuX2NoYW5uZWwgJiYgdGhpcy5fbWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5fY2hhbm5lbC5hY2sodGhpcy5fbWVzc2FnZSwgYWxsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNoYW5uZWwgb3IgbWVzc2FnZSB1bmRlZmluZWRcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVqZWN0KHJlcXVldWU6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICBpZiAodGhpcy5fY2hhbm5lbCAmJiB0aGlzLl9tZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGFubmVsLnJlamVjdCh0aGlzLl9tZXNzYWdlLCByZXF1ZXVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNoYW5uZWwgb3IgbWVzc2FnZSB1bmRlZmluZWRcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgbmFjayhhbGw/OiBib29sZWFuLCByZXF1ZXVlPzogYm9vbGVhbikge1xuICAgICAgICBpZiAodGhpcy5fY2hhbm5lbCAmJiB0aGlzLl9tZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGFubmVsLm5hY2sodGhpcy5fbWVzc2FnZSwgYWxsLCByZXF1ZXVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNoYW5uZWwgb3IgbWVzc2FnZSB1bmRlZmluZWRcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc2VuZCh0YXJnZXQ6IENsaWVudCwgcm91dGluZ0tleTogc3RyaW5nID0gXCJcIik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgZXhjaGFuZ2UgPSBcIlwiO1xuICAgICAgICBsZXQga2V5ID0gcm91dGluZ0tleTtcblxuICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgUXVldWUpIHtcbiAgICAgICAgICAgIGtleSA9IHRhcmdldC5uYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhjaGFuZ2UgPSB0YXJnZXQubmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRhcmdldC5pbml0KCk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2VuZE1lc3NhZ2UodGFyZ2V0LCBrZXksIGV4Y2hhbmdlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGZpZWxkcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpZWxkcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcml2YXRlIG1ldGhvZHNcbiAgICAgKi9cblxuICAgIHByaXZhdGUgYXN5bmMgc2VuZE1lc3NhZ2UoXG4gICAgICAgIHRhcmdldDogQ2xpZW50LFxuICAgICAgICByb3V0aW5nS2V5OiBzdHJpbmcsXG4gICAgICAgIGV4Y2hhbmdlOiBzdHJpbmcsXG4gICAgKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXJnZXQuY2hhbm5lbC5wdWJsaXNoKFxuICAgICAgICAgICAgICAgIGV4Y2hhbmdlLFxuICAgICAgICAgICAgICAgIHJvdXRpbmdLZXksXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZW50LFxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBsb2cuZGVidWcoYFNlbmQgbWVzc2FnZSB0byBicm9rZXIgZXJyb3IgJHtlcnJvci5tZXNzYWdlfWAsIHtcbiAgICAgICAgICAgICAgICBtb2R1bGU6IFwiYW1xcFwiLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXROYW1lID0gdGFyZ2V0Lm5hbWU7XG4gICAgICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gdGFyZ2V0LmNvbm5lY3Rpb247XG4gICAgICAgICAgICBsb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgYFNlbmQgbWVzc2FnZSB0byBicm9rZXIgZXJyb3IsIHJlQ3JlYXRlVG9wb2xvZ3kgcmVjb25uZWN0YCxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24ucmVDcmVhdGVXaXRoVG9wb2xvZ3koZXJyb3IpO1xuICAgICAgICAgICAgbG9nLmRlYnVnKGBSZXRyeWluZyB0byBzZW5kIG1lc3NhZ2VgLCB7XG4gICAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgUXVldWUpIHtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLnF1ZXVlc1t0YXJnZXROYW1lXS5wdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmV4Y2hhbmdlc1t0YXJnZXROYW1lXS5wdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRlbnQsXG4gICAgICAgICAgICAgICAgICAgIHJvdXRpbmdLZXksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRCdWZmZXJDb250ZW50KGNvbnRlbnQ6IEV4dGVybmFsQ29udGVudCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnVmZmVyKGNvbnRlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKCEoY29udGVudCBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5jb250ZW50VHlwZSA9XG4gICAgICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcihKU09OLnN0cmluZ2lmeShjb250ZW50KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==