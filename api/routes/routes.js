import express from "express";
import userRoutes from "./userRoutes.js";
import moviesRoutes from "./moviesRoutes.js";
import favoritesRoutes from "./favoritesRoutes.js";
import commentsRoutes from "./commentsRoutes.js";
import ratingsRoutes from "./ratingsRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/movies", moviesRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/comments", commentsRoutes);
router.use("/ratings", ratingsRoutes);

export default router;
