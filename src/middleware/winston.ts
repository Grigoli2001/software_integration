import { createLogger, transports, format } from "winston";

interface Options {
  file: {
    level: string;
    filename: string;
    handleException: boolean;
    maxSize: number;
    maxFiles: number;
    format: any; // You can define a more specific type for format if needed
  };
  console: {
    level: string;
    handleException: boolean;
    format: any; // You can define a more specific type for format if needed
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

(logger as any).stream = {
  write: function (message: string) {
    logger.info(message);
  },
};

export default logger;
