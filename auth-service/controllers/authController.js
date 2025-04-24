/**
 * Authentication controller
 */
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("../db")
const { v4: uuidv4 } = require("uuid")

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body

    // Check if user already exists
    const existingUser = await db("users").where({ email }).orWhere({ username }).first()

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already in use" })
      }
      return res.status(400).json({ message: "Username already taken" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const [user] = await db("users")
      .insert({
        username,
        email,
        password_hash: hashedPassword,
        full_name: full_name || null,
      })
      .returning(["id", "username", "email", "full_name", "created_at"])

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "24h",
    })

    // Create refresh token
    const refreshToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    await db("sessions").insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
      device_info: req.headers["user-agent"] || null,
      ip_address: req.ip || null,
    })

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
      },
      token,
      refreshToken,
    })
  } catch (error) {
    next(error)
  }
}

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await db("users").where({ email }).first()

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Update last seen and online status
    await db("users").where({ id: user.id }).update({
      last_seen: new Date(),
      is_online: true,
    })

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "24h",
    })

    // Create refresh token
    const refreshToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    await db("sessions").insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
      device_info: req.headers["user-agent"] || null,
      ip_address: req.ip || null,
    })

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
      },
      token,
      refreshToken,
    })
  } catch (error) {
    next(error)
  }
}

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" })
    }

    // Find session by refresh token
    const session = await db("sessions").where({ token: refreshToken }).where("expires_at", ">", new Date()).first()

    if (!session) {
      return res.status(401).json({ message: "Invalid or expired refresh token" })
    }

    // Get user
    const user = await db("users").where({ id: session.user_id }).first()

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    // Generate new JWT token
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "24h",
    })

    // Update session last active time
    await db("sessions").where({ id: session.id }).update({ last_active_at: new Date() })

    res.status(200).json({
      message: "Token refreshed successfully",
      token,
    })
  } catch (error) {
    next(error)
  }
}

// Logout user
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" })
    }

    // Delete session
    await db("sessions").where({ token: refreshToken }).del()

    // If authorization header is present, extract user ID from JWT
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Update user's online status
        await db("users").where({ id: decoded.id }).update({
          is_online: false,
          last_seen: new Date(),
        })
      } catch (error) {
        // Token verification failed, but we still want to proceed with logout
        console.error("Token verification failed during logout:", error.message)
      }
    }

    res.status(200).json({ message: "Logout successful" })
  } catch (error) {
    next(error)
  }
}
