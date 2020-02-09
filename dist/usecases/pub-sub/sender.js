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
exports.sender = () => __awaiter(void 0, void 0, void 0, function* () {
    const mockMessage = {
        message: "This is a publisher",
    };
    const connection = new src_1.Connection(config_1.default.messagebrokerurl, {
        interval: 5000,
        retries: 5000,
    });
    const exchange = connection.registerExchange("exchange", "fanout", {
        durable: false,
    });
    const message = new src_1.Message(mockMessage, { persistent: false });
    yield message.send(exchange);
    log_1.default.debug("sent message: " + JSON.stringify(message.getContent(), null, 2));
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        // await connection.close();
    }), 500);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdXNlY2FzZXMvcHViLXN1Yi9zZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvQ0FBaUQ7QUFDakQsd0RBQWdDO0FBQ2hDLHVEQUErQjtBQUVsQixRQUFBLE1BQU0sR0FBRyxHQUFTLEVBQUU7SUFDN0IsTUFBTSxXQUFXLEdBQUc7UUFDaEIsT0FBTyxFQUFFLHFCQUFxQjtLQUNqQyxDQUFDO0lBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxnQkFBVSxDQUFDLGdCQUFNLENBQUMsZ0JBQWdCLEVBQUU7UUFDdkQsUUFBUSxFQUFFLElBQUk7UUFDZCxPQUFPLEVBQUUsSUFBSTtLQUNoQixDQUFDLENBQUM7SUFFSCxNQUFNLFFBQVEsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRTtRQUMvRCxPQUFPLEVBQUUsS0FBSztLQUNqQixDQUFDLENBQUM7SUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLGFBQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUVoRSxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0IsYUFBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU1RSxVQUFVLENBQUMsR0FBUyxFQUFFO1FBQ2xCLDRCQUE0QjtJQUNoQyxDQUFDLENBQUEsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29ubmVjdGlvbiwgTWVzc2FnZSB9IGZyb20gXCIuLi8uLi9zcmMvXCI7XG5pbXBvcnQgbG9nIGZyb20gXCIuLi8uLi9zcmMvbG9nXCI7XG5pbXBvcnQgY29uZmlnIGZyb20gXCIuLi9jb25maWdcIjtcblxuZXhwb3J0IGNvbnN0IHNlbmRlciA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBtb2NrTWVzc2FnZSA9IHtcbiAgICAgICAgbWVzc2FnZTogXCJUaGlzIGlzIGEgcHVibGlzaGVyXCIsXG4gICAgfTtcblxuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihjb25maWcubWVzc2FnZWJyb2tlcnVybCwge1xuICAgICAgICBpbnRlcnZhbDogNTAwMCxcbiAgICAgICAgcmV0cmllczogNTAwMCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGV4Y2hhbmdlID0gY29ubmVjdGlvbi5yZWdpc3RlckV4Y2hhbmdlKFwiZXhjaGFuZ2VcIiwgXCJmYW5vdXRcIiwge1xuICAgICAgICBkdXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG1lc3NhZ2UgPSBuZXcgTWVzc2FnZShtb2NrTWVzc2FnZSwgeyBwZXJzaXN0ZW50OiBmYWxzZSB9KTtcblxuICAgIGF3YWl0IG1lc3NhZ2Uuc2VuZChleGNoYW5nZSk7XG4gICAgbG9nLmRlYnVnKFwic2VudCBtZXNzYWdlOiBcIiArIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UuZ2V0Q29udGVudCgpLCBudWxsLCAyKSk7XG5cbiAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8gYXdhaXQgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgIH0sIDUwMCk7XG59O1xuIl19