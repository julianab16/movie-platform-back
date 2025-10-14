/**
 * @fileoverview Modelo para gestión de tokens en blacklist.
 * Maneja tokens JWT invalidados por logout o seguridad.
 * 
 * @module models/BlacklistedToken
 * @since 1.0.0
 */

import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Modelo para gestión de tokens invalidados con Supabase
 */
class BlacklistedToken {
  /**
   * Añade un token a la blacklist
   * @param {string} token - Token JWT a invalidar
   * @param {string} userId - ID del usuario propietario del token
   * @param {string} [reason='logout'] - Razón de la invalidación
   * @returns {Promise<void>}
   */
  static async addToBlacklist(token, userId, reason = 'logout') {
    try {
      // Crear hash del token por seguridad (no almacenar token completo)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Extraer fecha de expiración del JWT
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const expiresAt = new Date(payload.exp * 1000);

      const { error } = await supabase
        .from('blacklisted_tokens')
        .insert({
          token_hash: tokenHash,
          user_id: userId,
          reason: reason,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        logger.error('BLACKLIST_MODEL', 'Error al añadir token a blacklist', error);
        throw error;
      }

      logger.auth('TOKEN_INVALIDATED', userId, 'SUCCESS', { reason, tokenLength: token.length });
    } catch (error) {
      logger.error('BLACKLIST_MODEL', 'Error al añadir token a blacklist', error);
      throw error;
    }
  }

  /**
   * Verifica si un token está en la blacklist
   * @param {string} token - Token JWT a verificar
   * @returns {Promise<boolean>} True si está en blacklist
   */
  static async isBlacklisted(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const { data, error } = await supabase
        .from('blacklisted_tokens')
        .select('id')
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('BLACKLIST_MODEL', 'Error al verificar token en blacklist', error);
        return false; // En caso de error, permitir el token
      }

      return !!data; // True si encontró el token
    } catch (error) {
      logger.error('BLACKLIST_MODEL', 'Error al verificar token en blacklist', error);
      return false; // En caso de error, permitir el token
    }
  }

  /**
   * Limpia tokens expirados de la blacklist
   * @returns {Promise<number>} Número de tokens eliminados
   */
  static async cleanExpiredTokens() {
    try {
      const { data, error } = await supabase
        .from('blacklisted_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('BLACKLIST_MODEL', 'Error al limpiar tokens expirados', error);
        return 0;
      }

      const deletedCount = data ? data.length : 0;
      logger.info('BLACKLIST_MODEL', `Tokens expirados eliminados: ${deletedCount}`);
      return deletedCount;
    } catch (error) {
      logger.error('BLACKLIST_MODEL', 'Error al limpiar tokens expirados', error);
      return 0;
    }
  }

  /**
   * Obtiene estadísticas de la blacklist
   * @returns {Promise<object>} Estadísticas de la blacklist
   */
  static async getStats() {
    try {
      const { count, error } = await supabase
        .from('blacklisted_tokens')
        .select('id', { count: 'exact' });

      if (error) {
        logger.error('BLACKLIST_MODEL', 'Error al obtener estadísticas', error);
        return { totalBlacklisted: 0, lastCleanup: null };
      }

      return {
        totalBlacklisted: count || 0,
        lastCleanup: new Date().toISOString()
      };
    } catch (error) {
      logger.error('BLACKLIST_MODEL', 'Error al obtener estadísticas', error);
      return { totalBlacklisted: 0, lastCleanup: null };
    }
  }

  /**
   * Limpia toda la blacklist (solo para testing)
   * @returns {Promise<void>}
   */
  static async clearAll() {
    try {
      const { error } = await supabase
        .from('blacklisted_tokens')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos

      if (error) {
        logger.error('BLACKLIST_MODEL', 'Error al limpiar blacklist', error);
        throw error;
      }

      logger.warn('BLACKLIST_MODEL', 'Blacklist limpiada completamente');
    } catch (error) {
      logger.error('BLACKLIST_MODEL', 'Error al limpiar blacklist', error);
      throw error;
    }
  }
}

export default BlacklistedToken;