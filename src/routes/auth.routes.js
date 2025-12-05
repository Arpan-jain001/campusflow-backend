const express = require("express");
const { signup, verifyEmail, login } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);

module.exports = router;
