const GlobalDAO = require('./GlobalDAO');

class MoviesDAO extends GlobalDAO {
  constructor() {
    super('movies');
  }

  // Método para buscar películas por género
  async findByGenero(genero) {
    return await this.findBy({ genero });
  }

  // Método para buscar películas por nombre (búsqueda parcial)
  async searchByNombre(nombre) {
    const { data, error } = await require('../config/supabase').supabase
      .from(this.tableName)
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

module.exports = new MoviesDAO();