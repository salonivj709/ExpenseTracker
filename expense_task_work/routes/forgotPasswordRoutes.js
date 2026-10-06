const express = require("express");
const { forgotPassword } = require("../controller/authController");
const router = express.Router();
router.post("/forgotpassword", forgotPassword);
module.exports = router;
