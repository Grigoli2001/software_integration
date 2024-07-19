import { createLogger, transports, format, LoggerOptions } from "winston";

interface Options {
  file: {
    level: string;
    filename: string;
    handleException: boolean;
    maxSize: number;
    maxFiles: number;
    format: LoggerOptions["format"];
  };
  console: {
    level: string;
    handleException: boolean;
    format: LoggerOptions["format"];
  };
}

const options: Options = {
  file: {
    level: "info",
    filename: `./logs/app.log`,
    handleException: true,
    maxSize: 5242880, // about 5MB
    maxFiles: 5,
    format: format.combine(format.timestamp(), format.json()),
  },
  console: {
    level: "debug",
    handleException: true,
    format: format.combine(format.colorize(), format.simple()),
  },
};

const logger = createLogger({
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
  exitOnError: false,
});

interface LoggerInterface {
  stream: object;
}

(logger as LoggerInterface).stream = {
  write: function (message: string): void {
    logger.info(message);
  },
};

export default logger;
