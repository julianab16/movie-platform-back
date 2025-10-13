const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

// Rutas públicas
router.post("/register", (req, res) => UserController.registerUser(req, res));
router.post("/login", (req, res) => UserController.loginUser(req, res));
// Rutas protegidas (si luego añades autenticación con token)
router.get("/", (req, res) => UserController.getAllUsers(req, res));
router.get("/me", (req, res) => UserController.getProfile(req, res));
router.put("/me", (req, res) => UserController.updateProfile(req, res));
router.delete("/me", (req, res) => UserController.deleteAccount(req, res));

module.exports = router;
