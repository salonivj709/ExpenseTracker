const express = require("express");

const paymentController =
    require("../controller/paymentController");

const authenticate =
    require("../middleware/auth");

const router = express.Router();

router.post(
    "/create-order",
    authenticate,
    paymentController.createPremiumOrder
);

router.get(
    "/verify/:orderId",
    authenticate,
    paymentController.verifyPayment
);

module.exports = router;
