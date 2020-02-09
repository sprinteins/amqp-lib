"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const log = winston_1.createLogger({
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.align(), winston_1.format.simple(), winston_1.format.timestamp(), winston_1.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}` + (info.splat !== undefined ? `${info.splat}` : " "))),
    level: "info",
    transports: [
        new winston_1.transports.Console({ level: "debug" }),
    ],
});
exports.default = log;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHFDQUtpQjtBQUVqQixNQUFNLEdBQUcsR0FBVyxzQkFBWSxDQUFDO0lBQzdCLE1BQU0sRUFBRSxnQkFBTSxDQUFDLE9BQU8sQ0FDbEIsZ0JBQU0sQ0FBQyxRQUFRLEVBQUUsRUFDakIsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsRUFDZCxnQkFBTSxDQUFDLE1BQU0sRUFBRSxFQUNmLGdCQUFNLENBQUMsU0FBUyxFQUFFLEVBQ2xCLGdCQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBdUIsRUFBRSxFQUFFLENBQ3RDLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDL0c7SUFDRCxLQUFLLEVBQUUsTUFBTTtJQUNiLFVBQVUsRUFBRTtRQUNSLElBQUksb0JBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUM7S0FDN0M7Q0FDSixDQUFDLENBQUM7QUFFSCxrQkFBZSxHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUcmFuc2Zvcm1hYmxlSW5mbyB9IGZyb20gXCJsb2dmb3JtXCI7XG5pbXBvcnQge1xuICAgIGNyZWF0ZUxvZ2dlcixcbiAgICBmb3JtYXQsXG4gICAgTG9nZ2VyLFxuICAgIHRyYW5zcG9ydHMsXG59IGZyb20gXCJ3aW5zdG9uXCI7XG5cbmNvbnN0IGxvZzogTG9nZ2VyID0gY3JlYXRlTG9nZ2VyKHtcbiAgICBmb3JtYXQ6IGZvcm1hdC5jb21iaW5lKFxuICAgICAgICBmb3JtYXQuY29sb3JpemUoKSxcbiAgICAgICAgZm9ybWF0LmFsaWduKCksXG4gICAgICAgIGZvcm1hdC5zaW1wbGUoKSxcbiAgICAgICAgZm9ybWF0LnRpbWVzdGFtcCgpLFxuICAgICAgICBmb3JtYXQucHJpbnRmKChpbmZvOiBUcmFuc2Zvcm1hYmxlSW5mbykgPT5cbiAgICAgICAgICAgIGAke2luZm8udGltZXN0YW1wfSAke2luZm8ubGV2ZWx9OiAke2luZm8ubWVzc2FnZX1gICsgKGluZm8uc3BsYXQgIT09IHVuZGVmaW5lZCA/IGAke2luZm8uc3BsYXR9YCA6IFwiIFwiKSksXG4gICAgKSxcbiAgICBsZXZlbDogXCJpbmZvXCIsXG4gICAgdHJhbnNwb3J0czogW1xuICAgICAgICBuZXcgdHJhbnNwb3J0cy5Db25zb2xlKHsgbGV2ZWw6IFwiZGVidWdcIiB9KSxcbiAgICBdLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGxvZztcbiJdfQ==