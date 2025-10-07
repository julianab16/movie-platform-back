const GlobalDAO = require("./GlobalDAO");
const bcrypt = require('bcryptjs');

class UserDAO extends GlobalDAO {
  constructor() {
    super('users');
  }

  // Override create para hashear contraseña
  async create(userData) {
    // Hash password antes de guardar
    const hashedPassword = await bcrypt.hash(userData.contrasena, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    
    const userWithHashedPassword = {
      ...userData,
      contrasena: hashedPassword
    };
    
    return await super.create(userWithHashedPassword);
  }

  // Método para buscar usuario por email
  async findByEmail(email) {
    return await this.findOneBy({ correo: email });
  }

  // Método para actualizar usuario por ID
  async updateById(id, updateData) {
    return await this.update(id, updateData);
  }

  // Método para eliminar usuario por ID
  async deleteById(id) {
    return await this.delete(id);
  }

  // Método para verificar contraseña
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Método para incrementar intentos de login
  async incrementLoginAttempts(userId) {
    const user = await this.getById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    const lockTimeMinutes = parseInt(process.env.LOCK_TIME_MINUTES) || 10;
    
    const newAttempts = (user.login_attempts || 0) + 1;
    const updateData = {
      login_attempts: newAttempts
    };

    // Si alcanza el máximo, bloquear cuenta
    if (newAttempts >= maxAttempts) {
      updateData.lock_until = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
      updateData.is_locked = true;
    }

    return await this.updateById(userId, updateData);
  }

  // Método para resetear intentos de login
  async resetLoginAttempts(userId) {
    return await this.updateById(userId, {
      login_attempts: 0,
      lock_until: null,
      is_locked: false,
      last_login: new Date()
    });
  }
}

module.exports = new UserDAO();