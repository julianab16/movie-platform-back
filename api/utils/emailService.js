import nodemailer from 'nodemailer';
import logger from './logger.js';

const createTransporter = () => {
  // Validar variables de entorno requeridas
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.error('EMAIL', 'Variables de entorno EMAIL_USER y EMAIL_PASSWORD son requeridas');
    throw new Error('Email configuration missing');
  }

  const config = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Configuración adicional para debugging
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };

  // Solo agregar TLS en desarrollo o si está explícitamente habilitado
  if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_TLS_ALLOW_SELF_SIGNED === 'true') {
    config.tls = { 
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2' // Versión mínima de TLS
    };
  }

  try {
    const transporter = nodemailer.createTransport(config);
    
    // ✅ VERIFICAR CONEXIÓN AL INICIAR
    transporter.verify((error, success) => {
      if (error) {
        logger.error('EMAIL', 'Error en configuración de email', error);
      } else {
        logger.success('EMAIL', 'Servidor de email listo para enviar mensajes');
      }
    });

    return transporter;
  } catch (error) {
    logger.error('EMAIL', 'Error creando transporter', error);
    throw error;
  }
};

const transporter = createTransporter();

/**
 * Enviar email de recuperación de contraseña
 */
export const sendPasswordResetEmail = async (to, resetToken, userName) => {
  try {
    // Validación de entrada
    if (!to || !resetToken || !userName) {
      throw new Error('Parámetros faltantes: to, resetToken, userName son requeridos');
    }

    // Construir URL de reset
    const frontendBase = (process.env.FRONTEND_URL || 'https://samfilms-client.vercel.app').replace(/\/$/, '');
    let resetUrlString;
    
    try {
      const url = new URL('/restablecer-contrasena', frontendBase);
      url.searchParams.set('token', resetToken);
      resetUrlString = url.toString();
    } catch (err) {
      logger.warn('EMAIL', 'Error construyendo URL, usando fallback', err);
      resetUrlString = `${frontendBase}/restablecer-contrasena?token=${encodeURIComponent(resetToken)}`;
    }

    // Configurar email
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: {
        name: 'SamFilms - Recuperación de Contraseña',
        address: fromAddress
      },
      to,
      subject: '🔐 Recuperación de Contraseña - SamFilms',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .button-restablecer { text-align: center; margin: 0; padding: 0; }
            .button-restablecer .button { display:inline-block; padding:15px 28px; background:#667eea; color:#ffffff !important; text-decoration:none !important; border-radius:5px; font-weight:bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 SamFilms</h1>
              <p>Recuperación de Contraseña</p>
            </div>
            <div class="content">
              <h2>Hola ${userName},</h2>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en SamFilms.</p>
              <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
              
              <div class="button-restablecer" style="text-align: center;">
                <a href="${resetUrlString}" class="button">
                  Restablecer Contraseña
                </a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este enlace expirará en <strong>1 hora</strong></li>
                  <li>Solo puedes usarlo <strong>una vez</strong></li>
                  <li>Si no solicitaste este cambio, ignora este correo</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 12px;">
                ${resetUrlString}
              </p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas.</p>
              <p>&copy; ${new Date().getFullYear()} SamFilms. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hola ${userName},

Hemos recibido una solicitud para restablecer tu contraseña en SamFilms.

Para restablecer tu contraseña, visita el siguiente enlace:
${resetUrlString}

⚠️ Este enlace expirará en 1 hora y solo puede usarse una vez.

Si no solicitaste este cambio, ignora este correo.

---
SamFilms - ${new Date().getFullYear()}
Este es un correo automático, por favor no respondas.
      `
    };

    // ✅ ENVIAR EMAIL CON MANEJO DE ERRORES MEJORADO
    logger.info('EMAIL', `Intentando enviar email a: ${to}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.success('EMAIL', 'Email enviado exitosamente', { 
      to, 
      messageId: info.messageId,
      response: info.response 
    });
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    logger.error('EMAIL', 'Error enviando email de recuperación', {
      to,
      error: error.message,
      code: error.code,
      command: error.command
    });
    
    // Proporcionar mensajes de error más específicos
    let errorMessage = 'Error enviando email';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Error de autenticación. Verifica EMAIL_USER y EMAIL_PASSWORD';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'No se pudo conectar al servidor de email';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout al conectar con el servidor de email';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Función para probar la configuración de email
 */
export const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    logger.success('EMAIL', 'Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    logger.error('EMAIL', 'Error en configuración de email', error);
    return false;
  }
};

export default {
  sendPasswordResetEmail,
  testEmailConfiguration
};