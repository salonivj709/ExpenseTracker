const express = require("express");

const authController =
    require("../controller/authController");

const router = express.Router();


// Signup

router.post(
    "/signup",
    authController.signup
);


// Login

router.post(
    "/login",
    authController.login
);


module.exports = router;