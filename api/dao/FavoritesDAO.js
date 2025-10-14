import GlobalDAO from './GlobalDAO.js';
import { supabase } from '../config/supabase.js';

class FavoritesDAO extends GlobalDAO {
  constructor() {
    super('favorites');
  }

  // Get user favorites (only basic IDs)
  async getFavoritesByUserId(userId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Check if a movie is user's favorite
  async isFavorite(userId, movieId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }
    
    return !!data;
  }

  // Add to favorites
  async addFavorite(userId, movieId) {
    // Check if it already exists
    const exists = await this.isFavorite(userId, movieId);
    if (exists) {
      throw new Error('Movie is already in favorites');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        user_id: userId,
        movie_id: movieId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remove from favorites
  async removeFavorite(userId, movieId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get favorites count for user
  async getFavoritesCount(userId) {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return count || 0;
  }

  // Clear all favorites for user
  async clearAllFavorites(userId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data || [];
  }

  // Get movie IDs that are favorites for a user
  async getFavoriteMovieIds(userId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('movie_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return (data || []).map(item => item.movie_id);
  }
}

export default new FavoritesDAO();