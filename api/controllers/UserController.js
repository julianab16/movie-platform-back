const GlobalController = require("./GlobalController");
const UserDAO = require("../dao/UserDAO");


class UserController extends GlobalController {
  constructor() {
    super(UserDAO);
  }

  // GET /users/me - Obtener perfil del usuario autenticado
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
      
      const user = await this.dao.findById(userId);
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

  // PUT /users/me - Actualizar perfil del usuario autenticado
  async updateProfile(req, res) {
    try {
      console.log('=== DEBUG UPDATE PROFILE ===');
      console.log('req.user:', req.user);
      
      const userId = req.user?.id || req.user?.userId || req.user?._id;
      console.log('userId extraído:', userId);
      console.log('tipo de userId:', typeof userId);
      
      const { firstName, lastName, age, email } = req.body;
      console.log('Body recibido:', req.body);

      // Validaciones básicas
      if (!firstName || !lastName || !age || !email) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos"
        });
      }

      // Validar edad mínima
      if (age < 13) {
        return res.status(400).json({
          success: false,
          message: "La edad mínima es 13 años"
        });
      }

      // Validar formato de email (básico)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }

      // Verificar si el email ya está en uso por otro usuario
      const existingUser = await this.dao.findByEmail(email);
      console.log('Usuario existente con email:', existingUser);
      
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(409).json({
          success: false,
          message: "El email ya está registrado por otro usuario"
        });
      }

      // Mapear campos de entrada (inglés) al modelo (español)
      const updateData = {
        nombres: firstName,
        apellidos: lastName,
        edad: parseInt(age),
        correo: email,
        updatedAt: new Date()
      };
      console.log('Datos a actualizar:', updateData);

      const updatedUser = await this.dao.updateById(userId, updateData);
      console.log('Usuario actualizado:', updatedUser);

      if (!updatedUser) {
        console.log('❌ updateById retornó null/undefined');
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      // Mapear respuesta del modelo (español) a inglés
      const response = {
        id: updatedUser._id,
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

  // DELETE /users/me - Eliminar cuenta del usuario autenticado
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

      // Validar que se proporcione la contraseña y confirmación
      if (!password || !confirmText) {
        console.log('❌ Faltan password o confirmText');
        return res.status(400).json({
          success: false,
          message: "Contraseña y confirmación son requeridas"
        });
      }

      // Validar que el texto de confirmación sea correcto
      if (confirmText !== "ELIMINAR") {
        console.log('❌ ConfirmText incorrecto:', confirmText);
        return res.status(400).json({
          success: false,
          message: "Debe escribir 'ELIMINAR' para confirmar"
        });
      }

      // Obtener usuario para verificar contraseña
      const user = await this.dao.findById(userId);
      console.log('Usuario encontrado:', user ? 'SÍ' : 'NO');
      
      if (!user) {
        console.log('❌ Usuario no encontrado');
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      // Verificar contraseña usando el método del modelo
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

      // Eliminar usuario
      console.log('Eliminando usuario...');
      const deleteResult = await this.dao.deleteById(userId);
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

      // Validar campos obligatorios
      if (!nombres || !apellidos || !edad || !correo || !password) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son requeridos"
        });
      }

      // Verificar si el correo ya está registrado
      const existingUser = await this.dao.findByEmail(correo);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "El correo ya está registrado"
        });
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await this.dao.create({
        nombres,
        apellidos,
        edad,
        correo,
        password: hashedPassword,
        createdAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: "Usuario registrado correctamente",
        data: {
          id: newUser._id,
          nombres: newUser.nombres,
          apellidos: newUser.apellidos,
          correo: newUser.correo
        }
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