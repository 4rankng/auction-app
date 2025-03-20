/**
 * Logger Service
 *
 * A centralized logging service to replace console.log statements throughout the application.
 * Supports different log levels (info, warn, error) and can be configured to only show
 * certain log levels in production environments.
 */

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LoggerConfig {
  minLevel: LogLevel;
  enabledInProduction: LogLevel[];
  prefix?: string;
}

class LoggerService {
  private config: LoggerConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.config = {
      minLevel: LogLevel.INFO,
      enabledInProduction: [LogLevel.ERROR],
      prefix: '[Auction App]',
    };
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log error messages
   */
  error(message: string | Error, ...args: any[]): void {
    if (message instanceof Error) {
      this.log(LogLevel.ERROR, message.message, {
        error: message,
        stack: message.stack,
        ...args,
      });
    } else {
      this.log(LogLevel.ERROR, message, ...args);
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // In production, only show logs based on configured levels
    if (this.isProduction && !this.config.enabledInProduction.includes(level)) {
      return;
    }

    // Check minimum log level
    if (this.getLogLevelPriority(level) < this.getLogLevelPriority(this.config.minLevel)) {
      return;
    }

    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    const timestamp = new Date().toISOString();
    const formattedMessage = `${prefix}[${timestamp}] [${level.toUpperCase()}]: ${message}`;

    switch (level) {
      case LogLevel.INFO:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  /**
   * Get the priority of a log level (higher number = higher priority)
   */
  private getLogLevelPriority(level: LogLevel): number {
    switch (level) {
      case LogLevel.INFO: return 1;
      case LogLevel.WARN: return 2;
      case LogLevel.ERROR: return 3;
      default: return 0;
    }
  }
}

// Export a singleton instance
const logger = new LoggerService();

export default logger;
