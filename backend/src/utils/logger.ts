import pool from '../config/database';

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
}

export interface LogContext {
    userId?: number;
    ip?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    [key: string]: any;
}

class Logger {
    private async log(level: LogLevel, message: string, context: LogContext = {}) {
        const { userId, ip, action, entityType, entityId, ...details } = context;

        // Always log to console for debugging/monitoring
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context
        }));

        try {
            // Don't save DEBUG logs to DB to save space, unless needed
            if (level === LogLevel.DEBUG) return;

            await pool.query(
                `INSERT INTO system_logs 
        (user_id, action, entity_type, entity_id, details, level, ip_address) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    userId || null,
                    action || 'UNKNOWN_ACTION',
                    entityType || null,
                    entityId || null,
                    JSON.stringify({ message, ...details }),
                    level,
                    ip || null
                ]
            );
        } catch (error) {
            console.error('FAILED TO WRITE LOG TO DB:', error);
        }
    }

    info(message: string, context?: LogContext) {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: LogContext) {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, context?: LogContext) {
        this.log(LogLevel.ERROR, message, context);
    }

    debug(message: string, context?: LogContext) {
        this.log(LogLevel.DEBUG, message, context);
    }
}

export const logger = new Logger();
