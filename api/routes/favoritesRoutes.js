/**
 * @fileoverview Rutas para gestión de películas favoritas
 * Maneja todas las rutas relacionadas con favoritos de usuarios
 * 
 * @module routes/favoritesRoutes
 * @since 1.0.0
 */

import express from 'express';
import FavoritesController from '../controllers/FavoritesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas de favoritos
router.use(authenticateToken);

/**
 * GET /api/favorites
 * Obtener todas las películas favoritas del usuario autenticado
 * Requiere: Token JWT válido
 * Response: Array de películas favoritas
 */
router.get('/', FavoritesController.getUserFavorites);

/**
 * POST /api/favorites
 * Agregar una película a favoritos
 * Requiere: Token JWT válido + datos de la película
 * Body: { movieId, movieTitle, moviePosterUrl?, movieReleaseDate?, movieRating?, movieGenre? }
 */
router.post('/', FavoritesController.addToFavorites);

/**
 * GET /api/favorites/stats
 * Obtener estadísticas de favoritos del usuario
 * Requiere: Token JWT válido
 * Response: { totalFavorites, genreDistribution, recentFavorites }
 */
router.get('/stats', FavoritesController.getFavoritesStats);

/**
 * GET /api/favorites/check/:movieId
 * Verificar si una película específica está en favoritos
 * Requiere: Token JWT válido + movieId en params
 * Response: { isFavorite: boolean, addedAt?: string }
 */
router.get('/check/:movieId', FavoritesController.checkIfFavorite);

/**
 * DELETE /api/favorites/:movieId
 * Remover una película específica de favoritos
 * Requiere: Token JWT válido + movieId en params
 */
router.delete('/:movieId', FavoritesController.removeFromFavorites);

/**
 * DELETE /api/favorites
 * Limpiar todos los favoritos del usuario (acción destructiva)
 * Requiere: Token JWT válido
 * Response: { deletedCount: number }
 */
router.delete('/', FavoritesController.clearAllFavorites);

export default router;