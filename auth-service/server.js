/**
 * Authentication Service
 */
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const { createServer } = require("http")
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const errorHandler = require("./middleware/errorHandler")
const authenticateJWT = require("./middleware/authenticateJWT")

// Initialize Express app
const app = express()
const httpServer = createServer(app)

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
)
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Public routes
app.use("/api/auth", authRoutes)

// Protected routes
app.use("/api/users", authenticateJWT, userRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" })
})

// Error handling middleware
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`Authentication service running on port ${PORT}`)
})

module.exports = { app, httpServer }
