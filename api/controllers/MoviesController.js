import GlobalController from './GlobalController.js';
import MoviesDAO from '../dao/MoviesDAO.js';

class MoviesController extends GlobalController {
  constructor() {
    super(MoviesDAO);
  }

  // Method to get movies by genre
  getByGenero = async (req, res) => {
    try {
      const { genero } = req.params;
      const movies = await this.dao.findByGenero(genero);
      res.status(200).json({
        success: true,
        data: movies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener películas por género',
        error: error.message
      });
    }
  };

  // Method to search movies by name
  searchByNombre = async (req, res) => {
    try {
      const { nombre } = req.params;
      const movies = await this.dao.searchByNombre(nombre);
      res.status(200).json({
        success: true,
        data: movies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al buscar películas',
        error: error.message
      });
    }
  };
}

export default new MoviesController();