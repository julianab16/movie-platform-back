// config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ===========================================
// 🔧 Validación de variables de entorno
// ===========================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('❌ Faltan variables de entorno de Supabase (URL, ANON_KEY o SERVICE_ROLE_KEY)');
}

// ===========================================
// 🚀 Cliente público (para uso general / front)
// ===========================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===========================================
// 🛠️ Cliente administrativo (para servidor)
// ===========================================
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ===========================================
// 🧪 Función de prueba de conexión
// ===========================================
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
