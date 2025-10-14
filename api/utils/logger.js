/**
 * @fileoverview Sistema de logging personalizado.
 * Proporciona logs organizados y coloreados para desarrollo.
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
 * Obtiene timestamp formateado
 * @returns {string} Timestamp en formato HH:mm:ss
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

/**
 * Formatea un log con color y categoría
 * @param {string} level - Nivel del log (INFO, ERROR, etc.)
 * @param {string} category - Categoría del log
 * @param {string} message - Mensaje del log
 * @param {string} color - Color ANSI
 * @returns {string} Log formateado
 */
const formatLog = (level, category, message, color) => {
  const timestamp = getTimestamp();
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    // En producción, log simple sin colores
    return `[${timestamp}] ${level} [${category}] ${message}`;
  }
  
  // En desarrollo, log con colores y formato mejorado
  return `${colors.gray}[${timestamp}]${colors.reset} ${color}${level}${colors.reset} ${colors.cyan}[${category}]${colors.reset} ${message}`;
};

/**
 * Logger personalizado para ToDo Center
 */
const logger = {
  /**
   * Log de información general
   * @param {string} category - Categoría del log
   * @param {string} message - Mensaje
   * @param {any} [data] - Datos adicionales
   */
  info: (category, message, data = null) => {
    const log = formatLog('INFO', category, message, colors.blue);
    console.log(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Log de éxito
   * @param {string} category - Categoría del log
   * @param {string} message - Mensaje
   * @param {any} [data] - Datos adicionales
   */
  success: (category, message, data = null) => {
    const log = formatLog('SUCCESS', category, message, colors.green);
    console.log(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.log(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Log de advertencia
   * @param {string} category - Categoría del log
   * @param {string} message - Mensaje
   * @param {any} [data] - Datos adicionales
   */
  warn: (category, message, data = null) => {
    const log = formatLog('WARN', category, message, colors.yellow);
    console.warn(log);
    if (data && process.env.NODE_ENV === 'development') {
      console.warn(`${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`);
    }
  },

  /**
   * Log de error
   * @param {string} category - Categoría del log
   * @param {string} message - Mensaje
   * @param {Error|any} [error] - Error o datos adicionales
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
   * Log de debug (solo en desarrollo)
   * @param {string} category - Categoría del log
   * @param {string} message - Mensaje
   * @param {any} [data] - Datos adicionales
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
   * Log de requests HTTP
   * @param {string} method - Método HTTP
   * @param {string} url - URL del request
   * @param {number} [status] - Código de estado
   * @param {string} [ip] - IP del cliente
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
   * Log específico para códigos de error HTTP
   * @param {number} code - Código de error HTTP
   * @param {string} endpoint - Endpoint que generó el error
   * @param {string} reason - Razón del error
   * @param {any} [data] - Datos adicionales
   */
  httpError: (code, endpoint, reason, data = null) => {
    let color = colors.red;
    let category = 'HTTP_ERROR';
    
    // Clasificar por tipo de error
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
   * Log de base de datos
   * @param {string} operation - Operación (CREATE, READ, UPDATE, DELETE)
   * @param {string} collection - Colección/tabla
   * @param {any} [data] - Datos adicionales
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
   * Log de autenticación
   * @param {string} action - Acción (LOGIN, REGISTER, LOGOUT, etc.)
   * @param {string} email - Email del usuario
   * @param {string} result - Resultado (SUCCESS, FAILED, etc.)
   * @param {any} [details] - Detalles adicionales
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
   * Separador visual para logs
   * @param {string} [title] - Título opcional del separador
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
   * Log de inicio de servidor
   * @param {number} port - Puerto del servidor
   * @param {string} [docsUrl] - URL de documentación
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