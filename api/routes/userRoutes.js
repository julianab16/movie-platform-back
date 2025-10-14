import express from 'express';
import UserController from '../controllers/UserController.js';

const router = express.Router();

// CRUD básico (heredado de GlobalController)
router.get("/", UserController.getAll);
router.get("/:id", UserController.read);
router.post("/", UserController.create);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);

// Rutas específicas de autenticación
router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.post("/logout", UserController.logoutUser);

// Rutas protegidas (requieren autenticación)
router.get("/me", UserController.getProfile);
router.put("/me", UserController.updateProfile);
router.delete("/me", UserController.deleteAccount);

export default router;
