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
exports.worker = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = new src_1.Connection(config_1.default.messagebrokerurl);
        const queue = connection.registerQueue("task_queue", {
            durable: false,
        });
        const callback = (message) => __awaiter(void 0, void 0, void 0, function* () {
            const msg = message;
            log_1.default.debug("task received by worker: " + JSON.stringify(msg.getContent(), null, 2));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdXNlY2FzZXMvd29ya2Vycy93b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvQ0FBa0Q7QUFDbEQsd0RBQWdDO0FBQ2hDLHVEQUErQjtBQUVsQixRQUFBLE1BQU0sR0FBRyxHQUFTLEVBQUU7SUFDN0IsSUFBSTtRQUNBLE1BQU0sVUFBVSxHQUFHLElBQUksZ0JBQVUsQ0FBQyxnQkFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFM0QsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUU7WUFDakQsT0FBTyxFQUFFLEtBQUs7U0FDakIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsQ0FBTyxPQUFnQixFQUFFLEVBQUU7WUFDeEMsTUFBTSxHQUFHLEdBQUcsT0FBa0IsQ0FBQztZQUMvQixhQUFHLENBQUMsS0FBSyxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25GLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLENBQUMsQ0FBQSxDQUFDO1FBRUYsTUFBTSxLQUFLLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFO1lBQ3BDLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLEtBQUssRUFBRSxLQUFLO1NBQ2YsQ0FBQyxDQUFDO1FBQ0gsVUFBVSxDQUFDLEdBQVMsRUFBRTtZQUNsQiw0QkFBNEI7UUFDaEMsQ0FBQyxDQUFBLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDWDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osYUFBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNwQjtBQUNMLENBQUMsQ0FBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29ubmVjdGlvbiwgTWVzc2FnZSAgfSBmcm9tIFwiLi4vLi4vc3JjL1wiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi4vLi4vc3JjL2xvZ1wiO1xuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi4vY29uZmlnXCI7XG5cbmV4cG9ydCBjb25zdCB3b3JrZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKGNvbmZpZy5tZXNzYWdlYnJva2VydXJsKTtcblxuICAgICAgICBjb25zdCBxdWV1ZSA9IGNvbm5lY3Rpb24ucmVnaXN0ZXJRdWV1ZShcInRhc2tfcXVldWVcIiwge1xuICAgICAgICAgICAgZHVyYWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gYXN5bmMgKG1lc3NhZ2U6IE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IG1lc3NhZ2UgYXMgTWVzc2FnZTtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInRhc2sgcmVjZWl2ZWQgYnkgd29ya2VyOiBcIiArIEpTT04uc3RyaW5naWZ5KG1zZy5nZXRDb250ZW50KCksIG51bGwsIDIpKTtcbiAgICAgICAgICAgIG1zZy5hY2soKTtcbiAgICAgICAgfTtcblxuICAgICAgICBhd2FpdCBxdWV1ZS5zdWJzY3JpYmVDb25zdW1lcihjYWxsYmFjaywge1xuICAgICAgICAgICAgbWFudWFsQWNrOiBmYWxzZSxcbiAgICAgICAgICAgIG5vQWNrOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgLy8gYXdhaXQgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZy5lcnJvcihlcnJvcik7XG4gICAgfVxufTtcbiJdfQ==