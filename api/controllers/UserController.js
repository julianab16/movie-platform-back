import { supabase } from '../config/supabase.js';
import GlobalController from './GlobalController.js';
import UserDAO from '../dao/UserDAO.js';
import User from '../models/User.js';
import jwt from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

class UserController extends GlobalController {
  constructor() {
    super(UserDAO);
  }

  // GET /users/me - Get authenticated user profile
  async getProfile(req, res) {
    try {
      console.log('req.user completo:', req.user); // Debug
      console.log('req.headers:', req.headers.authorization); // Debug
      
      const userId = req.user?.id || req.user?.userId || req.user?._id;
      console.log("Buscando usuario con ID:", userId);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "ID de usuario no encontrado en el token"
        });
      }
      
      const user = await this.dao.getById(userId);
      console.log("Usuario encontrado:", user);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuario no encontrado" 
        });
      }

      const profile = {
        id: user._id,
        firstName: user.nombres,
        lastName: user.apellidos,
        age: user.edad,
        email: user.correo,
        createdAt: user.createdAt
      };

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  // PUT /users/me - Update authenticated user profile
  async updateProfile(req, res) {
    try {
      console.log('=== DEBUG UPDATE PROFILE ===');
      console.log('req.user:', req.user);
      
      const userId = req.user?.id || req.user?.userId || req.user?._id;
      console.log('userId extraído:', userId);
      console.log('tipo de userId:', typeof userId);
      
      const { firstName, lastName, age, email } = req.body;
      console.log('Body recibido:', req.body);

      // Basic validations
      if (!firstName || !lastName || !age || !email) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos"
        });
      }

      // Validate minimum age
      if (age < 13) {
        return res.status(400).json({
          success: false,
          message: "La edad mínima es 13 años"
        });
      }

      // Validate email format (basic)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }

      // Check if email is already in use by another user
      const existingUser = await this.dao.findByEmail(email);
      console.log('Usuario existente con email:', existingUser);
      
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(409).json({
          success: false,
          message: "El email ya está registrado por otro usuario"
        });
      }

      // Map input fields (English) to model (Spanish)
      const updateData = {
        nombres: firstName,
        apellidos: lastName,
        edad: parseInt(age),
        correo: email,
        updatedAt: new Date()
      };
      console.log('Datos a actualizar:', updateData);

      const updatedUser = await this.dao.update(userId, updateData);
      console.log('Usuario actualizado:', updatedUser);

      if (!updatedUser) {
        console.log('❌ update retornó null/undefined');
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      // Map response from model (Spanish) to English
      const response = {
        id: updatedUser.id,
        firstName: updatedUser.nombres,
        lastName: updatedUser.apellidos,
        age: updatedUser.edad,
        email: updatedUser.correo,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      res.status(200).json({
        success: true,
        data: response,
        message: "Perfil actualizado exitosamente"
      });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  // DELETE /users/me - Delete authenticated user account
  async deleteAccount(req, res) {
    try {
      console.log('=== DEBUG DELETE ACCOUNT ===');
      console.log('req.user:', req.user);
      console.log('req.body:', req.body);
      
      const userId = req.user?.id || req.user?.userId || req.user?._id;
      console.log('userId extraído:', userId);
      
      const { password, confirmText } = req.body;
      console.log('Password recibido:', password ? '***' : 'undefined');
      console.log('ConfirmText recibido:', confirmText);

      // Validate that password and confirmation are provided
      if (!password || !confirmText) {
        console.log('❌ Faltan password o confirmText');
        return res.status(400).json({
          success: false,
          message: "Contraseña y confirmación son requeridas"
        });
      }

      // Validate that confirmation text is correct
      if (confirmText !== "ELIMINAR") {
        console.log('❌ ConfirmText incorrecto:', confirmText);
        return res.status(400).json({
          success: false,
          message: "Debe escribir 'ELIMINAR' para confirmar"
        });
      }

      // Get user to verify password
      const user = await this.dao.getById(userId);
      console.log('Usuario encontrado:', user ? 'SÍ' : 'NO');
      
      if (!user) {
        console.log('❌ Usuario no encontrado');
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      // Verify password using model method
      console.log('Verificando contraseña...');
      const isValidPassword = await user.comparePassword(password);
      console.log('Contraseña válida:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ Contraseña incorrecta');
        return res.status(401).json({
          success: false,
          message: "Contraseña incorrecta"
        });
      }

      // Delete user
      console.log('Eliminando usuario...');
      const deleteResult = await this.dao.delete(userId);
      console.log('Resultado eliminación:', deleteResult);

      console.log('✅ Usuario eliminado exitosamente');
      res.status(204).send();
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  // POST /users/register - Register new user
  async registerUser(req, res) {
    try {
      logger.info('USER_CONTROLLER', 'Iniciando registro de usuario', req.body);

      // Support both English and Spanish field names
      const {
        firstName, lastName, age, email, password,
        nombres, apellidos, edad, correo, contrasena
      } = req.body;

      // Map to English (preferred) with Spanish fallback
      const userData = {
        firstName: firstName || nombres,
        lastName: lastName || apellidos, 
        age: age || edad,
        email: email || correo,
        password: password || contrasena
      };

      // Validation
      if (!userData.firstName || !userData.lastName || !userData.age || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
          message_es: "Todos los campos son requeridos"
        });
      }

      // Age validation
      if (userData.age < 18 || userData.age > 120) {
        return res.status(400).json({
          success: false,
          message: "Age must be between 18 and 120",
          message_es: "La edad debe estar entre 18 y 120 años"
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          message_es: "Formato de correo inválido"
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
          message_es: "Ya existe un usuario con este correo"
        });
      }

      // Create new user using User model
      const newUser = new User(userData);
      const savedUser = await newUser.save();

      logger.success('USER_CONTROLLER', 'Usuario registrado exitosamente', { 
        userId: savedUser.id, 
        email: savedUser.email 
      });

      // Generate JWT token
      const token = jwt.generateToken({
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName
      });

      // Return success response with token
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        message_es: "Usuario registrado exitosamente",
        data: {
          user: {
            id: savedUser.id,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            age: savedUser.age,
            email: savedUser.email,
            createdAt: savedUser.createdAt
          },
          token: token
        }
      });

    } catch (error) {
      logger.error('USER_CONTROLLER', 'Error al registrar usuario', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }


  // GET /users - Obtener todos los usuarios
  async getAllUsers(req, res) {
    try {
      const users = await this.dao.getAll();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  // POST /users/login - User authentication
  async loginUser(req, res) {
    try {
      logger.info('USER_CONTROLLER', 'Iniciando login', req.body);

      // Support both English and Spanish field names
      const {
        email, password,
        correo, contrasena
      } = req.body;

      // Map to English (preferred) with Spanish fallback
      const loginData = {
        email: email || correo,
        password: password || contrasena
      };

      // Basic validation
      if (!loginData.email || !loginData.password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
          message_es: "Correo y contraseña son requeridos"
        });
      }

      // Find user by email
      const user = await User.findOne({ email: loginData.email });
      if (!user) {
        logger.warn('USER_CONTROLLER', 'Usuario no encontrado', { email: loginData.email });
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
          message_es: "Credenciales inválidas"
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        const lockTime = Math.ceil((user.lockedUntil - Date.now()) / 1000 / 60);
        logger.warn('USER_CONTROLLER', 'Cuenta bloqueada', { 
          email: loginData.email, 
          lockTime: lockTime 
        });
        
        return res.status(423).json({
          success: false,
          message: `Account locked. Try again in ${lockTime} minutes`,
          message_es: `Cuenta bloqueada. Intente nuevamente en ${lockTime} minutos`
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(loginData.password);
      if (!isValidPassword) {
        // Increment failed attempts
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        
        // Lock account if too many failed attempts
        if (user.failedAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          logger.warn('USER_CONTROLLER', 'Cuenta bloqueada por intentos fallidos', { 
            email: loginData.email, 
            attempts: user.failedAttempts 
          });
        }
        
        await user.save();

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
          message_es: "Credenciales inválidas"
        });
      }

      // Reset failed attempts and update last login
      user.failedAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });

      logger.success('USER_CONTROLLER', 'Login exitoso', { 
        userId: user.id, 
        email: user.email 
      });

      // Return success response
      res.status(200).json({
        success: true,
        message: "Login successful",
        message_es: "Inicio de sesión exitoso",
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age,
            email: user.email,
            lastLogin: user.lastLogin
          },
          token: token
        }
      });

    } catch (error) {
      logger.error('USER_CONTROLLER', 'Error en login', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }

  // POST /users/logout - User logout (invalidate token)
  async logoutUser(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: "No token provided",
          message_es: "Token no proporcionado"
        });
      }

      const userId = req.user?.id || req.user?.userId;
      
      // Invalidate JWT token
      await jwt.invalidateToken(token, userId, 'logout');

      logger.info('USER_CONTROLLER', 'Logout exitoso', { userId });

      res.status(200).json({
        success: true,
        message: "Logout successful",
        message_es: "Cierre de sesión exitoso"
      });

    } catch (error) {
      logger.error('USER_CONTROLLER', 'Error en logout', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }


}

export default new UserController();  