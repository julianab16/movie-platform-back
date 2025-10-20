import { pexelsClient } from '../config/pexelsClient.js';

class PexelsDAO {
  async searchMoviesByName(nombre) {
    const data = await pexelsClient.videos.search({ query: nombre, per_page: 10 });
    return data.videos;
  }

  async getMoviesByGenre(genero) {
    const data = await pexelsClient.videos.search({ query: genero, per_page: 10 });
    return data.videos;
  }

  async getPopularMovies() {
    const data = await pexelsClient.videos.popular({ per_page: 10 });
    return data.videos;
  }
}

export default new PexelsDAO();
