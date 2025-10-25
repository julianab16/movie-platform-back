import CommentsDAO from '../dao/CommentsDAO.js';
import UserDAO from '../dao/UserDAO.js';
import MoviesDAO from '../dao/MoviesDAO.js';

class CommentsController {
  
  // Create a new comment
  async createComment(req, res) {
    try {
      // Prefer usuario from authenticated token, fallback to body
      const usuario_id = req.user?.id || req.body.usuario_id;
      const { pelicula_id, tmdb_id, contenido } = req.body;

      // Validate required fields: must have usuario and either pelicula_id or tmdb_id
      if (!usuario_id || (!pelicula_id && !tmdb_id) || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: usuario_id, (pelicula_id or tmdb_id), contenido'
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


      // Decide which movie identifier to use: UUID (pelicula_id) or external tmdb_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const numericRegex = /^[0-9]+$/;

      const commentData = {
        usuario_id,
        contenido: contenido.trim()
      };

      // If we received an internal UUID, verify the movie exists and use it
      if (pelicula_id && uuidRegex.test(String(pelicula_id))) {
        const movie = await MoviesDAO.getById(pelicula_id);
        if (!movie) {
          return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        commentData.pelicula_id = pelicula_id;
      } else {
        // If pelicula_id is numeric (frontend sometimes sends TMDb id in pelicula_id) prefer tmdb id
        const tmdbToUse = (numericRegex.test(String(pelicula_id)) ? Number(pelicula_id) : (tmdb_id ? Number(tmdb_id) : null));
        if (!tmdbToUse) {
          return res.status(400).json({ success: false, message: 'Missing pelicula_id or tmdb_id' });
        }

        // Try to resolve TMDb id to internal movie UUID
        const movie = await MoviesDAO.getByTmdbId(tmdbToUse);
        if (!movie) {
          // Minimal approach: if movie not found, return 400 so frontend or migration can decide to register movie first
          return res.status(400).json({ success: false, message: `Movie with tmdb_id ${tmdbToUse} is not registered` });
        }
        commentData.pelicula_id = movie.id;
      }

      const newComment = await CommentsDAO.create(commentData);

      // Return the comment with user details
      const created = await CommentsDAO.getByIdWithDetails(newComment.id);

      res.status(201).json({ success: true, data: created });

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

      // CommentsDAO knows how to handle either internal UUID (pelicula_id) or numeric TMDb id (tmdb_id)
      const comments = await CommentsDAO.getByMovieId(movieId);

      return res.status(200).json({ success: true, data: comments || [] });

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

      // Only the owner (from token or provided usuario_id) can edit
      const editorId = req.user?.id || usuario_id;
      const isOwner = await CommentsDAO.isCommentOwner(id, editorId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own comments'
        });
      }

      const updateData = {
        contenido: contenido.trim()
      };

      // mark as edited
      updateData.editado = true;

      const updatedComment = await CommentsDAO.update(id, updateData);

      const updatedWithDetails = await CommentsDAO.getByIdWithDetails(id);

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: updatedWithDetails
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
      // Prefer authenticated user id
      const actorId = req.user?.id || req.body?.usuario_id;

      // Check if comment exists
      const existingComment = await CommentsDAO.getById(id);
      if (!existingComment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      // Verify ownership: only the comment owner can delete
      const isOwner = await CommentsDAO.isCommentOwner(id, actorId);
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
      }

      const deleted = await CommentsDAO.delete(id);

      res.status(200).json({ success: true, message: 'Comment deleted successfully', data: deleted });

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