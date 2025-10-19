import nodemailer from 'nodemailer';
import logger from './logger.js';

// Build transporter options. Allow disabling TLS certificate verification in development
// or when explicitly enabled with EMAIL_TLS_ALLOW_SELF_SIGNED=true
const transporterOptions = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_TLS_ALLOW_SELF_SIGNED === 'true') {
  transporterOptions.tls = { rejectUnauthorized: false };
}

const transporter = nodemailer.createTransport(transporterOptions);

export const sendPasswordResetEmail = async (to, resetToken, userName) => {
  // Normalize FRONTEND_URL and build a safe reset URL
  const frontendBase = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  let resetUrlString;
  try {
    const base = frontendBase || 'https://samfilms-client.vercel.app';
    const url = new URL('/reset-password', base);
    url.searchParams.set('token', resetToken);
    resetUrlString = url.toString();
  } catch (err) {
    // Fallback: construct manually and encode token
    const base = frontendBase || 'https://samfilms-client.vercel.app';
    resetUrlString = `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = {
    from: fromAddress,
    to,
    subject: 'Recuperación de Contraseña - Movie Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Hola ${userName},</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrlString}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p>O copia este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrlString}</p>
        <p style="color: #666; font-size: 14px;">
          ⚠️ Este enlace expirará en 1 hora.<br>
          Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    `,
    text: `Hola ${userName},\n\nPara restablecer tu contraseña, visita:\n${resetUrlString}\n\nEste enlace expirará en 1 hora.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('EMAIL', 'Password reset email sent', { to, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('EMAIL', 'Error sending reset email', { to, error: error?.message || error });
    // Preserve throwing behavior so controller can decide how to respond
    throw error;
  }
};
