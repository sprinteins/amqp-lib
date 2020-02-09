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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tZXNzYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBRUEsZ0RBQXdCO0FBQ3hCLG1DQUFnQztBQXlCaEMsTUFBYSxPQUFPO0lBUWhCLFlBQVksT0FBd0IsRUFBRSxPQUFtQjtRQUNyRCxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRU0sVUFBVTtRQUNiLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsS0FBSyxrQkFBa0IsRUFBRTtZQUNwRCxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNqQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFFTSxhQUFhO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUMzQixDQUFDO0lBQ00saUJBQWlCLENBQUMsT0FBd0I7UUFDN0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFDNUIsQ0FBQztJQUVNLFVBQVUsQ0FBQyxPQUF3QjtRQUN0QyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUM1QixDQUFDO0lBRU0sU0FBUyxDQUFDLE1BQTZCO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0lBQzFCLENBQUM7SUFFTSxVQUFVLENBQUMsT0FBeUI7UUFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFDNUIsQ0FBQztJQUVNLEdBQUcsQ0FBQyxHQUFhO1FBQ3BCLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxF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VUFBVSxDQUNsQixDQUFDO2lCQUNMO2FBQ0o7UUFDTCxDQUFDO0tBQUE7SUFFTyxnQkFBZ0IsQ0FBQyxPQUF3QjtRQUM3QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUM3QixPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzlCO2FBQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxZQUFZLE1BQU0sQ0FBQyxFQUFFO1lBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVztnQkFDdkIsa0JBQWtCLENBQUM7WUFDdkIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDOUM7YUFBTTtZQUNILE9BQU8sT0FBTyxDQUFDO1NBQ2xCO0lBQ0wsQ0FBQztDQUNKO0FBOUlELDBCQThJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEFtcXBMaWIgZnJvbSBcImFtcXBsaWIvY2FsbGJhY2tfYXBpXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi9iaW5kaW5nXCI7XG5pbXBvcnQgbG9nIGZyb20gXCIuL2xvZ1wiO1xuaW1wb3J0IHsgUXVldWUgfSBmcm9tIFwiLi9xdWV1ZVwiO1xuXG5leHBvcnQgdHlwZSBFeHRlcm5hbENvbnRlbnQgPSBCdWZmZXIgfCBzdHJpbmcgfCBKU09OIHwge307XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydGllcyB7XG4gICAgY29udGVudFR5cGU/OiBzdHJpbmc7XG4gICAgY29udGVudEVuY29kaW5nPzogc3RyaW5nO1xuICAgIGhlYWRlcnM/OiBBbXFwTGliLk1lc3NhZ2VQcm9wZXJ0eUhlYWRlcnM7XG4gICAgZGVsaXZlcnlNb2RlPzogYm9vbGVhbiB8IG51bWJlcjtcbiAgICBwcmlvcml0eT86IG51bWJlcjtcbiAgICBjb3JyZWxhdGlvbklkPzogc3RyaW5nO1xuICAgIHJlcGx5VG8/OiBzdHJpbmc7XG4gICAgZXhwaXJhdGlvbj86IHN0cmluZztcbiAgICBtZXNzYWdlSWQ/OiBzdHJpbmc7XG4gICAgdGltZXN0YW1wPzogbnVtYmVyO1xuICAgIHR5cGU/OiBzdHJpbmc7XG4gICAgdXNlcklkPzogc3RyaW5nO1xuICAgIGFwcElkPzogc3RyaW5nO1xuICAgIGNsdXN0ZXJJZD86IHN0cmluZztcbiAgICBDQz86IHN0cmluZyB8IHN0cmluZ1tdO1xuICAgIG1hbmRhdG9yeT86IGJvb2xlYW47XG4gICAgcGVyc2lzdGVudD86IGJvb2xlYW47XG4gICAgQkNDPzogc3RyaW5nIHwgc3RyaW5nW107XG59XG5cbmV4cG9ydCBjbGFzcyBNZXNzYWdlIHtcbiAgICBwcml2YXRlIGNvbnRlbnQ6IEJ1ZmZlcjtcbiAgICBwcml2YXRlIHByb3BlcnRpZXM6IFByb3BlcnRpZXM7XG5cbiAgICBwcml2YXRlIF9maWVsZHM/OiBBbXFwTGliLk1lc3NhZ2VGaWVsZHM7XG4gICAgcHJpdmF0ZSBfY2hhbm5lbD86IEFtcXBMaWIuQ2hhbm5lbDtcbiAgICBwcml2YXRlIF9tZXNzYWdlPzogQW1xcExpYi5NZXNzYWdlO1xuXG4gICAgY29uc3RydWN0b3IoY29udGVudDogRXh0ZXJuYWxDb250ZW50LCBvcHRpb25zOiBQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHRoaXMucHJvcGVydGllcyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuY29udGVudCA9IHRoaXMuc2V0QnVmZmVyQ29udGVudChjb250ZW50KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Q29udGVudCgpOiBFeHRlcm5hbENvbnRlbnQge1xuICAgICAgICBsZXQgY29udGVudCA9IHRoaXMuY29udGVudC50b1N0cmluZygpO1xuICAgICAgICBpZiAodGhpcy5wcm9wZXJ0aWVzLmNvbnRlbnRUeXBlID09PSBcImFwcGxpY2F0aW9uL2pzb25cIikge1xuICAgICAgICAgICAgY29udGVudCA9IEpTT04ucGFyc2UoY29udGVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb3BlcnRpZXMoKTogUHJvcGVydGllcyB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XG4gICAgfVxuICAgIHB1YmxpYyBzZXRNZXNzYWdlQ2hhbm5lbChjaGFubmVsOiBBbXFwTGliLkNoYW5uZWwpIHtcbiAgICAgICAgdGhpcy5fY2hhbm5lbCA9IGNoYW5uZWw7XG4gICAgfVxuXG4gICAgcHVibGljIHNldE1lc3NhZ2UobWVzc2FnZTogQW1xcExpYi5NZXNzYWdlKSB7XG4gICAgICAgIHRoaXMuX21lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRGaWVsZHMoZmllbGRzOiBBbXFwTGliLk1lc3NhZ2VGaWVsZHMpIHtcbiAgICAgICAgdGhpcy5fZmllbGRzID0gZmllbGRzO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRDaGFubmVsKGNoYW5uZWw/OiBBbXFwTGliLkNoYW5uZWwpIHtcbiAgICAgICAgdGhpcy5fY2hhbm5lbCA9IGNoYW5uZWw7XG4gICAgfVxuXG4gICAgcHVibGljIGFjayhhbGw/OiBib29sZWFuKSB7XG4gICAgICAgIGlmICh0aGlzLl9jaGFubmVsICYmIHRoaXMuX21lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX2NoYW5uZWwuYWNrKHRoaXMuX21lc3NhZ2UsIGFsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDaGFubmVsIG9yIG1lc3NhZ2UgdW5kZWZpbmVkXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlamVjdChyZXF1ZXVlOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NoYW5uZWwgJiYgdGhpcy5fbWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5fY2hhbm5lbC5yZWplY3QodGhpcy5fbWVzc2FnZSwgcmVxdWV1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDaGFubmVsIG9yIG1lc3NhZ2UgdW5kZWZpbmVkXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG5hY2soYWxsPzogYm9vbGVhbiwgcmVxdWV1ZT86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuX2NoYW5uZWwgJiYgdGhpcy5fbWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5fY2hhbm5lbC5uYWNrKHRoaXMuX21lc3NhZ2UsIGFsbCwgcmVxdWV1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDaGFubmVsIG9yIG1lc3NhZ2UgdW5kZWZpbmVkXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHNlbmQodGFyZ2V0OiBDbGllbnQsIHJvdXRpbmdLZXk6IHN0cmluZyA9IFwiXCIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0IGV4Y2hhbmdlID0gXCJcIjtcbiAgICAgICAgbGV0IGtleSA9IHJvdXRpbmdLZXk7XG5cbiAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFF1ZXVlKSB7XG4gICAgICAgICAgICBrZXkgPSB0YXJnZXQubmFtZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4Y2hhbmdlID0gdGFyZ2V0Lm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB0YXJnZXQuaW5pdCgpO1xuICAgICAgICBhd2FpdCB0aGlzLnNlbmRNZXNzYWdlKHRhcmdldCwga2V5LCBleGNoYW5nZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBmaWVsZHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWVsZHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJpdmF0ZSBtZXRob2RzXG4gICAgICovXG5cbiAgICBwcml2YXRlIGFzeW5jIHNlbmRNZXNzYWdlKFxuICAgICAgICB0YXJnZXQ6IENsaWVudCxcbiAgICAgICAgcm91dGluZ0tleTogc3RyaW5nLFxuICAgICAgICBleGNoYW5nZTogc3RyaW5nLFxuICAgICkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFyZ2V0LmNoYW5uZWwucHVibGlzaChcbiAgICAgICAgICAgICAgICBleGNoYW5nZSxcbiAgICAgICAgICAgICAgICByb3V0aW5nS2V5LFxuICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCxcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMsXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgbG9nLmRlYnVnKGBTZW5kIG1lc3NhZ2UgdG8gYnJva2VyIGVycm9yICR7ZXJyb3IubWVzc2FnZX1gLCB7XG4gICAgICAgICAgICAgICAgbW9kdWxlOiBcImFtcXBcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0TmFtZSA9IHRhcmdldC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IHRhcmdldC5jb25uZWN0aW9uO1xuICAgICAgICAgICAgbG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgIGBTZW5kIG1lc3NhZ2UgdG8gYnJva2VyIGVycm9yLCByZUNyZWF0ZVRvcG9sb2d5IHJlY29ubmVjdGAsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBtb2R1bGU6IFwiYW1xcFwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLnJlQ3JlYXRlV2l0aFRvcG9sb2d5KGVycm9yKTtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhgUmV0cnlpbmcgdG8gc2VuZCBtZXNzYWdlYCwge1xuICAgICAgICAgICAgICAgIG1vZHVsZTogXCJhbXFwXCIsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5xdWV1ZXNbdGFyZ2V0TmFtZV0ucHVibGlzaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5leGNoYW5nZXNbdGFyZ2V0TmFtZV0ucHVibGlzaChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICByb3V0aW5nS2V5LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0QnVmZmVyQ29udGVudChjb250ZW50OiBFeHRlcm5hbENvbnRlbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb250ZW50ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcihjb250ZW50KTtcbiAgICAgICAgfSBlbHNlIGlmICghKGNvbnRlbnQgaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMuY29udGVudFR5cGUgPVxuICAgICAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXIoSlNPTi5zdHJpbmdpZnkoY29udGVudCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=