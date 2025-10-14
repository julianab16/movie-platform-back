const { supabase } = require("../config/supabase");
const GlobalController = require("./GlobalController");
const UserDAO = require("../dao/UserDAO");
const bcrypt = require('bcryptjs');


class UserController extends GlobalController {
  constructor() {
    super(UserDAO);
  }

  // GET /users/me - Get authenticated user profile
  async getProfile(req, res) {
     try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ success: false, message: "ID de usuario no encontrado en el token" });
    }

    return res.status(200).json({
      success: true,
      message: "Usuario autenticado correctamente",
      user: data.user
    });

  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
  }

  // PUT /users/v1/me - Update authenticated user profile
async updateProfile(req, res) {
  try {
    // Obtener ID del usuario autenticado desde el token o middleware
    let userId = req.user?.id || req.user?.userId || req.user?._id;
    const authHeader = req.headers.authorization;

    if ((!userId || userId === "undefined") && authHeader) {
      const token = authHeader.split(" ")[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ success: false, message: "Token inválido" });
      }
      userId = user.id;
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: "Usuario no autenticado" });
    }

    const { nombres, apellidos, edad, correo, contrasena, confirmacion } = req.body;

    // 1️⃣ No permitir modificar el correo
    if (correo !== undefined) {
      return res.status(400).json({ success: false, message: "El correo no se puede modificar" });
    }

    // 2️⃣ Validar que haya al menos un campo editable
    if (!nombres && !apellidos && !edad && !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Debes proporcionar al menos un campo a actualizar"
      });
    }

    const updateData = {};

    if (nombres) updateData.nombres = nombres;
    if (apellidos) updateData.apellidos = apellidos;

    // 3️⃣ Validar edad
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

    // 4️⃣ Validar y encriptar contraseña si se envía
    if (contrasena) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(contrasena)) {
        return res.status(400).json({
          success: false,
          message:
            "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y número"
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
    const userCheck = await supabase
  .from('users')
  .select('id, correo')
  .eq('id', userId)
  .maybeSingle();

console.log('DEBUG búsqueda previa del usuario:', userCheck);

    // 5️⃣ Actualizar en la base de datos
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      
      .update(updateData)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado o no autorizado"
      });
    }

    // 6️⃣ Respuesta final
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
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}



// Eliminar cuenta (con contraseña y confirmación)
// DELETE /users/me - Eliminar cuenta del usuario autenticado
async deleteAccount(req, res) {
  try {
    console.log("=== DEBUG DELETE ACCOUNT ===");

    // 1️⃣ Obtener el token del encabezado Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token no proporcionado",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Formato de token inválido",
      });
    }

    // 2️⃣ Verificar token con Supabase
    const { data: userData, error: tokenError } = await supabase.auth.getUser(token);
    if (tokenError || !userData?.user) {
      console.error("Error verificando token:", tokenError);
      return res.status(401).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    const userId = userData.user.id;
    console.log("✅ Usuario autenticado:", userId);

    // 3️⃣ Extraer datos del cuerpo
    const { password, confirmText } = req.body;
    if (!password || !confirmText) {
      return res.status(400).json({
        success: false,
        message: "Contraseña y confirmación son requeridas",
      });
    }

    if (confirmText !== "ELIMINAR") {
      return res.status(400).json({
        success: false,
        message: "Debe escribir 'ELIMINAR' para confirmar",
      });
    }

    // 4️⃣ Obtener usuario desde el DAO
    const user = await this.dao.getById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // 5️⃣ Verificar contraseña
    const isValidPassword = await this.dao.comparePassword(password, user.contrasena);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
    }

    // 6️⃣ Eliminar usuario en la tabla `users`
    const deletedUser = await this.dao.delete(userId);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado o ya eliminado",
      });
    }

    console.log("✅ Usuario eliminado en la base de datos:", userId);

    // 7️⃣ Eliminar usuario también de Supabase Auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Error eliminando en Supabase Auth:", deleteAuthError);
    }

    res.status(204).send(); // No Content → éxito sin cuerpo

  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
}


 // POST /users/register - Registrar nuevo usuario
  async registerUser(req, res) {
  try {
    const { nombres, apellidos, edad, correo, contrasena } = req.body;

    // Validación básica
    if (!nombres || !apellidos || !edad || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    // Validación de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: "Formato de correo inválido"
      });
    }

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correo,         // ✅ usar 'correo' como 'email'
      password: contrasena,  // ✅ usar 'contrasena' como 'password'
    });

    if (authError) throw authError;

    // ⚠️ Verificar si el usuario fue creado o está pendiente de verificación
    if (!authData?.user) {
      console.warn("⚠️ Usuario aún no verificado, Supabase no devolvió user.id");
      return res.status(202).json({
        success: true,
        message: "Registro exitoso. Por favor verifica tu correo electrónico para activar la cuenta."
      });
    }

    // Encriptar contraseña antes de guardar en la tabla personalizada
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar datos adicionales en la tabla `users`
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,  // usa el mismo UUID que Supabase Auth
          nombres,
          apellidos,
          edad: parseInt(edad),
          correo,
          contrasena: hashedPassword,
          created_at: new Date()
        }
      ])
      .select();

    if (userError) {
      console.error("Error al insertar en la tabla users:", userError);
      return res.status(500).json({
        success: false,
        message: "No se pudo guardar el usuario en la base de datos",
        details: userError.message
      });
    }

    // Todo salió bien
    res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente",
      message2: "Por favor verifica tu correo electrónico para activar la cuenta.",
      data: userData[0]
    });

  } catch (error) {
    console.error("Error inesperado al registrar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
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

// POST /api/v1/users/login
async loginUser(req, res) {
  try {
    const { correo, contrasena } = req.body;

    // Validación básica
    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: "Correo y contraseña son requeridos",
      });
    }

    // Intentar iniciar sesión en Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasena,
      });


    console.log("Auth Data:", authData);
    console.log("correo:", correo);
    if (authError) {
      console.error("Error en login:", authError);
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas o usuario no encontrado",
      });
    }

    // Extraer datos del usuario autenticado
    const user = authData.user;

    // Buscar los datos adicionales del usuario en la tabla `users`
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("correo", correo)
      .single();

    if (userError) {
      console.error("Error al obtener datos del usuario:", userError);
      return res.status(500).json({
        success: false,
        message: "Error al obtener datos adicionales del usuario",
      });
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado en la base de datos",
      });
    }

    // Devolver datos del usuario y el token de sesión
    res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      user: {
        id: userData.id,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        correo: userData.correo,
        edad: userData.edad,
      },
      session: authData.session, // contiene el access_token, refresh_token, etc.
    });

  } catch (error) {
    console.error("Error general en loginUser:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
}


}

module.exports = new UserController();  