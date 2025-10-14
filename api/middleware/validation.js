import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Validations for registration
const validateRegister = [
  body('nombres')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nombres debe tener al menos 2 caracteres'),
  
  body('apellidos')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Apellidos debe tener al menos 2 caracteres'),
  
  body('edad')
    .isInt({ min: 18, max: 120 })
    .withMessage('Edad debe ser entre 18 y 120 años'),
  
  body('correo')
  .isEmail()
  .withMessage('Correo electrónico inválido')
  .customSanitizer(value => (typeof value === 'string' ? value.toLowerCase() : value)),
  
  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Contraseña debe contener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'),
  
  body('confirmarContrasena')
    .custom((value, { req }) => {
      if (value !== req.body.contrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

// Validations for login
const validateLogin = [
  body('correo')
    .isEmail()
    .withMessage('Correo electrónico inválido')
    .customSanitizer(value => value.toLowerCase()), // Only lowercase
  
  body('contrasena')
    .notEmpty()
    .withMessage('Contraseña es requerida')
];

// Validations for password reset
const validatePasswordResetRequest = [
  body('correo')
    .isEmail()
    .withMessage('Correo electrónico inválido')
    .customSanitizer(value => value.toLowerCase()) // Only lowercase
];

const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Token es requerido')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token inválido'),
    
  body('nuevaContrasena')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Contraseña debe contener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial'),
    
  body('confirmarContrasena')
    .custom((value, { req }) => {
      if (value !== req.body.nuevaContrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

export default {
  validateRequest,
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset
};