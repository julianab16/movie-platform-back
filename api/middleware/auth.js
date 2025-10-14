import bcrypt from 'bcryptjs';
import jwt from '../utils/jwt.js';
import logger from '../utils/logger.js';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('AUTH', 'Request sin token de autorización', { code: 401, endpoint: req.originalUrl });
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Use the verifyToken function from utils/jwt.js
    const decoded = await jwt.verifyToken(token);
    
    logger.debug('JWT', `Token validado para usuario: ${decoded.correo}`, decoded);
    req.user = decoded; // Contains userId and email
    next();
    
  } catch (error) {
    let message = 'Token inválido';
    let status = 403;
    let logLevel = 'warn';
    
    switch (error.message) {
      case 'TOKEN_EXPIRED':
        message = 'Token expirado. Inicia sesión nuevamente';
        status = 401;
        logLevel = 'info'; // Expiration is normal, not a threat
        break;
      case 'TOKEN_BLACKLISTED':
        message = 'Token revocado. Inicia sesión nuevamente';
        status = 401;
        logLevel = 'warn'; // Revoked token may be suspicious
        break;
      case 'TOKEN_INVALID':
        message = 'Token inválido o malformado';
        status = 403;
        logLevel = 'warn'; // Malformed token is suspicious
        break;
    }
    
    // Log with appropriate level
    const logData = { 
      code: status, 
      endpoint: req.originalUrl, 
      errorType: error.message,
      ip: req.ip || req.socket?.remoteAddress || 'unknown'
    };
    
    if (logLevel === 'warn') {
      logger.warn('AUTH', `Token authentication failed: ${error.message}`, logData);
    } else {
      logger.info('AUTH', `Token expired for user`, logData);
    }
    
    return res.status(status).json({
      success: false,
      message: message
    });
  }
};

// MIDDLEWARE PRE-SAVE: Password hash with bcrypt (min 10 salt rounds)
const preSave = (schema) => {
  schema.pre('save', async function(next) {
    // Only hash if the password is new or was modified
    if (!this.isModified('contrasena')) return next();
    
    try {
      // Hash with 12 salt rounds (more than the minimum of 10)
      this.contrasena = bcrypt.hash(this.contrasena, 12);
      next();
    } catch (error) {
      next(error);
    }
  });
};

export { authenticateToken, preSave };