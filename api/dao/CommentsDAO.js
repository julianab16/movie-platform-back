import GlobalDAO from './GlobalDAO.js';
import { supabase } from '../config/supabase.js';

class CommentsDAO extends GlobalDAO {
  constructor() {
    super('comments');
  }

  // Get comments by movie ID with user information
  async getByMovieId(movieId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          contenido,
          fecha_comentario,
          created_at,
          updated_at,
          users!usuario_id (
            id,
            nombres,
            apellidos
          ),
          movies!pelicula_id (
            id,
            nombre
          )
        `)
        .eq('pelicula_id', movieId)
        .order('fecha_comentario', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comments by movie:', error);
      throw error;
    }
  }

  // Get comments by user ID with movie information
  async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          contenido,
          fecha_comentario,
          created_at,
          updated_at,
          users!usuario_id (
            id,
            nombres,
            apellidos
          ),
          movies!pelicula_id (
            id,
            nombre
          )
        `)
        .eq('usuario_id', userId)
        .order('fecha_comentario', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comments by user:', error);
      throw error;
    }
  }

  // Create comment with automatic date
  async create(commentData) {
    const commentWithDate = {
      ...commentData,
      fecha_comentario: new Date().toISOString()
    };
    return await super.create(commentWithDate);
  }

  // Get comment with user and movie information
  async getByIdWithDetails(id) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          contenido,
          fecha_comentario,
          created_at,
          updated_at,
          users!usuario_id (
            id,
            nombres,
            apellidos
          ),
          movies!pelicula_id (
            id,
            nombre
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comment with details:', error);
      throw error;
    }
  }

  // Check if user can edit/delete comment (is owner)
  async isCommentOwner(commentId, userId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('usuario_id')
        .eq('id', commentId)
        .single();

      if (error) throw error;
      return data && data.usuario_id === userId;
    } catch (error) {
      console.error('Error checking comment ownership:', error);
      return false;
    }
  }

  // Get all comments with pagination
  async getAllWithPagination(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          id,
          contenido,
          fecha_comentario,
          created_at,
          updated_at,
          users!usuario_id (
            id,
            nombres,
            apellidos
          ),
          movies!pelicula_id (
            id,
            nombre
          )
        `, { count: 'exact' })
        .order('fecha_comentario', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        comments: data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching comments with pagination:', error);
      throw error;
    }
  }
}

export default new CommentsDAO();