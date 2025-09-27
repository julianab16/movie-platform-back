const Task = require('../models/Movies');
const GlobalDAO = require('./GlobalDAO');

class MoviesDAO extends GlobalDAO {
  constructor() {
    super(Movies);
  }

  // Obtener todas las tareas de un usuario específico
  async getByMoviesId(userId) {
    return await this.model.find({ userId }).sort({ fecha: 1, hora: 1 });
  }

  // Obtener tareas por usuario y estado
  async getByUserIdAndStatus(userId, estado) {
    return await this.model.find({ userId, estado }).sort({ fecha: 1, hora: 1 });
  }

  // Verificar si una tarea pertenece a un usuario
  async isTaskOwner(taskId, userId) {
    const task = await this.model.findOne({ _id: taskId, userId });
    return !!task;
  }
}

module.exports = new MoviesDAO();