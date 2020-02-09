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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi91c2VjYXNlcy9wdWItc3ViL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEseUNBQXNDO0FBQ3RDLHFDQUFrQztBQUVsQyxTQUE4QixHQUFHOztRQUM3QixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxlQUFNLEVBQUUsRUFBRSxtQkFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FBQTtBQUZELHNCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbGlzdGVuZXIgfSBmcm9tIFwiLi9saXN0ZW5lclwiO1xuaW1wb3J0IHsgc2VuZGVyIH0gZnJvbSBcIi4vc2VuZGVyXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIHJ1bigpIHtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbc2VuZGVyKCksIGxpc3RlbmVyKCldKTtcbn1cbiJdfQ==