import GlobalController from './GlobalController.js';
import MoviesDAO from '../dao/MoviesDAO.js';
import PexelsDAO from '../dao/PexelsDAO.js';
import TmdbDAO from '../dao/TmdbDAO.js';
class MoviesController extends GlobalController {
  constructor() {
    super(TmdbDAO);
  }

  // Method to get movies by genre
  getByGenero = async (req, res) => {
    try {
      const { genero } = req.params;
      if (!genero) return res.status(400).json({ success: false, message: 'Falta el parámetro genero' });

      const movies = await TmdbDAO.getMoviesByGenre(genero); // // this.dao to PexelsDAO
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

      const movies = await TmdbDAO.searchMoviesByName(nombre); // this.dao to PexelsDAO
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
  getMovieTrailer = async (req, res) => {
  try {
    const { id:movieId } = req.params;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: "Falta el parámetro movieId",
      });
    }

    // 🔹 Paso 1: obtener nombre desde TMDb
    const movieData = await TmdbDAO.getById(movieId);
    if (!movieData || !movieData.nombre) {
      throw new Error("No se pudo obtener la película desde TMDb");
    }

    // 🔹 Paso 2: buscar video en Pexels con ese nombre
   const trailerResult = await PexelsDAO.getMovieTrailer(movieData.title);

    if (!trailerResult.success || !trailerResult.videoUrl) {
      return res.status(404).json({
        success: false,
        message: "No se encontró tráiler relacionado en Pexels",
      });
    }
    // 🔹 OK
    return res.status(200).json({
      success: true,
      data: trailerResult.videoUrl,
    });
  } catch (error) {
    console.error("Error al obtener el tráiler:", error.message);
    res.status(500).json({
      success: false,
      message: "Error al obtener el tráiler de la película",
      error: error.message,
    });
  }
};

}
export default new MoviesController();