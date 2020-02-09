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
exports.scheduler = () => __awaiter(void 0, void 0, void 0, function* () {
    const mockMessage = {
        message: "remove_data_task",
    };
    const connection = new src_1.Connection(config_1.default.messagebrokerurl, {
        interval: 5000,
        retries: 5000,
    });
    const queue = connection.registerQueue("task_queue", {
        durable: false,
    });
    const message = new src_1.Message(mockMessage, { persistent: true });
    yield message.send(queue);
    log_1.default.debug("sent task by scheduler: " + JSON.stringify(message.getContent(), null, 2));
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        // await connection.close();
    }), 500);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdXNlY2FzZXMvd29ya2Vycy9zY2hlZHVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvQ0FBaUQ7QUFDakQsd0RBQWdDO0FBQ2hDLHVEQUErQjtBQUVsQixRQUFBLFNBQVMsR0FBRyxHQUFTLEVBQUU7SUFDaEMsTUFBTSxXQUFXLEdBQUc7UUFDaEIsT0FBTyxFQUFFLGtCQUFrQjtLQUM5QixDQUFDO0lBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxnQkFBVSxDQUFDLGdCQUFNLENBQUMsZ0JBQWdCLEVBQUU7UUFDdkQsUUFBUSxFQUFFLElBQUk7UUFDZCxPQUFPLEVBQUUsSUFBSTtLQUNoQixDQUFDLENBQUM7SUFFSCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRTtRQUNqRCxPQUFPLEVBQUUsS0FBSztLQUNqQixDQUFDLENBQUM7SUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLGFBQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUUvRCxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUIsYUFBRyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0RixVQUFVLENBQUMsR0FBUyxFQUFFO1FBQ2xCLDRCQUE0QjtJQUNoQyxDQUFDLENBQUEsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29ubmVjdGlvbiwgTWVzc2FnZSB9IGZyb20gXCIuLi8uLi9zcmMvXCI7XG5pbXBvcnQgbG9nIGZyb20gXCIuLi8uLi9zcmMvbG9nXCI7XG5pbXBvcnQgY29uZmlnIGZyb20gXCIuLi9jb25maWdcIjtcblxuZXhwb3J0IGNvbnN0IHNjaGVkdWxlciA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBtb2NrTWVzc2FnZSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJyZW1vdmVfZGF0YV90YXNrXCIsXG4gICAgfTtcblxuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihjb25maWcubWVzc2FnZWJyb2tlcnVybCwge1xuICAgICAgICBpbnRlcnZhbDogNTAwMCxcbiAgICAgICAgcmV0cmllczogNTAwMCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHF1ZXVlID0gY29ubmVjdGlvbi5yZWdpc3RlclF1ZXVlKFwidGFza19xdWV1ZVwiLCB7XG4gICAgICAgIGR1cmFibGU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IG5ldyBNZXNzYWdlKG1vY2tNZXNzYWdlLCB7IHBlcnNpc3RlbnQ6IHRydWUgfSk7XG5cbiAgICBhd2FpdCBtZXNzYWdlLnNlbmQocXVldWUpO1xuICAgIGxvZy5kZWJ1ZyhcInNlbnQgdGFzayBieSBzY2hlZHVsZXI6IFwiICsgSlNPTi5zdHJpbmdpZnkobWVzc2FnZS5nZXRDb250ZW50KCksIG51bGwsIDIpKTtcblxuICAgIHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAvLyBhd2FpdCBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgfSwgNTAwKTtcbn07XG4iXX0=