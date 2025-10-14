import GlobalDAO from './GlobalDAO.js';
import { supabase } from '../config/supabase.js';

class MoviesDAO extends GlobalDAO {
  constructor() {
    super('movies');
  }

  // Method to find movies by genre
  async findByGenero(genero) {
    return await this.findBy({ genero });
  }

  // Method to search movies by name (partial search)
  async searchByNombre(nombre) {
  const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

export default new MoviesDAO();