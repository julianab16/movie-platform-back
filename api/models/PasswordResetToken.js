import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';

class PasswordResetToken {
  /**
   * Crear un nuevo token de recuperación
   */
  static async create(userId, token, expiresAt) {
    try {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .insert({ 
          user_id: userId, 
          token, 
          expires_at: expiresAt, 
          used: false 
        })
        .select()
        .single();

      if (error) throw error;
      
      logger.info('PASSWORD_RESET', `Token creado para usuario ${userId}`);
      return data;
    } catch (error) {
      logger.error('PASSWORD_RESET', 'Error creando token', error);
      throw error;
    }
  }

  /**
   * Buscar token válido (no usado y no expirado)
   */
  static async findValid(token) {
    try {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('PASSWORD_RESET', 'Error buscando token', error);
      return null;
    }
  }

  /**
   * Marcar token como usado
   */
  static async markAsUsed(token) {
    try {
      const { error } = await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);

      if (error) throw error;
      
      logger.info('PASSWORD_RESET', `Token marcado como usado`);
    } catch (error) {
      logger.error('PASSWORD_RESET', 'Error marcando token', error);
      throw error;
    }
  }

  /**
   * Eliminar todos los tokens de un usuario
   */
  static async deleteByUserId(userId) {
    try {
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', userId);

      logger.info('PASSWORD_RESET', `Tokens eliminados para usuario ${userId}`);
    } catch (error) {
      logger.error('PASSWORD_RESET', 'Error eliminando tokens', error);
    }
  }

  /**
   * Limpiar tokens expirados (ejecutar periódicamente)
   */
  static async cleanExpired() {
    try {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      
      const deleted = data?.length || 0;
      logger.info('PASSWORD_RESET', `${deleted} tokens expirados eliminados`);
      return deleted;
    } catch (error) {
      logger.error('PASSWORD_RESET', 'Error limpiando tokens', error);
      return 0;
    }
  }
}

export default PasswordResetToken;