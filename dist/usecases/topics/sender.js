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
    const key = "anonymous.super.natural";
    const mockMessage = {
        message: "This is a topics routing",
    };
    const connection = new src_1.Connection(config_1.default.messagebrokerurl, {
        interval: 5000,
        retries: 5000,
    });
    const exchange = connection.registerExchange("topics_exchange", "topic", {
        durable: false,
    });
    const message = new src_1.Message(mockMessage, { persistent: false });
    yield message.send(exchange, key);
    log_1.default.debug("sent message with topic routing: " + JSON.stringify(message.getContent(), null, 2));
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        // await connection.close();
    }), 500);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vdXNlY2FzZXMvdG9waWNzL3NlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFpRDtBQUNqRCx3REFBZ0M7QUFDaEMsdURBQStCO0FBRWxCLFFBQUEsTUFBTSxHQUFHLEdBQVMsRUFBRTtJQUU3QixNQUFNLEdBQUcsR0FBRyx5QkFBeUIsQ0FBQztJQUV0QyxNQUFNLFdBQVcsR0FBRztRQUNoQixPQUFPLEVBQUUsMEJBQTBCO0tBQ3RDLENBQUM7SUFFRixNQUFNLFVBQVUsR0FBRyxJQUFJLGdCQUFVLENBQUMsZ0JBQU0sQ0FBQyxnQkFBZ0IsRUFBRTtRQUN2RCxRQUFRLEVBQUUsSUFBSTtRQUNkLE9BQU8sRUFBRSxJQUFJO0tBQ2hCLENBQUMsQ0FBQztJQUVILE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLEVBQUU7UUFDckUsT0FBTyxFQUFFLEtBQUs7S0FDakIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxPQUFPLEdBQUcsSUFBSSxhQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFaEUsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNsQyxhQUFHLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRS9GLFVBQVUsQ0FBQyxHQUFTLEVBQUU7UUFDbEIsNEJBQTRCO0lBQ2hDLENBQUMsQ0FBQSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ1osQ0FBQyxDQUFBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25uZWN0aW9uLCBNZXNzYWdlIH0gZnJvbSBcIi4uLy4uL3NyYy9cIjtcbmltcG9ydCBsb2cgZnJvbSBcIi4uLy4uL3NyYy9sb2dcIjtcbmltcG9ydCBjb25maWcgZnJvbSBcIi4uL2NvbmZpZ1wiO1xuXG5leHBvcnQgY29uc3Qgc2VuZGVyID0gYXN5bmMgKCkgPT4ge1xuXG4gICAgY29uc3Qga2V5ID0gXCJhbm9ueW1vdXMuc3VwZXIubmF0dXJhbFwiO1xuXG4gICAgY29uc3QgbW9ja01lc3NhZ2UgPSB7XG4gICAgICAgIG1lc3NhZ2U6IFwiVGhpcyBpcyBhIHRvcGljcyByb3V0aW5nXCIsXG4gICAgfTtcblxuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihjb25maWcubWVzc2FnZWJyb2tlcnVybCwge1xuICAgICAgICBpbnRlcnZhbDogNTAwMCxcbiAgICAgICAgcmV0cmllczogNTAwMCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGV4Y2hhbmdlID0gY29ubmVjdGlvbi5yZWdpc3RlckV4Y2hhbmdlKFwidG9waWNzX2V4Y2hhbmdlXCIsIFwidG9waWNcIiwge1xuICAgICAgICBkdXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG1lc3NhZ2UgPSBuZXcgTWVzc2FnZShtb2NrTWVzc2FnZSwgeyBwZXJzaXN0ZW50OiBmYWxzZSB9KTtcblxuICAgIGF3YWl0IG1lc3NhZ2Uuc2VuZChleGNoYW5nZSwga2V5KTtcbiAgICBsb2cuZGVidWcoXCJzZW50IG1lc3NhZ2Ugd2l0aCB0b3BpYyByb3V0aW5nOiBcIiArIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UuZ2V0Q29udGVudCgpLCBudWxsLCAyKSk7XG5cbiAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8gYXdhaXQgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgIH0sIDUwMCk7XG59O1xuIl19