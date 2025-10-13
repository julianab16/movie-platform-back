const bcrypt = require('bcryptjs');
const { verifyToken } = require('../utils/jwt'); // Usar la función del jwt.js
const logger = require('../utils/logger');

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

    // Usar la función verifyToken del utils/jwt.js
    const decoded = await verifyToken(token);
    
    logger.debug('JWT', `Token validado para usuario: ${decoded.correo}`, decoded);
    req.user = decoded; // Contiene userId y correo
    next();
    
  } catch (error) {
    let message = 'Token inválido';
    let status = 403;
    let logLevel = 'warn';
    
    switch (error.message) {
      case 'TOKEN_EXPIRED':
        message = 'Token expirado. Inicia sesión nuevamente';
        status = 401;
        logLevel = 'info'; // Expiración es normal, no una amenaza
        break;
      case 'TOKEN_BLACKLISTED':
        message = 'Token revocado. Inicia sesión nuevamente';
        status = 401;
        logLevel = 'warn'; // Token revocado puede ser sospechoso
        break;
      case 'TOKEN_INVALID':
        message = 'Token inválido o malformado';
        status = 403;
        logLevel = 'warn'; // Token malformado es sospechoso
        break;
    }
    
    // Log con el nivel apropiado
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

// MIDDLEWARE PRE-SAVE: Hash de contraseña con bcrypt (min 10 salt rounds)
const preSave = (schema) => {
  schema.pre('save', async function(next) {
    // Solo hashear si la contraseña es nueva o fue modificada
    if (!this.isModified('contrasena')) return next();
    
    try {
      // Hash con 12 salt rounds (más que el mínimo de 10)
      this.contrasena = bcrypt.hash(this.contrasena, 12);
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { authenticateToken, preSave };