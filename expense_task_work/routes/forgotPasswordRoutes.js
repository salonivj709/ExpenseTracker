const express = require("express");
const {
    forgotPassword,
    validatePasswordReset,
    resetPassword
} = require("../controller/authController");

const router = express.Router();

router.post("/forgotpassword", forgotPassword);
router.get("/resetpassword/:id", validatePasswordReset);
router.post("/resetpassword/:id", resetPassword);

module.exports = router;
