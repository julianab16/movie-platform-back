// index.js
import express from 'express';
import dotenv from 'dotenv';
import { testConnection } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar conexión con Supabase al iniciar
testConnection();

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    environment: process.env.NODE_ENV 
  });
});

// Ruta para verificar tablas disponibles
app.get('/check-tables', async (req, res) => {
  const { supabase } = await import('./config/supabase.js');
  
  const commonTables = [
    'users', 'usuarios', 'products', 'productos', 'orders', 
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
      // Tabla no existe
    }
  }

  res.json({
    success: true,
    tablesFound: availableTables.length,
    tables: availableTables,
    tip: 'Si no ves tus tablas, pregunta al creador los nombres exactos'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════');
});

export default app;