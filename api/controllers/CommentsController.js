import CommentsDAO from '../dao/CommentsDAO.js';
import UserDAO from '../dao/UserDAO.js';
import MoviesDAO from '../dao/MoviesDAO.js';

class CommentsController {
  
  // Create a new comment
  async createComment(req, res) {
    try {
      const { usuario_id, pelicula_id, contenido } = req.body;

      // Validate required fields
      if (!usuario_id || !pelicula_id || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: usuario_id, pelicula_id, contenido'
        });
      }

      // Validate content length
      if (contenido.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Comment content must be at least 3 characters long'
        });
      }

      if (contenido.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comment content cannot exceed 1000 characters'
        });
      }

      // Verify user exists
      const user = await UserDAO.getById(usuario_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify movie exists
      const movie = await MoviesDAO.getById(pelicula_id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }

      const commentData = {
        usuario_id,
        pelicula_id,
        contenido: contenido.trim()
      };

      const newComment = await CommentsDAO.create(commentData);

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: newComment
      });

    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating comment',
        error: error.message
      });
    }
  }

  // Get all comments
  async getAllComments(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Use simple getAll method from GlobalDAO instead of complex pagination
      const allComments = await CommentsDAO.getAll();

      res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: allComments
      });

    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  }

  // Get comment by ID
  async getCommentById(req, res) {
    try {
      const { id } = req.params;

      // Use simple getById method from GlobalDAO
      const comment = await CommentsDAO.getById(id);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Comment retrieved successfully',
        data: comment
      });

    } catch (error) {
      console.error('Error fetching comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comment',
        error: error.message
      });
    }
  }

  // Get comments by movie ID
  async getCommentsByMovie(req, res) {
    try {
      const { movieId } = req.params;

      // Verify movie exists
      const movie = await MoviesDAO.getById(movieId);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }

      const comments = await CommentsDAO.getByMovieId(movieId);

      res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: comments
      });

    } catch (error) {
      console.error('Error fetching comments by movie:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  }

  // Get comments by user ID
  async getCommentsByUser(req, res) {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await UserDAO.getById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const comments = await CommentsDAO.getByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: comments
      });

    } catch (error) {
      console.error('Error fetching comments by user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comments',
        error: error.message
      });
    }
  }

  // Update comment
  async updateComment(req, res) {
    try {
      const { id } = req.params;
      const { contenido, usuario_id } = req.body;

      // Validate content
      if (!contenido) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      if (contenido.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Comment content must be at least 3 characters long'
        });
      }

      if (contenido.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comment content cannot exceed 1000 characters'
        });
      }

      // Check if comment exists
      const existingComment = await CommentsDAO.getById(id);
      if (!existingComment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user is the owner of the comment (if usuario_id is provided)
      if (usuario_id) {
        const isOwner = await CommentsDAO.isCommentOwner(id, usuario_id);
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'You can only edit your own comments'
          });
        }
      }

      const updateData = {
        contenido: contenido.trim()
      };

      const updatedComment = await CommentsDAO.update(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: updatedComment
      });

    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: error.message
      });
    }
  }

  // Delete comment
  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const { usuario_id } = req.body;

      // Check if comment exists
      const existingComment = await CommentsDAO.getById(id);
      if (!existingComment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user is the owner of the comment (if usuario_id is provided)
      if (usuario_id) {
        const isOwner = await CommentsDAO.isCommentOwner(id, usuario_id);
        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'You can only delete your own comments'
          });
        }
      }

      await CommentsDAO.delete(id);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting comment',
        error: error.message
      });
    }
  }
}

export default new CommentsController();