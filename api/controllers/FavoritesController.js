/**
 * @fileoverview Controller for managing favorite movies
 * Handles CRUD operations for user favorites
 * 
 * @module controllers/FavoritesController
 * @since 1.0.0
 */

import FavoritesDAO from '../dao/FavoritesDAO.js';
import logger from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

class FavoritesController {
  
  /**
   * GET /api/favorites - Get all favorite movies of authenticated user
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

      // Get favorites using the DAO
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
        message_es: "Error interno del servidor",
        error: error.message || String(error)
      });
    }
  }

  /**
   * POST /api/favorites - Add movie to favorites
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
        movie_id
      } = req.body;

      // Map fields (English preferred with Spanish fallback)
      const finalMovieId = movieId || movie_id;

      // Validation
      if (!finalMovieId) {
        return res.status(400).json({
          success: false,
          message: "Movie ID is required",
          message_es: "ID de la película es requerido"
        });
      }

      logger.info('FAVORITES_CONTROLLER', 'Agregando película a favoritos', { 
        userId, 
        movieId: finalMovieId
      });

      // Check if movie is already in favorites
      const { data: existingFavorite, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', finalMovieId)
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

      // Add to favorites (only user_id and movie_id)
      const { data: newFavorite, error: insertError } = await supabase
        .from('favorites')
        .insert([{
          user_id: userId,
          movie_id: finalMovieId
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
        movieId: finalMovieId
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
   * DELETE /api/favorites/:movieId - Remove movie from favorites
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
        .select('id')
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
        movieId
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
   * GET /api/favorites/check/:movieId - Check if movie is in favorites
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
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('FAVORITES_CONTROLLER', 'Error verificando favorito', error);
        return res.status(500).json({
          success: false,
            message: "Error checking favorite status",
            message_es: "Error verificando estado de favorito",
            error: error.message || error
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
    addedAt: favorite?.created_at || null
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
   * GET /api/favorites/stats - Get user favorites statistics
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
      const { data: countData, error: countError, count: totalFavorites } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (countError) {
        logger.error('FAVORITES_CONTROLLER', 'Error obteniendo conteo', countError);
        return res.status(500).json({
          success: false,
          message: "Error retrieving favorites stats",
          message_es: "Error obteniendo estadísticas de favoritos"
          , error: countError.message || countError
        });
      }

      // Get genres distribution
        // Build genres distribution and recent favorites by joining movie info
        const { data: favRows, error: favError } = await supabase
          .from('favorites')
          .select('movie_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (favError) {
          logger.error('FAVORITES_CONTROLLER', 'Error obteniendo favoritos para stats', favError);
          return res.status(500).json({
            success: false,
            message: 'Error retrieving favorites for stats',
            message_es: 'Error obteniendo favoritos para estadísticas',
            error: favError.message || String(favError)
          });
        }

        const movieIds = Array.from(new Set((favRows || []).map(r => r.movie_id))).filter(Boolean);

        let moviesData = [];
        if (movieIds.length > 0) {
          const { data: mdata, error: mError } = await supabase
            .from('movies')
            .select('id, nombre, genero')
            .in('id', movieIds);

          if (mError) {
            logger.error('FAVORITES_CONTROLLER', 'Error obteniendo datos de películas', mError);
          } else {
            moviesData = mdata || [];
          }
        }

        const genreCounts = {};
        const recentFavorites = (favRows || []).slice(0, 5).map(f => {
          const m = (moviesData || []).find(x => x.id === f.movie_id) || {};
          if (m.genero) {
            const genres = Array.isArray(m.genero) ? m.genero : String(m.genero).split(',').map(g => g.trim());
            genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
          }
          return {
            movie_id: f.movie_id,
            movie_title: m.nombre || null,
            created_at: f.created_at
          };
        });

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
   * DELETE /api/favorites - Clear all user favorites
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
      const { data: countData, error: countError, count: totalBefore } = await supabase
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
