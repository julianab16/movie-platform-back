// config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validar que las variables de entorno existan
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las credenciales de Supabase no están configuradas correctamente');
}

// Cliente público (para operaciones del lado del cliente)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con privilegios administrativos (para operaciones del servidor)  
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error && error.code !== 'PGRST204') {
      console.log('⚠️  Conexión establecida pero revisa tus tablas');
    } else {
      console.log('✅ Conexión exitosa con Supabase');
    }
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con Supabase:', err.message);
    return false;
  }
};

export default supabase;