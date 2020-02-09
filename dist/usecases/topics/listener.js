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
        const key = "anonymous.super.natural";
        const connection = new src_1.Connection(config_1.default.messagebrokerurl);
        const exhcange = connection.registerExchange("topics_exchange", "topic", {
            durable: false,
        });
        const queue = connection.registerQueue("somequeue", {
            durable: false,
        });
        yield queue.bind(exhcange, key);
        const callback = (message) => __awaiter(void 0, void 0, void 0, function* () {
            const rountingKey = message.fields.routingKey;
            log_1.default.debug("message received by listener On  routingkey: " +
                rountingKey +
                " with content: " +
                JSON.stringify(message.getContent(), null, 2));
            message.ack();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi91c2VjYXNlcy90b3BpY3MvbGlzdGVuZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvQ0FBaUQ7QUFDakQsd0RBQWdDO0FBQ2hDLHVEQUErQjtBQUVsQixRQUFBLFFBQVEsR0FBRyxHQUFTLEVBQUU7SUFDL0IsSUFBSTtRQUNBLE1BQU0sR0FBRyxHQUFHLHlCQUF5QixDQUFDO1FBRXRDLE1BQU0sVUFBVSxHQUFHLElBQUksZ0JBQVUsQ0FBQyxnQkFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDM0QsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixDQUN4QyxpQkFBaUIsRUFDakIsT0FBTyxFQUNQO1lBQ0ksT0FBTyxFQUFFLEtBQUs7U0FDakIsQ0FDSixDQUFDO1FBQ0YsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUU7WUFDaEQsT0FBTyxFQUFFLEtBQUs7U0FDakIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUVoQyxNQUFNLFFBQVEsR0FBRyxDQUFPLE9BQWdCLEVBQUUsRUFBRTtZQUN4QyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTyxDQUFDLFVBQVUsQ0FBQztZQUMvQyxhQUFHLENBQUMsS0FBSyxDQUNMLCtDQUErQztnQkFDM0MsV0FBVztnQkFDWCxpQkFBaUI7Z0JBQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FDcEQsQ0FBQztZQUNGLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsQixDQUFDLENBQUEsQ0FBQztRQUVGLE1BQU0sS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtZQUNwQyxTQUFTLEVBQUUsS0FBSztZQUNoQixLQUFLLEVBQUUsS0FBSztTQUNmLENBQUMsQ0FBQztRQUNILFVBQVUsQ0FBQyxHQUFTLEVBQUU7WUFDbEIsNEJBQTRCO1FBQ2hDLENBQUMsQ0FBQSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ1g7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNaLGFBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDcEI7QUFDTCxDQUFDLENBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbm5lY3Rpb24sIE1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vc3JjL1wiO1xuaW1wb3J0IGxvZyBmcm9tIFwiLi4vLi4vc3JjL2xvZ1wiO1xuaW1wb3J0IGNvbmZpZyBmcm9tIFwiLi4vY29uZmlnXCI7XG5cbmV4cG9ydCBjb25zdCBsaXN0ZW5lciA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBrZXkgPSBcImFub255bW91cy5zdXBlci5uYXR1cmFsXCI7XG5cbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKGNvbmZpZy5tZXNzYWdlYnJva2VydXJsKTtcbiAgICAgICAgY29uc3QgZXhoY2FuZ2UgPSBjb25uZWN0aW9uLnJlZ2lzdGVyRXhjaGFuZ2UoXG4gICAgICAgICAgICBcInRvcGljc19leGNoYW5nZVwiLFxuICAgICAgICAgICAgXCJ0b3BpY1wiLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGR1cmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgcXVldWUgPSBjb25uZWN0aW9uLnJlZ2lzdGVyUXVldWUoXCJzb21lcXVldWVcIiwge1xuICAgICAgICAgICAgZHVyYWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgICBhd2FpdCBxdWV1ZS5iaW5kKGV4aGNhbmdlLCBrZXkpO1xuXG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gYXN5bmMgKG1lc3NhZ2U6IE1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJvdW50aW5nS2V5ID0gbWVzc2FnZS5maWVsZHMhLnJvdXRpbmdLZXk7XG4gICAgICAgICAgICBsb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgXCJtZXNzYWdlIHJlY2VpdmVkIGJ5IGxpc3RlbmVyIE9uICByb3V0aW5na2V5OiBcIiArXG4gICAgICAgICAgICAgICAgICAgIHJvdW50aW5nS2V5ICtcbiAgICAgICAgICAgICAgICAgICAgXCIgd2l0aCBjb250ZW50OiBcIiArXG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UuZ2V0Q29udGVudCgpLCBudWxsLCAyKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBtZXNzYWdlLmFjaygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGF3YWl0IHF1ZXVlLnN1YnNjcmliZUNvbnN1bWVyKGNhbGxiYWNrLCB7XG4gICAgICAgICAgICBtYW51YWxBY2s6IGZhbHNlLFxuICAgICAgICAgICAgbm9BY2s6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAvLyBhd2FpdCBjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nLmVycm9yKGVycm9yKTtcbiAgICB9XG59O1xuIl19