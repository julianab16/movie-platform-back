/**
 * @fileoverview Model for tracking login attempts using Supabase.
 * Provides security against brute force attacks.
 * 
 * @module models/LoginAttempt
 * @since 1.0.0
 */

import { supabase } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Model for managing login attempts per IP
 */
class LoginAttempt {
  constructor(data) {
    this.ip = data.ip;
    this.attempts = data.attempts || 0;
    this.lastAttempt = data.lastAttempt || new Date();
    this.blockedUntil = data.blockedUntil || null;
    this.sucessfulLogins = data.sucessfulLogins || 0;
  }

  /**
   * Find login attempts by IP
   * @param {Object} query - Search query
   * @returns {Promise<LoginAttempt|null>} Attempt record or null
   */
  static async findOne(query) {
    try {
      if (query.ip) {
        const { data, error } = await supabase
          .from('login_attempts')
          .select('*')
          .eq('ip', query.ip)
          .maybeSingle();

        if (error) {
          logger.error('LOGIN_ATTEMPT', 'Error al buscar intentos por IP', error);
          return null;
        }

        return data ? new LoginAttempt({
          ip: data.ip,
          attempts: data.attempts,
          lastAttempt: data.last_attempt,
          blockedUntil: data.blocked_until,
          sucessfulLogins: data.successful_logins
        }) : null;
      }
      return null;
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al buscar intentos por IP', error);
      return null;
    }
  }

  /**
   * Saves the attempt record
   * @returns {Promise<LoginAttempt>} Saved record
   */
  async save() {
    try {
      const data = {
        ip: this.ip,
        attempts: this.attempts,
        last_attempt: this.lastAttempt,
        blocked_until: this.blockedUntil,
        successful_logins: this.sucessfulLogins
      };
      
      const { error } = await supabase
        .from('login_attempts')
        .upsert(data, {
          onConflict: 'ip',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      logger.debug('LOGIN_ATTEMPT', `Intentos guardados para IP: ${this.ip}`, data);
      return this;
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al guardar intentos', error);
      throw error;
    }
  }

  /**
   * Checks if the IP is blocked
   * @returns {boolean} True if blocked
   */
  isBlocked() {
    if (!this.blockedUntil) return false;
    
    const now = new Date();
    const isBlocked = now < this.blockedUntil;
    
    // If the blocking time has passed, unblock automatically
    if (!isBlocked && this.blockedUntil) {
      this.blockedUntil = null;
      this.attempts = 0;
      this.save(); // Save changes
    }
    
    return isBlocked;
  }

  /**
   * Records a failed login attempt
   * @param {string} ip - Client IP
   * @returns {Promise<LoginAttempt>} Updated record
   */
  static async recordFailedAttempt(ip) {
    try {
      let attempt = await LoginAttempt.findOne({ ip });
      
      if (!attempt) {
        attempt = new LoginAttempt({ ip });
      }
      
      attempt.attempts = (attempt.attempts || 0) + 1;
      attempt.lastAttempt = new Date();
      
      // Block after 10 failed attempts in 10 minutes
      if (attempt.attempts >= 10) {
        attempt.blockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        logger.warn('SECURITY', `IP bloqueada por intentos fallidos: ${ip}`, {
          attempts: attempt.attempts,
          blockedUntil: attempt.blockedUntil
        });
      }
      
      await attempt.save();
      return attempt;
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al registrar intento fallido', error);
      throw error;
    }
  }

  /**
   * Records a successful login
   * @param {string} ip - Client IP
   * @returns {Promise<LoginAttempt>} Updated record
   */
  static async recordSuccessfulLogin(ip) {
    try {
      let attempt = await LoginAttempt.findOne({ ip });
      
      if (!attempt) {
        attempt = new LoginAttempt({ ip });
      }
      
      // Reset failed attempts on successful login
      attempt.attempts = 0;
      attempt.blockedUntil = null;
      attempt.sucessfulLogins = (attempt.sucessfulLogins || 0) + 1;
      attempt.lastAttempt = new Date();
      
      await attempt.save();
      logger.info('LOGIN_ATTEMPT', `Login exitoso desde IP: ${ip}`);
      return attempt;
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al registrar login exitoso', error);
      throw error;
    }
  }

  /**
   * Cleans old attempts (>24 hours)
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanOldAttempts() {
    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('login_attempts')
        .delete()
        .lt('last_attempt', dayAgo.toISOString());
      
      if (error) {
        throw error;
      }
      
      const cleaned = data ? data.length : 0;
      
      if (cleaned > 0) {
        logger.info('LOGIN_ATTEMPT', `Limpiados ${cleaned} registros antiguos de intentos`);
      }
      
      return cleaned;
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al limpiar intentos antiguos', error);
      return 0;
    }
  }

  /**
   * Gets login attempt statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getStats() {
    try {
      const { data: allAttempts, error } = await supabase
        .from('login_attempts')
        .select('*');

      if (error) {
        throw error;
      }

      const totalIPs = allAttempts.length;
      const now = new Date();
      
      const blockedIPs = allAttempts.filter(data => {
        return data.blocked_until && new Date(data.blocked_until) > now;
      }).length;

      const totalAttempts = allAttempts.reduce((sum, data) => sum + (data.attempts || 0), 0);
      const totalSuccessful = allAttempts.reduce((sum, data) => sum + (data.successful_logins || 0), 0);

      return {
        totalIPs,
        blockedIPs,
        activeIPs: totalIPs - blockedIPs,
        totalAttempts,
        totalSuccessful,
        successRate: totalAttempts > 0 ? (totalSuccessful / totalAttempts * 100).toFixed(2) + '%' : '0%'
      };
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al obtener estadísticas', error);
      return {
        totalIPs: 0,
        blockedIPs: 0,
        activeIPs: 0,
        totalAttempts: 0,
        totalSuccessful: 0,
        successRate: '0%'
      };
    }
  }

  /**
   * Clears all records (for testing only)
   */
  static async clearAll() {
    try {
      const { error } = await supabase
        .from('login_attempts')
        .delete()
        .neq('ip', ''); // Delete all records

      if (error) {
        throw error;
      }

      logger.warn('LOGIN_ATTEMPT', 'Todos los registros de intentos fueron eliminados');
    } catch (error) {
      logger.error('LOGIN_ATTEMPT', 'Error al limpiar todos los registros', error);
      throw error;
    }
  }
}

export default LoginAttempt;