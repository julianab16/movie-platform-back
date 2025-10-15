import express from 'express';
import UserController from '../controllers/UserController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get("/", UserController.getAll);
router.post("/", UserController.create);

// Authentication routes (public)
router.post("/register", UserController.registerUser);
router.post("/login", UserController.loginUser);
router.post("/logout", authenticateToken, UserController.logoutUser);

// Password recovery routes (public)
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password", UserController.resetPassword);

// Protected routes (require authentication)
router.get("/me", authenticateToken, UserController.getProfile);
router.put("/me", authenticateToken, UserController.updateProfile);
router.delete("/me", authenticateToken, UserController.deleteAccount);

// Public route to get user by id (should be before :id with auth)
router.get("/:id", UserController.read);

// Protected CRUD operations
router.put("/:id", authenticateToken, UserController.update);
router.delete("/:id", authenticateToken, UserController.delete);

export default router;
