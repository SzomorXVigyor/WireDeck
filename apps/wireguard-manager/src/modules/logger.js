const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const level = process.env.LOG_LEVEL || 'info';

// Format for console (colorized, timestamp inline)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
);

// Format for files (plain)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
);

// Console + main log file (respects LOG_LEVEL)
const consoleAndFileTransports = [
  new winston.transports.Console({
    level,
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    level,
    format: fileFormat,
  }),
];

// Debug rotating file (overwrite every 7 days)
const debugRotateTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'debug-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
  level: 'debug',
  format: fileFormat,
  zippedArchive: false,
});

// Error file
const errorTransport = new winston.transports.File({
  filename: path.join(LOG_DIR, 'error.log'),
  level: 'error',
  format: fileFormat,
});

// Create logger
const logger = winston.createLogger({
  level,
  transports: [...consoleAndFileTransports, debugRotateTransport, errorTransport],
});

module.exports = logger;
