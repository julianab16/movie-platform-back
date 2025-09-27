const User = require("../models/User");
const GlobalDAO = require("./GlobalDAO");

class UserDAO extends GlobalDAO{
  constructor() {
    super(User);
  }

  // Método para buscar usuario por id
  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      console.error("Error al buscar usuario por id:", error);
      throw error;
    }
  }

  // Método para buscar usuario por email
  async findByEmail(email) {
    try {
      return await this.model.findOne({ correo: email });
    } catch (error) {
      console.error("Error al buscar usuario por email:", error);
      throw error;
    }
  }

  // Método para actualizar usuario
  async updateById(id, updateData) {
    try {
      return await this.model.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      console.error("Error al actualizar usuario por id:", error);
      throw error;
    }
  }

  // Método para eliminar usuario
  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error al eliminar usuario por id:", error);
      throw error;
    }
  }
}

module.exports = new UserDAO();