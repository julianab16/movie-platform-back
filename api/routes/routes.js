const express = require("express");
const userRoutes = require("./userRoutes");
const moviesRoutes = require("./moviesRoutes");
const favoritesRoutes = require("./favoritesRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/movies", moviesRoutes);
router.use("/favorites", favoritesRoutes);

module.exports = router;
