const express = require("express");
const router = express.Router();

const FavoritesDAO = require("../dao/FavoritesDAO");

// GET /api/v1/favorites/user/:userId - Get user's favorites
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await FavoritesDAO.getFavoritesByUserId(userId);
    
    res.status(200).json({
      success: true,
      data: favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos',
      error: error.message
    });
  }
});

// POST /api/v1/favorites - Add to favorites
router.post("/", async (req, res) => {
  try {
    const { user_id, movie_id } = req.body;
    
    if (!user_id || !movie_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y movie_id son requeridos'
      });
    }

    // Check if it's already a favorite
    const isFavorite = await FavoritesDAO.isFavorite(user_id, movie_id);
    if (isFavorite) {
      return res.status(409).json({
        success: false,
        message: 'La película ya está en favoritos'
      });
    }

    const favorite = await FavoritesDAO.addFavorite(user_id, movie_id);
    
    res.status(201).json({
      success: true,
      message: 'Película agregada a favoritos',
      data: favorite
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar a favoritos',
      error: error.message
    });
  }
});

// DELETE /api/v1/favorites - Remove from favorites
router.delete("/", async (req, res) => {
  try {
    const { user_id, movie_id } = req.body;
    
    if (!user_id || !movie_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y movie_id son requeridos'
      });
    }

    const removed = await FavoritesDAO.removeFavorite(user_id, movie_id);
    
    res.status(200).json({
      success: true,
      message: 'Película removida de favoritos',
      data: removed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al remover de favoritos',
      error: error.message
    });
  }
});

// GET /api/v1/favorites/check - Check if it's favorite
router.get("/check", async (req, res) => {
  try {
    const { user_id, movie_id } = req.query;
    
    if (!user_id || !movie_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y movie_id son requeridos como query parameters'
      });
    }

    const isFavorite = await FavoritesDAO.isFavorite(user_id, movie_id);
    
    res.status(200).json({
      success: true,
      data: {
        is_favorite: isFavorite
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar favorito',
      error: error.message
    });
  }
});

module.exports = router;