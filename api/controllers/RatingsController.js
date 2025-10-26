import RatingsDAO from '../dao/RatingsDAO.js';
import logger from '../utils/logger.js';

class RatingsController {
  // POST /ratings
  createOrUpdate = async (req, res) => {
    try {
      const usuario = req.user; // set by auth middleware
      if (!usuario || !usuario.userId) return res.status(401).json({ success: false, message: 'Usuario no identificado' });

      let { pelicula_id = null, tmdb_id = null, rating } = req.body;

      // If frontend accidentally sent a numeric TMDb id in `pelicula_id` (as string),
      // convert it to tmdb_id to avoid UUID parsing errors in the DB.
      if (pelicula_id && typeof pelicula_id === 'string' && /^\d+$/.test(pelicula_id)) {
        tmdb_id = Number(pelicula_id);
        pelicula_id = null;
      }

      if (tmdb_id && typeof tmdb_id === 'string' && /^\d+$/.test(String(tmdb_id))) {
        tmdb_id = Number(tmdb_id);
      }

      // Validate rating
      const r = Number(rating);
      if (!r || !Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ success: false, message: 'Rating inválido. Debe ser entero entre 1 y 5' });
      }

      if (!pelicula_id && !tmdb_id) {
        return res.status(400).json({ success: false, message: 'pelicula_id o tmdb_id requerido' });
      }

      const result = await RatingsDAO.upsertRating({
        usuario_id: usuario.userId,
        pelicula_id,
        tmdb_id,
        rating: r
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error('RatingsController.createOrUpdate', error);
      return res.status(500).json({ success: false, message: 'Error al guardar calificación', error: error.message });
    }
  };

  // GET /ratings/average?tmdb_id=xxx  OR /ratings/pelicula/:id/average
  getAverageByTmdb = async (req, res) => {
    try {
      const { tmdb_id } = req.query;
      if (!tmdb_id) return res.status(400).json({ success: false, message: 'tmdb_id requerido' });

      const data = await RatingsDAO.getAverageByTmdbId(Number(tmdb_id));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error('RatingsController.getAverageByTmdb', error);
      return res.status(500).json({ success: false, message: 'Error al obtener promedio', error: error.message });
    }
  };

  getAverageByPelicula = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: 'pelicula id requerido' });

      const data = await RatingsDAO.getAverageByPeliculaId(id);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error('RatingsController.getAverageByPelicula', error);
      return res.status(500).json({ success: false, message: 'Error al obtener promedio', error: error.message });
    }
  };

  // GET /ratings/user?tmdb_id=... or ?pelicula_id=...
  getUserRating = async (req, res) => {
    try {
      const usuario = req.user;
      if (!usuario || !usuario.userId) return res.status(401).json({ success: false, message: 'Usuario no identificado' });

      const { pelicula_id = null, tmdb_id = null } = req.query;
      if (!pelicula_id && !tmdb_id) return res.status(400).json({ success: false, message: 'pelicula_id o tmdb_id requerido' });

      const rating = await RatingsDAO.getUserRating({ usuario_id: usuario.userId, pelicula_id, tmdb_id });
      return res.status(200).json({ success: true, data: rating });
    } catch (error) {
      logger.error('RatingsController.getUserRating', error);
      return res.status(500).json({ success: false, message: 'Error al obtener calificación del usuario', error: error.message });
    }
  };
}

export default new RatingsController();
