"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pub_sub_1 = __importDefault(require("./pub-sub/"));
const topics_1 = __importDefault(require("./topics/"));
const workers_1 = __importDefault(require("./workers/"));
pub_sub_1.default();
workers_1.default();
topics_1.default();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi91c2VjYXNlcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHlEQUFnQztBQUNoQyx1REFBK0I7QUFDL0IseURBQWlDO0FBRWpDLGlCQUFNLEVBQUUsQ0FBQztBQUNULGlCQUFPLEVBQUUsQ0FBQztBQUNWLGdCQUFNLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwdWJTdWIgZnJvbSBcIi4vcHViLXN1Yi9cIjtcbmltcG9ydCB0b3BpY3MgZnJvbSBcIi4vdG9waWNzL1wiO1xuaW1wb3J0IHdvcmtlcnMgZnJvbSBcIi4vd29ya2Vycy9cIjtcblxucHViU3ViKCk7XG53b3JrZXJzKCk7XG50b3BpY3MoKTtcbiJdfQ==