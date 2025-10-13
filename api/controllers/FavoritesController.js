/**
 * @fileoverview Controlador para gestión de películas favoritas
 * Maneja operaciones CRUD para favoritos de usuarios
 * 
 * @module controllers/FavoritesController
 * @since 1.0.0
 */

import FavoritesDAO from '../dao/FavoritesDAO.js';
import logger from '../utils/logger.js';

class FavoritesController {
  
  /**
   * GET /api/favorites - Obtener todas las películas favoritas del usuario autenticado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getUserFavorites(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          message_es: "Usuario no autenticado"
        });
      }

      logger.info('FAVORITES_CONTROLLER', 'Obteniendo favoritos del usuario', { userId });

      // Obtener favoritos usando el DAO
      const favorites = await FavoritesDAO.getFavoritesByUserId(userId);

      logger.success('FAVORITES_CONTROLLER', 'Favoritos obtenidos exitosamente', { 
        userId, 
        count: favorites?.length || 0 
      });

      res.status(200).json({
        success: true,
        count: favorites?.length || 0,
        data: favorites || [],
        message: "Favorites retrieved successfully",
        message_es: "Favoritos obtenidos exitosamente"
      });

    } catch (error) {
      logger.error('FAVORITES_CONTROLLER', 'Error inesperado al obtener favoritos', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }

  /**
   * POST /api/favorites - Agregar película a favoritos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async addToFavorites(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          message_es: "Usuario no autenticado"
        });
      }

      const {
        movieId,
        movieTitle,
        moviePosterUrl,
        movieReleaseDate,
        movieRating,
        movieGenre,
        // Support Spanish field names as fallback
        movie_id,
        movie_title,
        movie_poster_url,
        movie_release_date,
        movie_rating,
        movie_genre
      } = req.body;

      // Map fields (English preferred with Spanish fallback)
      const movieData = {
        movieId: movieId || movie_id,
        movieTitle: movieTitle || movie_title,
        moviePosterUrl: moviePosterUrl || movie_poster_url,
        movieReleaseDate: movieReleaseDate || movie_release_date,
        movieRating: movieRating || movie_rating,
        movieGenre: movieGenre || movie_genre
      };

      // Validation
      if (!movieData.movieId || !movieData.movieTitle) {
        return res.status(400).json({
          success: false,
          message: "Movie ID and title are required",
          message_es: "ID y título de la película son requeridos"
        });
      }

      logger.info('FAVORITES_CONTROLLER', 'Agregando película a favoritos', { 
        userId, 
        movieId: movieData.movieId,
        movieTitle: movieData.movieTitle 
      });

      // Check if movie is already in favorites
      const { data: existingFavorite, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movieData.movieId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        logger.error('FAVORITES_CONTROLLER', 'Error verificando favorito existente', checkError);
        return res.status(500).json({
          success: false,
          message: "Error checking existing favorite",
          message_es: "Error verificando favorito existente"
        });
      }

      if (existingFavorite) {
        return res.status(409).json({
          success: false,
          message: "Movie already in favorites",
          message_es: "La película ya está en favoritos"
        });
      }

      // Add to favorites
      const { data: newFavorite, error: insertError } = await supabase
        .from('favorites')
        .insert([{
          user_id: userId,
          movie_id: movieData.movieId,
          movie_title: movieData.movieTitle,
          movie_poster_url: movieData.moviePosterUrl,
          movie_release_date: movieData.movieReleaseDate,
          movie_rating: movieData.movieRating,
          movie_genre: movieData.movieGenre,
          added_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        logger.error('FAVORITES_CONTROLLER', 'Error agregando a favoritos', insertError);
        return res.status(500).json({
          success: false,
          message: "Error adding to favorites",
          message_es: "Error agregando a favoritos"
        });
      }

      logger.success('FAVORITES_CONTROLLER', 'Película agregada a favoritos', { 
        userId, 
        favoriteId: newFavorite.id,
        movieTitle: movieData.movieTitle 
      });

      res.status(201).json({
        success: true,
        data: newFavorite,
        message: "Movie added to favorites successfully",
        message_es: "Película agregada a favoritos exitosamente"
      });

    } catch (error) {
      logger.error('FAVORITES_CONTROLLER', 'Error inesperado agregando favorito', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }

  /**
   * DELETE /api/favorites/:movieId - Remover película de favoritos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async removeFromFavorites(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const { movieId } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          message_es: "Usuario no autenticado"
        });
      }

      if (!movieId) {
        return res.status(400).json({
          success: false,
          message: "Movie ID is required",
          message_es: "ID de película es requerido"
        });
      }

      logger.info('FAVORITES_CONTROLLER', 'Removiendo película de favoritos', { 
        userId, 
        movieId 
      });

      // Check if favorite exists
      const { data: existingFavorite, error: checkError } = await supabase
        .from('favorites')
        .select('id, movie_title')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: "Movie not found in favorites",
            message_es: "Película no encontrada en favoritos"
          });
        }
        
        logger.error('FAVORITES_CONTROLLER', 'Error verificando favorito', checkError);
        return res.status(500).json({
          success: false,
          message: "Error checking favorite",
          message_es: "Error verificando favorito"
        });
      }

      // Remove from favorites
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId);

      if (deleteError) {
        logger.error('FAVORITES_CONTROLLER', 'Error removiendo favorito', deleteError);
        return res.status(500).json({
          success: false,
          message: "Error removing from favorites",
          message_es: "Error removiendo de favoritos"
        });
      }

      logger.success('FAVORITES_CONTROLLER', 'Película removida de favoritos', { 
        userId, 
        movieId,
        movieTitle: existingFavorite.movie_title 
      });

      res.status(200).json({
        success: true,
        message: "Movie removed from favorites successfully",
        message_es: "Película removida de favoritos exitosamente"
      });

    } catch (error) {
      logger.error('FAVORITES_CONTROLLER', 'Error inesperado removiendo favorito', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }

  /**
   * GET /api/favorites/check/:movieId - Verificar si película está en favoritos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async checkIfFavorite(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      const { movieId } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          message_es: "Usuario no autenticado"
        });
      }

      if (!movieId) {
        return res.status(400).json({
          success: false,
          message: "Movie ID is required",
          message_es: "ID de película es requerido"
        });
      }

      logger.info('FAVORITES_CONTROLLER', 'Verificando si película es favorita', { 
        userId, 
        movieId 
      });

      // Check if movie is in favorites
      const { data: favorite, error } = await supabase
        .from('favorites')
        .select('id, added_at')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('FAVORITES_CONTROLLER', 'Error verificando favorito', error);
        return res.status(500).json({
          success: false,
          message: "Error checking favorite status",
          message_es: "Error verificando estado de favorito"
        });
      }

      const isFavorite = !!favorite;

      logger.info('FAVORITES_CONTROLLER', 'Verificación completada', { 
        userId, 
        movieId, 
        isFavorite 
      });

      res.status(200).json({
        success: true,
        data: {
          isFavorite,
          addedAt: favorite?.added_at || null
        },
        message: "Favorite status retrieved successfully",
        message_es: "Estado de favorito obtenido exitosamente"
      });

    } catch (error) {
      logger.error('FAVORITES_CONTROLLER', 'Error inesperado verificando favorito', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }

  /**
   * GET /api/favorites/stats - Obtener estadísticas de favoritos del usuario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getFavoritesStats(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          message_es: "Usuario no autenticado"
        });
      }

      logger.info('FAVORITES_CONTROLLER', 'Obteniendo estadísticas de favoritos', { userId });

      // Get total count
      const { count: totalFavorites, error: countError } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (countError) {
        logger.error('FAVORITES_CONTROLLER', 'Error obteniendo conteo', countError);
        return res.status(500).json({
          success: false,
          message: "Error retrieving favorites stats",
          message_es: "Error obteniendo estadísticas de favoritos"
        });
      }

      // Get genres distribution
      const { data: genresData, error: genresError } = await supabase
        .from('favorites')
        .select('movie_genre')
        .eq('user_id', userId);

      if (genresError) {
        logger.error('FAVORITES_CONTROLLER', 'Error obteniendo géneros', genresError);
        return res.status(500).json({
          success: false,
          message: "Error retrieving genres stats",
          message_es: "Error obteniendo estadísticas de géneros"
        });
      }

      // Process genres
      const genreCounts = {};
      genresData?.forEach(item => {
        if (item.movie_genre) {
          const genres = Array.isArray(item.movie_genre) 
            ? item.movie_genre 
            : item.movie_genre.split(',').map(g => g.trim());
          
          genres.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }
      });

      // Get recent favorites
      const { data: recentFavorites, error: recentError } = await supabase
        .from('favorites')
        .select('movie_title, added_at')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })
        .limit(5);

      if (recentError) {
        logger.warn('FAVORITES_CONTROLLER', 'Error obteniendo favoritos recientes', recentError);
      }

      const stats = {
        totalFavorites: totalFavorites || 0,
        genreDistribution: genreCounts,
        recentFavorites: recentFavorites || [],
        lastUpdated: new Date().toISOString()
      };

      logger.success('FAVORITES_CONTROLLER', 'Estadísticas obtenidas exitosamente', { 
        userId, 
        totalFavorites: stats.totalFavorites 
      });

      res.status(200).json({
        success: true,
        data: stats,
        message: "Favorites statistics retrieved successfully",
        message_es: "Estadísticas de favoritos obtenidas exitosamente"
      });

    } catch (error) {
      logger.error('FAVORITES_CONTROLLER', 'Error inesperado obteniendo estadísticas', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }

  /**
   * DELETE /api/favorites - Limpiar todos los favoritos del usuario
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async clearAllFavorites(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          message_es: "Usuario no autenticado"
        });
      }

      logger.warn('FAVORITES_CONTROLLER', 'Limpiando todos los favoritos', { userId });

      // Get count before deletion for confirmation
      const { count: totalBefore, error: countError } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (countError) {
        logger.error('FAVORITES_CONTROLLER', 'Error obteniendo conteo', countError);
        return res.status(500).json({
          success: false,
          message: "Error counting favorites",
          message_es: "Error contando favoritos"
        });
      }

      if (!totalBefore || totalBefore === 0) {
        return res.status(200).json({
          success: true,
          message: "No favorites to clear",
          message_es: "No hay favoritos que limpiar",
          data: { deletedCount: 0 }
        });
      }

      // Delete all favorites for user
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('FAVORITES_CONTROLLER', 'Error limpiando favoritos', deleteError);
        return res.status(500).json({
          success: false,
          message: "Error clearing favorites",
          message_es: "Error limpiando favoritos"
        });
      }

      logger.success('FAVORITES_CONTROLLER', 'Todos los favoritos limpiados', { 
        userId, 
        deletedCount: totalBefore 
      });

      res.status(200).json({
        success: true,
        message: "All favorites cleared successfully",
        message_es: "Todos los favoritos limpiados exitosamente",
        data: { deletedCount: totalBefore }
      });

    } catch (error) {
      logger.error('FAVORITES_CONTROLLER', 'Error inesperado limpiando favoritos', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }
}

export default new FavoritesController();
