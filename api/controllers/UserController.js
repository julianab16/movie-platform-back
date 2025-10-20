import { supabaseAdmin as supabase } from '../config/supabase.js';
import GlobalController from './GlobalController.js';
import UserDAO from '../dao/UserDAO.js';
import jwt from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';

// Minimum age policy (use consistently)
const MIN_AGE = 18;

  
function normalizeUserData(user) {
    return {
      id: user.id,
      // Campos en inglés (preferidos por el frontend)
      firstName: user.nombres,
      lastName: user.apellidos,
      email: user.correo,
      age: user.edad,
      // Campos en español (mantener compatibilidad)
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo: user.correo,
      edad: user.edad,
      createdAt: user.created_at || null,
      updatedAt: user.updated_at || null
    };
}
class UserController extends GlobalController {
  constructor() {
    super(UserDAO);
  }

  // GET /users/me - Get authenticated user profile
  async getProfile(req, res) {
    try {
    let userId = req.user?.id || req.user?.userId || req.user?._id;

    if (!userId) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, message: "Token no proporcionado" });
      }
      const token = authHeader.split(" ")[1];
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
          return res.status(401).json({ success: false, message: "ID de usuario no encontrado en el token" });
        }
        userId = data.user.id;
      } catch (err) {
        return res.status(401).json({ success: false, message: "Token inválido" });
      }
    }

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, nombres, apellidos, edad, correo, created_at')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // ✅ DEVOLVER USUARIO NORMALIZADO
    return res.status(200).json({
      success: true,
      message: "Usuario autenticado correctamente",
      data: normalizeUserData(userRecord) // ✅ Aquí está el cambio importante
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

      // Do not allow email modification
      if (correo !== undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "El correo no se puede modificar" 
        });
      }

      // Validate that there is at least one editable field
      if (!nombres && !apellidos && !edad && !contrasena) {
        return res.status(400).json({
          success: false,
          message: "Debes proporcionar al menos un campo a actualizar"
        });
      }

      const updateData = {};

      if (nombres) updateData.nombres = nombres;
      if (apellidos) updateData.apellidos = apellidos;

      // Validate age
      if (edad !== undefined) {
        const numEdad = parseInt(edad);
        if (isNaN(numEdad) || numEdad < MIN_AGE) {
          return res.status(400).json({
            success: false,
            message: `La edad mínima permitida es ${MIN_AGE} años`
          });
        }
        updateData.edad = numEdad;
      }

      // Validate and encrypt password if provided
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

      // Update in the database
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

      // Final response
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

  // DELETE /users/me - Delete account
  async deleteAccount(req, res) {
    try {
      let userId = req.user?.id || req.user?.userId || req.user?._id;
      const { password, confirmText } = req.body || {};

      // If the user is authenticated (token/middleware), allow deletion without password
      if (!userId) {
        // No middleware; require password + confirmation
        if (!password || !confirmText) {
          return res.status(400).json({ success: false, message: "Contraseña y confirmación son requeridas" });
        }

        if (confirmText !== "ELIMINAR") {
          return res.status(400).json({ success: false, message: "Debe escribir 'ELIMINAR' para confirmar" });
        }

        // Find user by some field? In this branch we can't identify the user, so reject
        return res.status(400).json({ success: false, message: 'Usuario no autenticado' });
      }

      // If password provided, verify it. Otherwise assume authenticated user intent.
      if (password) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError || !user) {
          return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const isValidPassword = await bcrypt.compare(password, user.contrasena);
        if (!isValidPassword) {
          return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
      }

      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      // Attempt to remove the user from Supabase Auth as well (best-effort)
      try {
        if (userId) {
          await supabase.auth.admin.deleteUser(userId);
        }
      } catch (authDelErr) {
        logger.warn('USER_CONTROLLER', 'No se pudo eliminar usuario de Auth (no crítico)', { userId, err: authDelErr?.message || authDelErr });
      }

      res.status(200).json({ success: true, message: 'Cuenta eliminada exitosamente' });
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }


  async registerUser(req, res) {
    try {
      // Avoid logging sensitive fields (passwords)
      const safeBody = {
        firstName: req.body.firstName || req.body.nombres,
        lastName: req.body.lastName || req.body.apellidos,
        email: req.body.email || req.body.correo,
        age: req.body.age || req.body.edad
      };
      logger.info('USER_CONTROLLER', 'Iniciando registro de usuario', safeBody);

      const {
        firstName, lastName, age, email, password,
        nombres, apellidos, edad, correo, contrasena
      } = req.body;

      const userData = {
        firstName: firstName || nombres,
        lastName: lastName || apellidos, 
        age: age || edad,
        email: email || correo,
        password: password || contrasena
      };

      if (!userData.firstName || !userData.lastName || !userData.age || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
          message_es: "Todos los campos son requeridos"
        });
      }

      if (userData.age < 18 || userData.age > 120) {
        return res.status(400).json({
          success: false,
          message: "Age must be between 18 and 120",
          message_es: "La edad debe estar entre 18 y 120 años"
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          message_es: "Formato de correo inválido"
        });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(userData.password)) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters with uppercase, lowercase and number",
          message_es: "La contraseña debe tener al menos 8 caracteres con mayúscula, minúscula y número"
        });
      }

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

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) {
        logger.error('USER_CONTROLLER', 'Error en Supabase Auth', { message: authError.message || authError });

        const authMsg = (authError.message || '').toLowerCase();
        if (authMsg.includes('user already registered') || authMsg.includes('user already exists')) {
          return res.status(409).json({ success: false, message: 'User already registered', message_es: 'Usuario ya registrado' });
        }

        return res.status(502).json({ success: false, message: 'Authentication provider error', message_es: 'Error del proveedor de autenticación' });
      }

      if (!authData?.user) {
        return res.status(202).json({
          success: true,
          message: "Registration successful. Please verify your email to activate the account.",
          message_es: "Registro exitoso. Por favor verifica tu correo electrónico para activar la cuenta."
        });
      }

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
        // Try to rollback the auth user to avoid orphaned auth accounts
        try {
          if (authData && authData.user && authData.user.id) {
            await supabase.auth.admin.deleteUser(authData.user.id);
            logger.info('USER_CONTROLLER', 'Auth user rollback successful', { authUserId: authData.user.id });
          }
        } catch (rollbackErr) {
          logger.error('USER_CONTROLLER', 'Rollback failed deleting auth user', rollbackErr);
        }

        throw userError;
      }

      logger.success('USER_CONTROLLER', 'Usuario registrado exitosamente', { 
        userId: newUser.id, 
        email: newUser.correo 
      });

      const token = jwt.generateToken({
        id: newUser.id,
        email: newUser.correo,
        firstName: newUser.nombres,
        lastName: newUser.apellidos
      });

      // ✅ DEVOLVER USUARIO NORMALIZADO
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        message_es: "Usuario registrado exitosamente",
        data: {
          user: normalizeUserData(newUser), // ✅ Aquí está el cambio importante
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

    const {
      email, password,
      correo, contrasena
    } = req.body;

    const loginData = {
      email: email || correo,
      password: password || contrasena
    };

    if (!loginData.email || !loginData.password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        message_es: "Correo y contraseña son requeridos"
      });
    }

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

    const isValidPassword = await bcrypt.compare(loginData.password, user.contrasena);
    if (!isValidPassword) {
      logger.warn('USER_CONTROLLER', 'Contraseña incorrecta', { email: loginData.email });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        message_es: "Credenciales inválidas"
      });
    }

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

    // ✅ DEVOLVER USUARIO NORMALIZADO
    res.status(200).json({
      success: true,
      message: "Login successful",
      message_es: "Inicio de sesión exitoso",
      data: {
        user: normalizeUserData(user), // ✅ Aquí está el cambio importante
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

  // POST /users/forgot-password
  // En api/controllers/UserController.js - método forgotPassword
async forgotPassword(req, res) {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
        message_es: "El correo es requerido"
      });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nombres, correo')
      .eq('correo', correo.toLowerCase())
      .single();

    // ✅ Siempre retornar éxito para evitar enumeración de usuarios
    if (userError || !user) {
      logger.info('USER_CONTROLLER', 'Password reset solicitado para email inexistente', { correo });
      // Esperar un tiempo similar al proceso real
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
        message_es: "Si el correo existe, se ha enviado un enlace de recuperación"
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.deleteByUserId(user.id);
    await PasswordResetToken.create(user.id, hashedToken, expiresAt);

    try {
      // ✅ Intentar enviar el email
      await sendPasswordResetEmail(user.correo, resetToken, user.nombres || 'Usuario');
      logger.success('USER_CONTROLLER', 'Email de recuperación enviado', { userId: user.id });
    } catch (emailError) {
      logger.error('USER_CONTROLLER', 'Error enviando email', emailError);
      // ❌ NO revelar que el usuario existe, pero loguear el error
      return res.status(500).json({
        success: false,
        message: "Error sending reset email. Please try again later.",
        message_es: "Error al enviar el correo. Por favor intenta más tarde."
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
      message_es: "Correo de recuperación enviado exitosamente"
    });

  } catch (error) {
    logger.error('USER_CONTROLLER', 'Error en forgotPassword', error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      message_es: "Error interno del servidor"
    });
  }
}

  // POST /users/reset-password
  async resetPassword(req, res) {
    try {
      const { token, nuevaContrasena } = req.body;

      if (!token || !nuevaContrasena) {
        return res.status(400).json({
          success: false,
          message: "Token and new password are required",
          message_es: "El token y la nueva contraseña son requeridos"
        });
      }

      if (nuevaContrasena.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
          message_es: "La contraseña debe tener al menos 8 caracteres"
        });
      }

      // Hashear el token para comparar con el almacenado
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Consumir token de forma atómica: marcar como usado solo si no está usado y no expiró
      const consumed = await PasswordResetToken.consume(hashedToken);
      if (!consumed || !consumed.user_id) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token",
          message_es: "Token inválido o expirado"
        });
      }

      const userId = consumed.user_id;

      // Obtener usuario
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, correo')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          message_es: "Usuario no encontrado"
        });
      }

      // Hashear nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(nuevaContrasena, salt);

      // Actualizar contraseña en la tabla users
      const { error: updateError } = await supabase
        .from('users')
        .update({ contrasena: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        logger.error('USER_CONTROLLER', 'Error actualizando contraseña', updateError);
        // Nota: el token ya fue consumido; si falla el update quedamos en un estado en el que
        // el token no podrá reutilizarse. Esto es preferible a dejar el token usable.
        return res.status(500).json({
          success: false,
          message: "Error updating password",
          message_es: "Error al actualizar la contraseña"
        });
      }

      // Intentar sincronizar contraseña con Supabase Auth (best-effort)
      try {
        if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.updateUserById === 'function') {
          // Algunas versiones del SDK exponen updateUserById
          await supabase.auth.admin.updateUserById(user.id, { password: nuevaContrasena });
        } else if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.updateUser === 'function') {
          // Alternativa genérica (no siempre disponible)
          await supabase.auth.admin.updateUser(user.id, { password: nuevaContrasena });
        }
      } catch (syncErr) {
        logger.warn('USER_CONTROLLER', 'No se pudo sincronizar contraseña con Supabase Auth (no crítico)', syncErr?.message || syncErr);
      }

      // Invalidate JWT sessions if jwt util provides it (best-effort)
      try {
        if (jwt && typeof jwt.invalidateTokensForUser === 'function') {
          await jwt.invalidateTokensForUser(user.id, 'password_reset');
        }
      } catch (jwtErr) {
        logger.warn('USER_CONTROLLER', 'No se pudieron invalidar sesiones JWT (no crítico)', jwtErr?.message || jwtErr);
      }

      logger.info('USER_CONTROLLER', 'Contraseña restablecida exitosamente', { userId: user.id });

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
        message_es: "Contraseña restablecida exitosamente"
      });

    } catch (error) {
      logger.error('USER_CONTROLLER', 'Error en resetPassword', error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        message_es: "Error interno del servidor"
      });
    }
  }
  
}

export default new UserController();