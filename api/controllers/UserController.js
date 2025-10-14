import { supabase } from '../config/supabase.js';
import GlobalController from './GlobalController.js';
import UserDAO from '../dao/UserDAO.js';
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
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ 
          success: false, 
          message: "Token no proporcionado" 
        });
      }

      const token = authHeader.split(" ")[1];
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({ 
          success: false, 
          message: "ID de usuario no encontrado en el token" 
        });
      }

      return res.status(200).json({
        success: true,
        message: "Usuario autenticado correctamente",
        user: data.user
      });

    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  // PUT /users/me - Update authenticated user profile
  async updateProfile(req, res) {
    try {
      let userId = req.user?.id || req.user?.userId || req.user?._id;
      const authHeader = req.headers.authorization;

      if ((!userId || userId === "undefined") && authHeader) {
        const token = authHeader.split(" ")[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json({ 
            success: false, 
            message: "Token inválido" 
          });
        }
        userId = user.id;
      }

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuario no autenticado" 
        });
      }

      const { nombres, apellidos, edad, correo, contrasena, confirmacion } = req.body;

      // No permitir modificar el correo
      if (correo !== undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "El correo no se puede modificar" 
        });
      }

      // Validar que haya al menos un campo editable
      if (!nombres && !apellidos && !edad && !contrasena) {
        return res.status(400).json({
          success: false,
          message: "Debes proporcionar al menos un campo a actualizar"
        });
      }

      const updateData = {};

      if (nombres) updateData.nombres = nombres;
      if (apellidos) updateData.apellidos = apellidos;

      // Validar edad
      if (edad !== undefined) {
        const numEdad = parseInt(edad);
        if (isNaN(numEdad) || numEdad < 13) {
          return res.status(400).json({
            success: false,
            message: "La edad mínima permitida es 13 años"
          });
        }
        updateData.edad = numEdad;
      }

      // Validar y encriptar contraseña si se envía
      if (contrasena) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(contrasena)) {
          return res.status(400).json({
            success: false,
            message: "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y número"
          });
        }
        if (confirmacion && contrasena !== confirmacion) {
          return res.status(400).json({
            success: false,
            message: "La confirmación de contraseña no coincide"
          });
        }

        const hash = await bcrypt.hash(contrasena, 10);
        updateData.contrasena = hash;
      }

      updateData.updated_at = new Date().toISOString();

      // Actualizar en la base de datos
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado o no autorizado"
        });
      }

      // Respuesta final
      res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: {
          id: updatedUser.id,
          nombres: updatedUser.nombres,
          apellidos: updatedUser.apellidos,
          edad: updatedUser.edad,
          correo: updatedUser.correo,
          updatedAt: updatedUser.updated_at
        }
      });
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

    // 4️⃣ Validar y encriptar contraseña si se envía
    
if (contrasena) {
  // Evitar hashear una contraseña que ya está hasheada
  const looksHashed = /^\$2[aby]\$/.test(contrasena);

  if (!looksHashed) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(contrasena)) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y número",
      });
    }
    if (confirmacion && contrasena !== confirmacion) {
      return res.status(400).json({
        success: false,
        message: "La confirmación de contraseña no coincide",
      });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    updateData.contrasena = hash;
  } else {
    console.log("⚠️ Contraseña ya hasheada, no se vuelve a hashear.");
  }
}
// Actualizar contraseña también en Supabase Auth
const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
  password: contrasena
});

if (authUpdateError) {
  console.error("Error al actualizar contraseña en Supabase Auth:", authUpdateError);
  return res.status(500).json({
    success: false,
    message: "No se pudo actualizar la contraseña en Supabase Auth"
  });
}


    updateData.updated_at = new Date().toISOString();
    const userCheck = await supabase
  .from('users')
  .select('id, correo')
  .eq('id', userId)
  .maybeSingle();
  // DELETE /users/me - Delete account
  async deleteAccount(req, res) {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?._id;
      const { password, confirmText } = req.body;

      if (!password || !confirmText) {
        return res.status(400).json({ 
          success: false, 
          message: "Contraseña y confirmación son requeridas" 
        });
      }

      if (confirmText !== "ELIMINAR") {
        return res.status(400).json({ 
          success: false, 
          message: "Debe escribir 'ELIMINAR' para confirmar" 
        });
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuario no encontrado" 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.contrasena);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: "Contraseña incorrecta" 
        });
      }

      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

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

      // Password strength validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(userData.password)) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters with uppercase, lowercase and number",
          message_es: "La contraseña debe tener al menos 8 caracteres con mayúscula, minúscula y número"
        });
      }

      // Check if user already exists in Supabase
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, correo')
        .eq('correo', userData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
          message_es: "Ya existe un usuario con este correo"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Register user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        logger.error('USER_CONTROLLER', 'Error en Supabase Auth', authError);
        throw authError;
      }

      if (!authData?.user) {
        return res.status(202).json({
          success: true,
          message: "Registration successful. Please verify your email to activate the account.",
          message_es: "Registro exitoso. Por favor verifica tu correo electrónico para activar la cuenta."
        });
      }

      // Insert user data in custom users table
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id,
            nombres: userData.firstName,
            apellidos: userData.lastName,
            edad: parseInt(userData.age),
            correo: userData.email,
            contrasena: hashedPassword,
            created_at: new Date()
          }
        ])
        .select()
        .single();

      if (userError) {
        logger.error('USER_CONTROLLER', 'Error insertando usuario', userError);
        throw userError;
      }

      logger.success('USER_CONTROLLER', 'Usuario registrado exitosamente', { 
        userId: newUser.id, 
        email: newUser.correo 
      });

      // Generate JWT token
      const token = jwt.generateToken({
        id: newUser.id,
        email: newUser.correo,
        firstName: newUser.nombres,
        lastName: newUser.apellidos
      });

      // Return success response with token
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        message_es: "Usuario registrado exitosamente",
        data: {
          user: {
            id: newUser.id,
            firstName: newUser.nombres,
            lastName: newUser.apellidos,
            age: newUser.edad,
            email: newUser.correo,
            createdAt: newUser.created_at
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

  // GET /users - Get all users
  async getAllUsers(req, res) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, nombres, apellidos, edad, correo, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      // Find user by email in Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('correo', loginData.email)
        .single();

      if (userError || !user) {
        logger.warn('USER_CONTROLLER', 'Usuario no encontrado', { email: loginData.email });
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
          message_es: "Credenciales inválidas"
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.contrasena);
      if (!isValidPassword) {
        logger.warn('USER_CONTROLLER', 'Contraseña incorrecta', { email: loginData.email });
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
          message_es: "Credenciales inválidas"
        });
      }

      // Generate JWT token
      const token = jwt.generateToken({
        id: user.id,
        email: user.correo,
        firstName: user.nombres,
        lastName: user.apellidos
      });

      logger.success('USER_CONTROLLER', 'Login exitoso', { 
        userId: user.id, 
        email: user.correo 
      });

      // Return success response
      res.status(200).json({
        success: true,
        message: "Login successful",
        message_es: "Inicio de sesión exitoso",
        data: {
          user: {
            id: user.id,
            firstName: user.nombres,
            lastName: user.apellidos,
            age: user.edad,
            email: user.correo
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

  // POST /users/logout - User logout
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
// POST /api/v1/users/logout
async logoutUser(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó el token de autorización"
      });
    }

    // Extraer token (formato: Bearer <token>)
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Formato de token inválido"
      });
    }

    // Cerrar sesión usando Supabase Auth
    const { error } = await supabase.auth.signOut(token);

    if (error) {
      console.error("Error al cerrar sesión:", error);
      return res.status(500).json({
        success: false,
        message: "Error al cerrar sesión"
      });
    }

    res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente"
    });
  } catch (error) {
    console.error("Error general en logoutUser:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
}

export default new UserController();