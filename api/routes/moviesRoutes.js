import express from "express";
import MoviesController from "../controllers/MoviesController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes (GET only)
router.get("/", (req, res) => MoviesController.getAll(req, res));

// Specific routes MUST come before generic /:id route
router.get("/genero/:genero", (req, res) => MoviesController.getByGenero(req, res));
router.get("/search/:nombre", (req, res) => MoviesController.searchByNombre(req, res));

// Generic ID route comes after specific routes
router.get("/:id", (req, res) => MoviesController.read(req, res));

// Protected routes (require authentication)
router.post("/", authenticateToken, (req, res) => MoviesController.create(req, res));
router.put("/:id", authenticateToken, (req, res) => MoviesController.update(req, res));
router.delete("/:id", authenticateToken, (req, res) => MoviesController.delete(req, res));

export default router;