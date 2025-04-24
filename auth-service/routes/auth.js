/**
 * Authentication routes
 */
const express = require("express")
const { body } = require("express-validator")
const authController = require("../controllers/authController")
const validateRequest = require("../middleware/validateRequest")

const router = express.Router()

// Register a new user
router.post(
  "/register",
  [
    body("username").trim().isLength({ min: 3, max: 50 }).withMessage("Username must be between 3 and 50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    validateRequest,
  ],
  authController.register,
)

// Login user
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  authController.login,
)

// Refresh token
router.post("/refresh-token", authController.refreshToken)

// Logout user
router.post("/logout", authController.logout)

module.exports = router
