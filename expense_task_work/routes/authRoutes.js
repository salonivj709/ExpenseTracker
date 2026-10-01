const express = require("express");
const authController = require("../controller/authController");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
