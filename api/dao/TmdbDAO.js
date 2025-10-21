import { tmdbClient } from "../config/TmdbClient.js";

class TmdbDAO {
  constructor() {
    this.baseImageUrl = "https://image.tmdb.org/t/p/w500";
  }

  /**
   * 🔹 Obtener todas las películas populares (para getAll)
   * Mapea los resultados de TMDb al formato esperado por tu controlador.
   */
  async getAll(language = "es-ES", limit = 10) {
    const { data } = await tmdbClient.get("/movie/popular", {
      params: { language, page: 1 },
    });

    return data.results.slice(0, limit).map(this._mapMovieData);
  }

  /**
   * 🔹 Obtener películas por género (para /genero/:genero)
   * TMDb usa IDs numéricos de género. Este método acepta nombre o ID.
   */
  async getMoviesByGenre(genero, language = "es-ES", limit = 10) {
  // ✅ recibe "genero" desde el controlador
  console.log("📺 Género recibido:", genero);
  const genresRes = await tmdbClient.get("/genre/movie/list", { params: { language } });
  const genres = genresRes.data.genres;

  // ✅ usa el mismo nombre de parámetro
  const match = genres.find(
    g => g.name.toLowerCase() === genero.toLowerCase()
  );

  if (!match) throw new Error(`Género "${genero}" no encontrado en TMDb`);

  const { data } = await tmdbClient.get("/discover/movie", {
    params: { with_genres: match.id, language, page: 1 },
  });

  return data.results.slice(0, limit).map(this._mapMovieData);
}


  /**
   * 🔹 Buscar películas por nombre (para /search/:nombre)
   */
  async searchMoviesByName(name, language = "es-ES", limit = 10) {
    const { data } = await tmdbClient.get("/search/movie", {
      params: { query: name, language, page: 1 },
    });

    return data.results.slice(0, limit).map(this._mapMovieData);
  }

  /**
   * 🔹 Leer película por ID (para /:id)
   */
  async getById(id, language = "es-ES") {
    const { data } = await tmdbClient.get(`/movie/${id}`, {
      params: { language },
    });
    return this._mapMovieData(data);
  }

  /**
   * 🔒 Métodos CRUD no aplicables en TMDb (se pueden usar en Supabase si mezclas ambos)
   */
  async create() {
    throw new Error("TMDb es una API de solo lectura, no permite crear películas.");
  }

  async update() {
    throw new Error("TMDb es una API de solo lectura, no permite actualizar películas.");
  }

  async delete() {
    throw new Error("TMDb es una API de solo lectura, no permite eliminar películas.");
  }

  /**
   * Formateador interno para homogeneizar los datos.
   */
  _mapMovieData = (movie) => ({
    id: movie.id,
    nombre: movie.title || movie.name,
    sinopsis: movie.overview,
    genero_ids: movie.genre_ids,
    fecha_lanzamiento: movie.release_date,
    calificacion: movie.vote_average,
    imagen_url: movie.poster_path
      ? `${this.baseImageUrl}${movie.poster_path}`
      : null,
  });
}

export default new TmdbDAO();
