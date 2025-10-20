import GlobalController from './GlobalController.js';
import MoviesDAO from '../dao/MoviesDAO.js';
import PexelsDAO from '../dao/PexelsDAO.js';
class MoviesController extends GlobalController {
  constructor() {
    super(MoviesDAO);
  }

  // Method to get movies by genre
  getByGenero = async (req, res) => {
    try {
      const { genero } = req.params;
      if (!genero) return res.status(400).json({ success: false, message: 'Falta el parámetro genero' });

      const movies = await PexelsDAO.getMoviesByGenre(genero); // // this.dao to PexelsDAO
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
      if (!nombre) return res.status(400).json({ success: false, message: 'Falta el parámetro nombre' });

      const movies = await PexelsDAO.searchMoviesByName(nombre); // this.dao to PexelsDAO
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