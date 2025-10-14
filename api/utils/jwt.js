import jsonwebtoken from 'jsonwebtoken';
import BlacklistedToken from '../models/BlacklistedToken.js';

const jwt = jsonwebtoken;

const JWT_SECRET = process.env.JWT_SECRET || 'tu-jwt-secret-super-seguro-aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// GENERATE JWT TOKEN
const generateToken = (user) => {
    // information that goes inside the token
  const payload = {
    userId: user.id || user._id,  // Support both id formats
    correo: user.email || user.correo  // Support both field names
  };
  
  // Create the JWT token with:
  // - payload: user information
  // - secret: secret key to sign the token
  // - options: additional configuration
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'movie-platform-app', // token issuer
    audience: 'movie-platform-users' // token audience
  });
};

// VERIFY JWT TOKEN
const verifyToken = async (token) => {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.isBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('TOKEN_BLACKLISTED');
    }
    
    // Verify signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TOKEN_EXPIRED');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('TOKEN_INVALID');
    } else {
      throw error;
    }
  }
};

// INVALIDATE TOKEN (for logout)
const invalidateToken = async (token, userId, reason = 'logout') => {
  await BlacklistedToken.addToBlacklist(token, userId, reason);
};

export default {
  generateToken,
  verifyToken,
  invalidateToken
};


// node -c api/middleware/auth.js
// node -e "const auth = require('./api/middleware/auth.js'); console.log('Auth middleware funciona correctamente');"