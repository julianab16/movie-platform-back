// index.js
import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/supabase.js';
import routes from './routes/routes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//configuración de cors
const allowedOrigins = [
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => 
      origin === allowed || origin.endsWith('.vercel.app')
    )) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verify connection with Supabase on startup
testConnection();

// API Routes
app.use('/api/v1', routes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    environment: process.env.NODE_ENV 
  });
});

// Route to check available tables
app.get('/check-tables', async (req, res) => {
  const { supabase } = await import('./config/supabase.js');
  
  const commonTables = [
    'users', 'usuarios', 'movies', 'peliculas', 'comments', 'comentarios',
    'favorites', 'favoritos', 'products', 'productos', 'orders', 
    'pedidos', 'categories', 'categorias', 'clientes', 'ventas',
    'inventory', 'inventario', 'items', 'articulos'
  ];

  const availableTables = [];

  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        availableTables.push({ 
          table: tableName, 
          columns,
          hasData: data && data.length > 0 
        });
      }
    } catch (err) {
      // Table does not exist
    }
  }

  res.json({
    success: true,
    tablesFound: availableTables.length,
    tables: availableTables,
    tip: 'Si no ves tus tablas, pregunta al creador los nombres exactos'
  });
});

// Middleware for 404 - Not Found (must be after all routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Global error handler (must be last middleware)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════');
});

export default app;