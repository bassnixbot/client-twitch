import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const LOGS_PATH = Bun.env.UNPROCESSED_LOGS_PATH ? Bun.env.UNPROCESSED_LOGS_PATH : "./logs/chat" ;

const transport = new DailyRotateFile({
    filename: "twitch.log",
    dirname: `${LOGS_PATH}`,
    datePattern: "YYMMDD-HHmm",
    zippedArchive: false,
    maxFiles: "14d",
    auditFile: `${LOGS_PATH}/audit.json`,
    frequency: "30m",
    utc: true,
});

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        }),
    ),
    transports: [transport],
});

export default logger;
