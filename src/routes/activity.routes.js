const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  getMyActivity,
  createSystemActivity,
} = require("../controllers/activity.controller");

const router = express.Router();

router.use(auth);

// Student ke लिए apna feed
router.get("/", getMyActivity);

// Admin per-student system activity
router.post("/system", createSystemActivity);

module.exports = router;
