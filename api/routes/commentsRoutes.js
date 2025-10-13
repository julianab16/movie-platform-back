const express = require('express');
const router = express.Router();
const CommentsController = require('../controllers/CommentsController');

// Create a new comment
router.post('/', CommentsController.createComment);

// Get all comments (with pagination)
router.get('/', CommentsController.getAllComments);

// Get comment by ID
router.get('/:id', CommentsController.getCommentById);

// Get comments by movie ID
router.get('/movie/:movieId', CommentsController.getCommentsByMovie);

// Get comments by user ID
router.get('/user/:userId', CommentsController.getCommentsByUser);

// Update comment
router.put('/:id', CommentsController.updateComment);

// Delete comment
router.delete('/:id', CommentsController.deleteComment);

module.exports = router;