import { tmdbClient } from '../config/TmdbClient.js';

class TmdbDAO {
  //  Buscar películas por nombre
  async searchMoviesByName(nombre, language = 'es-ES') {
    const { data } = await tmdbClient.get('/search/movie', {
      params: { query: nombre, language, page: 1 },
    });
    return data.results;
  }

  //  Obtener películas por género
  async getMoviesByGenre(genreId, language = 'es-ES', limit = 10) {
    const { data } = await tmdbClient.get('/discover/movie', {
      params: {
        with_genres: genreId,
        language,
        page: 1,
      },
    });
    return data.results.slice(0, limit);
  }

  //  Obtener todos los géneros
  async getGenres(language = 'es-ES') {
    const { data } = await tmdbClient.get('/genre/movie/list', {
      params: { language },
    });
    return data.genres;
  }

  // Películas populares
  async getPopularMovies(language = 'es-ES', limit = 10) {
    const { data } = await tmdbClient.get('/movie/popular', {
      params: { language, page: 1 },
    });
    return data.results.slice(0, limit);
  }
}

export default new TmdbDAO();
