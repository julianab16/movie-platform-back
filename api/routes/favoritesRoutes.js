/**
 * @fileoverview Routes for managing favorite movies
 * Handles all routes related to user favorites
 * 
 * @module routes/favoritesRoutes
 * @since 1.0.0
 */

import express from 'express';
import FavoritesController from '../controllers/FavoritesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Authentication middleware for all favorites routes
router.use(authenticateToken);

/**
 * GET /api/favorites
 * Get all favorite movies of authenticated user
 * Requires: Valid JWT token
 * Response: Array of favorite movies
 */
router.get('/', FavoritesController.getUserFavorites);

/**
 * POST /api/favorites
 * Add a movie to favorites
 * Requires: Valid JWT token + movie data
 * Body: { movieId, movieTitle, moviePosterUrl?, movieReleaseDate?, movieRating?, movieGenre? }
 */
router.post('/', FavoritesController.addToFavorites);

/**
 * GET /api/favorites/stats
 * Get user favorites statistics
 * Requires: Valid JWT token
 * Response: { totalFavorites, genreDistribution, recentFavorites }
 */
router.get('/stats', FavoritesController.getFavoritesStats);

/**
 * GET /api/favorites/check/:movieId
 * Check if a specific movie is in favorites
 * Requires: Valid JWT token + movieId in params
 * Response: { isFavorite: boolean, addedAt?: string }
 */
router.get('/check/:movieId', FavoritesController.checkIfFavorite);

/**
 * DELETE /api/favorites/:movieId
 * Remove a specific movie from favorites
 * Requires: Valid JWT token + movieId in params
 */
router.delete('/:movieId', FavoritesController.removeFromFavorites);

/**
 * DELETE /api/favorites
 * Clear all user favorites (destructive action)
 * Requires: Valid JWT token
 * Response: { deletedCount: number }
 */
router.delete('/', FavoritesController.clearAllFavorites);

export default router;