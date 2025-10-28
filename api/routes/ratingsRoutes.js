import express from 'express';
import RatingsController from '../controllers/RatingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create or update a rating (protected)
router.post('/', authenticateToken, RatingsController.createOrUpdate);

// Get average by tmdb id (public)
router.get('/average', RatingsController.getAverageByTmdb);

// Get average for pelicula id
router.get('/pelicula/:id/average', RatingsController.getAverageByPelicula);

// Get user's rating for a movie (protected)
router.get('/user', authenticateToken, RatingsController.getUserRating);

// Delete a user's rating for a movie (protected)
router.delete('/', authenticateToken, RatingsController.deleteRating);

export default router;
