import express from 'express';
import CommentsController from '../controllers/CommentsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes (GET only)
router.get('/', CommentsController.getAllComments);

// Specific routes MUST come before generic /:id route
router.get('/movie/:movieId', CommentsController.getCommentsByMovie);
router.get('/user/:userId', CommentsController.getCommentsByUser);

// Generic ID route comes after specific routes
router.get('/:id', CommentsController.getCommentById);

// Protected routes (require authentication)
router.post('/', authenticateToken, CommentsController.createComment);
router.put('/:id', authenticateToken, CommentsController.updateComment);
router.delete('/:id', authenticateToken, CommentsController.deleteComment);

export default router;