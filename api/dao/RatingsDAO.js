import GlobalDAO from './GlobalDAO.js';
import { supabaseAdmin } from '../config/supabase.js';

class RatingsDAO extends GlobalDAO {
  constructor() {
    super('ratings');
  }

  // Create or update a user's rating for a movie (by pelicula_id or tmdb_id)
  async upsertRating({ usuario_id, pelicula_id = null, tmdb_id = null, rating }) {
    if (!usuario_id) throw new Error('usuario_id requerido');
    if (!pelicula_id && !tmdb_id) throw new Error('pelicula_id o tmdb_id requerido');

    // Find existing rating for this user and movie
    let existing = null;
    try {
      if (pelicula_id) {
        const { data, error } = await supabaseAdmin
          .from(this.tableName)
          .select('*')
          .eq('usuario_id', usuario_id)
          .eq('pelicula_id', pelicula_id)
          .single();
        if (!error) existing = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from(this.tableName)
          .select('*')
          .eq('usuario_id', usuario_id)
          .eq('tmdb_id', tmdb_id)
          .single();
        if (!error) existing = data;
      }
    } catch (err) {
      // ignore single-row not found errors from supabase
      existing = null;
    }

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({ rating, updated_at: new Date() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Insert new rating
    const payload = {
      usuario_id,
      pelicula_id,
      tmdb_id,
      rating,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from(this.tableName)
      .insert([payload])
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted;
  }

  // Return average rating and count for a movie identified by tmdb_id
  async getAverageByTmdbId(tmdb_id) {
    if (!tmdb_id) throw new Error('tmdb_id requerido');
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('rating')
      .eq('tmdb_id', tmdb_id);
    if (error) throw error;
    const ratings = data || [];
    const count = ratings.length;
    const avg = count === 0 ? 0 : Math.round((ratings.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10;
    return { average: avg, count };
  }

  // Return average rating and count for a movie identified by pelicula_id
  async getAverageByPeliculaId(pelicula_id) {
    if (!pelicula_id) throw new Error('pelicula_id requerido');
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('rating')
      .eq('pelicula_id', pelicula_id);
    if (error) throw error;
    const ratings = data || [];
    const count = ratings.length;
    const avg = count === 0 ? 0 : Math.round((ratings.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10;
    return { average: avg, count };
  }

  // Get the rating a user gave to a movie (by pelicula_id or tmdb_id)
  async getUserRating({ usuario_id, pelicula_id = null, tmdb_id = null }) {
    if (!usuario_id) throw new Error('usuario_id requerido');

    try {
      let query = supabaseAdmin.from(this.tableName).select('*').eq('usuario_id', usuario_id);
      if (pelicula_id) query = query.eq('pelicula_id', pelicula_id);
      if (tmdb_id) query = query.eq('tmdb_id', tmdb_id);
      const { data, error } = await query.single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    } catch (err) {
      return null;
    }
  }
}

export default new RatingsDAO();
