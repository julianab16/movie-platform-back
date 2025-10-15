import { supabase } from '../config/supabase.js';

class PasswordResetToken {
  static async create(userId, token, expiresAt) {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .insert({ user_id: userId, token, expires_at: expiresAt, used: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async findValid(token) {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    if (error) return null;
    return data;
  }

  static async markAsUsed(token) {
    const { error } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);
    if (error) throw error;
  }

  static async deleteByUserId(userId) {
    await supabase.from('password_reset_tokens').delete().eq('user_id', userId);
  }
}

export default PasswordResetToken;
