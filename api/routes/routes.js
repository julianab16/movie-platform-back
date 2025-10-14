// api/routes/routes.js
import express from "express";
import userRoutes from "./userRoutes.js";
import moviesRoutes from "./moviesRoutes.js";
import favoritesRoutes from "./favoritesRoutes.js";
import commentsRoutes from "./commentsRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/movies", moviesRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/comments", commentsRoutes);

export default router;
