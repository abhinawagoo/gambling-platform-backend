// routes/betRoutes.js
const express = require("express");
const betController = require("../controllers/betController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);
router.get("/games", betController.getGames);

router.post("/", betController.placeBet);
router.get("/", betController.getUserBets);

module.exports = router;
