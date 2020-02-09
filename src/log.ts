import { TransformableInfo } from "logform";
import {
    createLogger,
    format,
    Logger,
    transports,
} from "winston";

const log: Logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.align(),
        format.simple(),
        format.timestamp(),
        format.printf((info: TransformableInfo) =>
            `${info.timestamp} ${info.level}: ${info.message}` + (info.splat !== undefined ? `${info.splat}` : " ")),
    ),
    level: "info",
    transports: [
        new transports.Console({ level: "debug" }),
    ],
});

export default log;
