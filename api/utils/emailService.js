import nodemailer from 'nodemailer';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendPasswordResetEmail = async (to, resetToken, userName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Recuperación de Contraseña - Movie Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Hola ${userName},</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p>O copia este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">
          ⚠️ Este enlace expirará en 1 hora.<br>
          Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    `,
    text: `Hola ${userName},\n\nPara restablecer tu contraseña, visita:\n${resetUrl}\n\nEste enlace expirará en 1 hora.`
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email de recuperación enviado a: ${to}`);
  } catch (error) {
    logger.error('Error enviando email:', error);
    throw error;
  }
};
