// index.js
import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/supabase.js';
import routes from './routes/routes.js';
import cors from 'cors';

// Load .env into process.env early
dotenv.config();

// In Node we should use process.env (import.meta.env is a Vite/browser feature)
const API_BASE_URL = process.env.VITE_API_URL || process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

console.log('🔧 API URL configurada:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV || process.env.MODE || 'development');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS mejorada para producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Tu URL de Vercel
  'https://samfilms-client.vercel.app', // Reemplaza con tu dominio real
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    try {
      const hostname = new URL(origin).hostname;
      
      // Permitir orígenes específicos
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Permitir todos los subdominios de vercel.app
      if (hostname.endsWith('vercel.app')) {
        return callback(null, true);
      }
      
      // Bloquear otros orígenes
      console.warn('⚠️ CORS blocked origin:', origin);
      callback(new Error('No permitido por CORS'));
    } catch (e) {
      console.warn('⚠️ Invalid origin:', origin);
      callback(new Error('Origen inválido'));
    }
  },
  credentials: true, // Permitir envío de cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // 24 horas de cache para preflight
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar conexión con Supabase
testConnection();

// API Routes
app.use('/api/v1', routes);

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    environment: process.env.NODE_ENV,
    frontend: process.env.FRONTEND_URL
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
  console.log('═══════════════════════════════════════');
});

export default app;