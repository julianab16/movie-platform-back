const { supabase } = require("../config/supabase");
const GlobalController = require("./GlobalController");
const UserDAO = require("../dao/UserDAO");


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

 // POST /users/register - Registrar nuevo usuario
  async registerUser(req, res) {
    try {
      const { nombres, apellidos, edad, correo, password } = req.body;

      if (!nombres || !apellidos || !edad || !correo || !password) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos"
        });
      }

      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password,
      });

      if (authError) {
        console.error("Error de Supabase Auth:", authError);
        return res.status(400).json({
          success: false,
          message: authError.message
        });
      }

      // Guardar datos adicionales en la tabla `users`
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            id_auth: authData.user.id, // Relación con Supabase Auth
            nombres,
            apellidos,
            edad,
            correo,
            created_at: new Date()
          }
        ])
        .select();

      if (userError) {
        console.error("Error al insertar en users:", userError);
        return res.status(500).json({
          success: false,
          message: "No se pudo guardar el usuario en la base de datos"
        });
      }

      res.status(201).json({
        success: true,
        message: "Usuario registrado correctamente",
        data: userData[0]
      });

    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  // GET /users - Obtener todos los usuarios
  async getAllUsers(req, res) {
    try {
      const users = await this.dao.findAll();
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

}

module.exports = new UserController();  