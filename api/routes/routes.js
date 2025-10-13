const express = require("express");
const userRoutes = require("./userRoutes");
const moviesRoutes = require("./moviesRoutes");
const favoritesRoutes = require("./favoritesRoutes");
const commentsRoutes = require("./commentsRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/movies", moviesRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/comments", commentsRoutes);

module.exports = router;
