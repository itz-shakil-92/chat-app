/**
 * User controller
 */
const bcrypt = require("bcryptjs")
const db = require("../db")

// Get current user profile
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await db("users")
      .where({ id: req.user.id })
      .select("id", "username", "email", "full_name", "profile_picture", "bio", "is_online", "last_seen", "created_at")
      .first()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, full_name, bio } = req.body
    const updateData = {}

    if (username) {
      // Check if username is already taken
      const existingUser = await db("users").where({ username }).whereNot({ id: req.user.id }).first()

      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" })
      }

      updateData.username = username
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (bio !== undefined) updateData.bio = bio

    // Update user
    const [updatedUser] = await db("users")
      .where({ id: req.user.id })
      .update(updateData)
      .returning([
        "id",
        "username",
        "email",
        "full_name",
        "profile_picture",
        "bio",
        "is_online",
        "last_seen",
        "created_at",
      ])

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Get user with password hash
    const user = await db("users").where({ id: req.user.id }).select("password_hash").first()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password
    await db("users").where({ id: req.user.id }).update({ password_hash: hashedPassword })

    res.status(200).json({ message: "Password changed successfully" })
  } catch (error) {
    next(error)
  }
}

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await db("users")
      .where({ id })
      .select("id", "username", "full_name", "profile_picture", "bio", "is_online", "last_seen", "created_at")
      .first()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 10, offset = 0 } = req.query

    let usersQuery = db("users")
      .select("id", "username", "full_name", "profile_picture", "is_online", "last_seen")
      .whereNot({ id: req.user.id })
      .limit(limit)
      .offset(offset)

    if (query) {
      usersQuery = usersQuery.where(function () {
        this.where("username", "ilike", `%${query}%`)
          .orWhere("full_name", "ilike", `%${query}%`)
          .orWhere("email", "ilike", `%${query}%`)
      })
    }

    const users = await usersQuery

    res.status(200).json({ users })
  } catch (error) {
    next(error)
  }
}
