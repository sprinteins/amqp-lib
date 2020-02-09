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
Object.defineProperty(exports, "__esModule", { value: true });
const scheduler_1 = require("./scheduler");
const worker_1 = require("./worker");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([scheduler_1.scheduler(), worker_1.worker()]);
    });
}
exports.default = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi91c2VjYXNlcy93b3JrZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXdDO0FBQ3hDLHFDQUFrQztBQUVsQyxTQUE4QixHQUFHOztRQUM3QixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxxQkFBUyxFQUFFLEVBQUUsZUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FBQTtBQUZELHNCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgc2NoZWR1bGVyIH0gZnJvbSBcIi4vc2NoZWR1bGVyXCI7XG5pbXBvcnQgeyB3b3JrZXIgfSBmcm9tIFwiLi93b3JrZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gcnVuKCkge1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtzY2hlZHVsZXIoKSwgd29ya2VyKCldKTtcbn1cbiJdfQ==