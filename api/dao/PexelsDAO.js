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
   async getMovieTrailer() {
  try {
    // 1️⃣ Buscar videos populares con temática de películas o trailers
    const response = await pexelsClient.videos.search({
      query: "cinematic trailer",
      per_page: 20, // obtenemos varios para elegir al azar
    });

    const videos = response.videos;
    if (!videos || videos.length === 0) {
      return { success: false, videoUrl: null };
    }

    // 2️⃣ Filtrar videos con formato horizontal (widescreen)
    const widescreenVideos = videos.filter(v => {
      const { width, height } = v.video_files[0] || {};
      return width && height && width / height >= 1.6; // proporción horizontal
    });

    // 3️⃣ Elegir uno al azar entre los resultados filtrados
    const randomVideo = (widescreenVideos.length > 0 ? widescreenVideos : videos)[
      Math.floor(Math.random() * (widescreenVideos.length || videos.length))
    ];

    // 4️⃣ Tomar la mejor calidad disponible (normalmente la última)
    const bestFile = randomVideo.video_files.sort((a, b) => b.width - a.width)[0];

    return {
      success: true,
      videoUrl: bestFile.link,
      photographer: randomVideo.user.name,
      originalLink: randomVideo.url,
    };
  } catch (error) {
    console.error("❌ Error obteniendo video aleatorio de Pexels:", error);
    return { success: false, videoUrl: null };
  }
}


}
export default new PexelsDAO();
