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
const listener_1 = require("./listener");
const sender_1 = require("./sender");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([sender_1.sender(), listener_1.listener()]);
    });
}
exports.default = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi91c2VjYXNlcy90b3BpY3MvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBc0M7QUFDdEMscUNBQWtDO0FBRWxDLFNBQThCLEdBQUc7O1FBQzdCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGVBQU0sRUFBRSxFQUFFLG1CQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQztDQUFBO0FBRkQsc0JBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsaXN0ZW5lciB9IGZyb20gXCIuL2xpc3RlbmVyXCI7XG5pbXBvcnQgeyBzZW5kZXIgfSBmcm9tIFwiLi9zZW5kZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gcnVuKCkge1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtzZW5kZXIoKSwgbGlzdGVuZXIoKV0pO1xufVxuIl19