import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const LOGS_PATH = Bun.env.ERROR_LOGS_PATH ? Bun.env.ERROR_LOGS_PATH : "./logs/error" ;

const transport = new DailyRotateFile({
    filename: "twitcherror.log",
    dirname: `${LOGS_PATH}`,
    datePattern: "YYMMDD",
    zippedArchive: false,
    maxFiles: "14d",
    auditFile: `${LOGS_PATH}/audit.json`,
    utc: true,
});

const errorlog = createLogger({
    level: "error",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        }),
    ),
    transports: [transport],
});

export default errorlog;
