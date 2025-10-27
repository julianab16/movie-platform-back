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
   async getMovieTrailer(movieTitle) {
  try {
    const response = await pexelsClient.videos.search({
      query: `${movieTitle} trailer`,
      per_page: 1,
    });

    if (response.videos.length > 0) {
      return {
        success: true,
        videoUrl: response.videos[0].video_files[0].link,
      };
    }

    return { success: false, videoUrl: null };
  } catch (error) {
    console.error('❌ Error consultando Pexels:', error);
    return { success: false, videoUrl: null };
  }
}

}
export default new PexelsDAO();
