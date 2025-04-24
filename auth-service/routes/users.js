/**
 * User routes
 */
const express = require("express")
const { body } = require("express-validator")
const userController = require("../controllers/userController")
const validateRequest = require("../middleware/validateRequest")

const router = express.Router()

// Get current user profile
router.get("/me", userController.getCurrentUser)

// Update user profile
router.put(
  "/me",
  [
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Username must be between 3 and 50 characters"),
    body("full_name").optional().trim(),
    body("bio").optional().trim(),
    validateRequest,
  ],
  userController.updateProfile,
)

// Change password
router.put(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
    validateRequest,
  ],
  userController.changePassword,
)

// Get user by ID
router.get("/:id", userController.getUserById)

// Search users
router.get("/", userController.searchUsers)

module.exports = router
