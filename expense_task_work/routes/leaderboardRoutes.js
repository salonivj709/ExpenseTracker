const express = require("express");
const authenticate = require("../middleware/auth");
const leaderboardController = require("../controller/leaderboardController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    leaderboardController.getLeaderboard
);

module.exports = router;
