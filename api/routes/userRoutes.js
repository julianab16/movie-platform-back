const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");

router.get("/", (req, res) => UserController.getAll(req, res));
router.get("/:id", (req, res) => UserController.read(req, res));
router.post("/", (req, res) => UserController.create(req, res));
router.put("/:id", (req, res) => UserController.update(req, res));
router.delete("/:id", (req, res) => UserController.delete(req, res));


module.exports = router;
