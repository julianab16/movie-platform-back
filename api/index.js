// api/index.js
import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/supabase.js';
import routes from './routes/routes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURACIÓN CORS MEJORADA
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🌐 Origenes permitidos:', allowedOrigins);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});


app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, mobile apps, etc)
    if (!origin) {
      console.log('✅ Request sin origin permitido');
      return callback(null, true);
    }
    
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      
      // Verificar si está en la lista de permitidos
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Origin permitido:', origin);
        return callback(null, true);
      }
      
      // Permitir todos los subdominios de vercel.app
      if (hostname.endsWith('.vercel.app')) {
        console.log('✅ Vercel origin permitido:', origin);
        return callback(null, true);
      }
      
      // Permitir vercel.app directo
      if (hostname === 'vercel.app') {
        console.log('✅ Vercel origin permitido:', origin);
        return callback(null, true);
      }
      
      console.warn('⚠️ Origin bloqueado:', origin);
      callback(new Error('No permitido por CORS'));
    } catch (e) {
      console.error('❌ Error parseando origin:', origin, e.message);
      callback(new Error('Origin inválido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log de requests (útil para debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Ping endpoint para keep-alive
app.get('/ping', (req, res) => {
  res.json({ pong: true, time: Date.now() });
});

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'SamFilms API v1.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: 'https://github.com/tu-repo'
    }
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/v1', routes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Error de CORS
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por CORS',
      origin: req.headers.origin
    });
  }
  
  // Otros errores
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('═════════════════════════════════════════');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'No configurado'}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('═════════════════════════════════════════');
  
  // Test conexión a Supabase
  await testConnection();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

export default app;