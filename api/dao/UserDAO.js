const GlobalDAO = require("./GlobalDAO");
const bcrypt = require('bcryptjs');

class UserDAO extends GlobalDAO {
  constructor() {
    super('users');
  }

  // Override create to hash password
  async create(userData) {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(userData.contrasena, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    
    const userWithHashedPassword = {
      ...userData,
      contrasena: hashedPassword
    };
    
    return await super.create(userWithHashedPassword);
  }

  // Method to find user by email
  async findByEmail(email) {
    return await this.findOneBy({ correo: email });
  }

  // Method to verify password
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Method to increment login attempts
  async incrementLoginAttempts(userId) {
    const user = await this.getById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    const lockTimeMinutes = parseInt(process.env.LOCK_TIME_MINUTES) || 10;
    
    const newAttempts = (user.login_attempts || 0) + 1;
    const updateData = {
      login_attempts: newAttempts
    };

    // If max attempts reached, lock account
    if (newAttempts >= maxAttempts) {
      updateData.lock_until = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
      updateData.is_locked = true;
    }

    return await this.update(userId, updateData);
  }

  // Method to reset login attempts
  async resetLoginAttempts(userId) {
    return await this.update(userId, {
      login_attempts: 0,
      lock_until: null,
      is_locked: false,
      last_login: new Date()
    });
  }
}

module.exports = new UserDAO();