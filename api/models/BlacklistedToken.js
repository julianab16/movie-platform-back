/**
 * @fileoverview Model for blacklist token management.
 * Handles invalidated JWT tokens due to logout or security.
 * 
 * @module models/BlacklistedToken
 * @since 1.0.0
 */

import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Model for managing invalidated tokens with Supabase
 */
class BlacklistedToken {
  /**
   * Adds a token to the blacklist
   * @param {string} token - JWT token to invalidate
   * @param {string} userId - ID of the user who owns the token
   * @param {string} [reason='logout'] - Reason for invalidation
   * @returns {Promise<void>}
   */
  static async addToBlacklist(token, userId, reason = 'logout') {
    try {
      // Create token hash for security (don't store complete token)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      // Extract expiration date from JWT
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
   * Checks if a token is in the blacklist
   * @param {string} token - JWT token to check
   * @returns {Promise<boolean>} True if in blacklist
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
        return false; // In case of error, allow the token
      }

      return !!data; // True if token was found
    } catch (error) {
      logger.error('BLACKLIST_MODEL', 'Error al verificar token en blacklist', error);
      return false; // In case of error, allow the token
    }
  }

  /**
   * Cleans expired tokens from the blacklist
   * @returns {Promise<number>} Number of deleted tokens
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
   * Gets blacklist statistics
   * @returns {Promise<object>} Blacklist statistics
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
   * Clears the entire blacklist (for testing only)
   * @returns {Promise<void>}
   */
  static async clearAll() {
    try {
      const { error } = await supabase
        .from('blacklisted_tokens')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

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