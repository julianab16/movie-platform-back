/**
 * @fileoverview Custom logging system.
 * Provides organized and colored logs for development.
 * 
 * @module utils/logger
 * @since 1.0.0
 */

/**
 * Colores ANSI para terminal
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Gets formatted timestamp
 * @returns {string} Timestamp in HH:mm:ss format
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

/**
 * Formats a log with color and category
 * @param {string} level - Log level (INFO, ERROR, etc.)
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @param {string} color - ANSI color
 * @returns {string} Formatted log
 */
const formatLog = (level, category, message, color) => {
  const timestamp = getTimestamp();
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    // In production, simple log without colors
    return `[${timestamp}] ${level} [${category}] ${message}`;
  }
  
  // In development, log with colors and improved format
  return `${colors.gray}[${timestamp}]${colors.reset} ${color}${level}${colors.reset} ${colors.cyan}[${category}]${colors.reset} ${message}`;
};

/**
 * Logger personalizado para ToDo Center
 */
const logger = {
  /**
   * General information log
   * @param {string} category - Log category
   * @param {string} message - Message
   * @param {any} [data] - Additional data
   */
  info: (category, message, data = null) => {
    const log = formatLog('INFO', category, message, colors.blue);
    console.log(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Success log
   * @param {string} category - Log category
   * @param {string} message - Message
   * @param {any} [data] - Additional data
   */
  success: (category, message, data = null) => {
    const log = formatLog('SUCCESS', category, message, colors.green);
    console.log(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Warning log
   * @param {string} category - Log category
   * @param {string} message - Message
   * @param {any} [data] - Additional data
   */
  warn: (category, message, data = null) => {
    const log = formatLog('WARN', category, message, colors.yellow);
    console.warn(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.warn(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Error log
   * @param {string} category - Log category
   * @param {string} message - Message
   * @param {Error|any} [error] - Error or additional data
   */
  error: (category, message, error = null) => {
    const log = formatLog('ERROR', category, message, colors.red);
    console.error(log);
    if (error && process.env.NODE_ENV === 'development') {
      if (error instanceof Error) {
        console.error(`${colors.dim}${error.stack}${colors.reset}`);
      } else {
        console.error(`${colors.dim}${JSON.stringify(error, null, 2)}${colors.reset}`);
      }
    }
  },

  /**
   * Debug log (only in development)
   * @param {string} category - Log category
   * @param {string} message - Message
   * @param {any} [data] - Additional data
   */
  debug: (category, message, data = null) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const log = formatLog('DEBUG', category, message, colors.magenta);
    console.log(log);
    if (data) {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * HTTP requests log
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} [status] - Status code
   * @param {string} [ip] - Client IP
   */
  request: (method, url, status = null, ip = null) => {
    let color = colors.blue;
    let level = 'HTTP';
    
    if (status >= 500) {
      color = colors.red;
      level = 'ERROR';
    } else if (status >= 400) {
      color = colors.red;
      level = 'CLIENT_ERROR';
    } else if (status >= 300) {
      color = colors.yellow;
      level = 'REDIRECT';
    } else if (status >= 200) {
      color = colors.green;
      level = 'SUCCESS';
    }

    const statusText = status ? ` ${status}` : '';
    const ipText = ip ? ` from ${ip}` : '';
    const message = `${method} ${url}${statusText}${ipText}`;
    
    const log = formatLog(level, 'REQUEST', message, color);
    console.log(log);
  },

  /**
   * Specific log for HTTP error codes
   * @param {number} code - HTTP error code
   * @param {string} endpoint - Endpoint that generated the error
   * @param {string} reason - Error reason
   * @param {any} [data] - Additional data
   */
  httpError: (code, endpoint, reason, data = null) => {
    let color = colors.red;
    let category = 'HTTP_ERROR';
    
    // Classify by error type
    if (code === 401) category = 'UNAUTHORIZED';
    else if (code === 403) category = 'FORBIDDEN';
    else if (code === 409) category = 'CONFLICT';
    else if (code === 423) category = 'LOCKED';
    else if (code === 429) category = 'RATE_LIMITED';
    else if (code >= 500) category = 'SERVER_ERROR';
    
    const message = `${code} ${endpoint} - ${reason}`;
    const log = formatLog('ERROR', category, message, color);
    console.error(log);
    
    if (data && process.env.NODE_ENV === 'development') {
      console.error(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Database log
   * @param {string} operation - Operation (CREATE, READ, UPDATE, DELETE)
   * @param {string} collection - Collection/table
   * @param {any} [data] - Additional data
   */
  db: (operation, collection, data = null) => {
    const message = `${operation} in ${collection}`;
    const log = formatLog('DB', 'DATABASE', message, colors.cyan);
    console.log(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Authentication log
   * @param {string} action - Action (LOGIN, REGISTER, LOGOUT, etc.)
   * @param {string} email - User email
   * @param {string} result - Result (SUCCESS, FAILED, etc.)
   * @param {any} [details] - Additional details
   */
  auth: (action, email, result, details = null) => {
    const color = result === 'SUCCESS' ? colors.green : colors.red;
    const message = `${action} attempt for ${email}: ${result}`;
    const log = formatLog('AUTH', 'SECURITY', message, color);
    console.log(log);
    if (details && process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${JSON.stringify(details, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Visual separator for logs
   * @param {string} [title] - Optional separator title
   */
  separator: (title = null) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const line = '─'.repeat(80);
    console.log(`${colors.gray}${line}${colors.reset}`);
    if (title) {
      console.log(`${colors.bright}${colors.white}  ${title}  ${colors.reset}`);
      console.log(`${colors.gray}${line}${colors.reset}`);
    }
  },

  /**
   * Server start log
   * @param {number} port - Server port
   * @param {string} [docsUrl] - Documentation URL
   */
  server: (port, docsUrl = null) => {
    logger.separator('ToDo Center Backend');
    logger.success('SERVER', `Servidor ejecutándose en http://localhost:${port}`);
    if (docsUrl) {
      logger.info('DOCS', `Documentación API: ${docsUrl}`);
    }
    logger.info('ENV', `Entorno: ${process.env.NODE_ENV || 'development'}`);
    logger.separator();
  }
};

export default logger;