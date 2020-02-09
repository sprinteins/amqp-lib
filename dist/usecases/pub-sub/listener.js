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
const src_1 = require("../../src/");
const log_1 = __importDefault(require("../../src/log"));
const config_1 = __importDefault(require("../config"));
exports.listener = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = new src_1.Connection(config_1.default.messagebrokerurl);
        const exhcange = connection.registerExchange("exchange", "fanout", {
            durable: false,
        });
        const queue = connection.registerQueue("someQueue", {
            durable: false,
        });
        yield queue.bind(exhcange);
        const callback = (message) => __awaiter(void 0, void 0, void 0, function* () {
            const msg = message;
            log_1.default.debug("message received by listener: " + JSON.stringify(msg.getContent(), null, 2));
            msg.ack();
        });
        yield queue.subscribeConsumer(callback, {
            manualAck: false,
            noAck: false,
        });
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            // await connection.close();
        }), 500);
    }
    catch (error) {
        log_1.default.error(error);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi91c2VjYXNlcy9wdWItc3ViL2xpc3RlbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0NBQWlEO0FBQ2pELHdEQUFnQztBQUNoQyx1REFBK0I7QUFFbEIsUUFBQSxRQUFRLEdBQUcsR0FBUyxFQUFFO0lBQy9CLElBQUk7UUFDQSxNQUFNLFVBQVUsR0FBRyxJQUFJLGdCQUFVLENBQUMsZ0JBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzNELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FDeEMsVUFBVSxFQUNWLFFBQVEsRUFDUjtZQUNJLE9BQU8sRUFBRSxLQUFLO1NBQ2pCLENBQ0osQ0FBQztRQUNGLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFO1lBQ2hELE9BQU8sRUFBRSxLQUFLO1NBQ2pCLENBQUMsQ0FBQztRQUNILE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUzQixNQUFNLFFBQVEsR0FBRyxDQUFPLE9BQWdCLEVBQUUsRUFBRTtZQUN4QyxNQUFNLEdBQUcsR0FBRyxPQUFrQixDQUFDO1lBQy9CLGFBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEYsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2QsQ0FBQyxDQUFBLENBQUM7UUFFRixNQUFNLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUU7WUFDcEMsU0FBUyxFQUFFLEtBQUs7WUFDaEIsS0FBSyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUM7UUFDSCxVQUFVLENBQUMsR0FBUyxFQUFFO1lBQ2xCLDRCQUE0QjtRQUNoQyxDQUFDLENBQUEsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNYO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixhQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3BCO0FBQ0wsQ0FBQyxDQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25uZWN0aW9uLCBNZXNzYWdlIH0gZnJvbSBcIi4uLy4uL3NyYy9cIjtcbmltcG9ydCBsb2cgZnJvbSBcIi4uLy4uL3NyYy9sb2dcIjtcbmltcG9ydCBjb25maWcgZnJvbSBcIi4uL2NvbmZpZ1wiO1xuXG5leHBvcnQgY29uc3QgbGlzdGVuZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKGNvbmZpZy5tZXNzYWdlYnJva2VydXJsKTtcbiAgICAgICAgY29uc3QgZXhoY2FuZ2UgPSBjb25uZWN0aW9uLnJlZ2lzdGVyRXhjaGFuZ2UoXG4gICAgICAgICAgICBcImV4Y2hhbmdlXCIsXG4gICAgICAgICAgICBcImZhbm91dFwiLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGR1cmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgcXVldWUgPSBjb25uZWN0aW9uLnJlZ2lzdGVyUXVldWUoXCJzb21lUXVldWVcIiwge1xuICAgICAgICAgICAgZHVyYWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBxdWV1ZS5iaW5kKGV4aGNhbmdlKTtcblxuICAgICAgICBjb25zdCBjYWxsYmFjayA9IGFzeW5jIChtZXNzYWdlOiBNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtc2cgPSBtZXNzYWdlIGFzIE1lc3NhZ2U7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJtZXNzYWdlIHJlY2VpdmVkIGJ5IGxpc3RlbmVyOiBcIiArIEpTT04uc3RyaW5naWZ5KG1zZy5nZXRDb250ZW50KCksIG51bGwsIDIpKTtcbiAgICAgICAgICAgIG1zZy5hY2soKTtcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCBxdWV1ZS5zdWJzY3JpYmVDb25zdW1lcihjYWxsYmFjaywge1xuICAgICAgICAgICAgbWFudWFsQWNrOiBmYWxzZSxcbiAgICAgICAgICAgIG5vQWNrOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgLy8gYXdhaXQgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZy5lcnJvcihlcnJvcik7XG4gICAgfVxufTtcbiJdfQ==