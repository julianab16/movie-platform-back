import express from 'express';
const router = express.Router();

import MoviesController from '../controllers/MoviesController.js';

// Basic CRUD routes for movies
router.get("/", (req, res) => MoviesController.getAll(req, res));
router.get("/:id", (req, res) => MoviesController.read(req, res));
router.post("/", (req, res) => MoviesController.create(req, res));
router.put("/:id", (req, res) => MoviesController.update(req, res));
router.delete("/:id", (req, res) => MoviesController.delete(req, res));

// Specific routes for movies
router.get("/genero/:genero", (req, res) => MoviesController.getByGenero(req, res));
router.get("/search/:nombre", (req, res) => MoviesController.searchByNombre(req, res));

export default router;