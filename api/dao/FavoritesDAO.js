const GlobalDAO = require('./GlobalDAO');

class FavoritesDAO extends GlobalDAO {
  constructor() {
    super('favorites');
  }

  // Obtener favoritos de un usuario con información de la película
  async getFavoritesByUserId(userId) {
    const { data, error } = await require('../config/supabase').supabase
      .from(this.tableName)
      .select(`
        id,
        created_at,
        movies (
          id,
          nombre,
          sinopsis,
          genero,
          director,
          anio_lanzamiento,
          imagen_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Verificar si una película es favorita del usuario
  async isFavorite(userId, movieId) {
    const favorite = await this.findOneBy({
      user_id: userId,
      movie_id: movieId
    });
    return !!favorite;
  }

  // Agregar a favoritos
  async addFavorite(userId, movieId) {
    return await this.create({
      user_id: userId,
      movie_id: movieId
    });
  }

  // Remover de favoritos
  async removeFavorite(userId, movieId) {
    const { data, error } = await require('../config/supabase').supabase
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new FavoritesDAO();