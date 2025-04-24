/**
 * Database connection
 */
const knex = require("knex")
const config = require("../knexfile")

// Determine environment
const environment = process.env.NODE_ENV || "development"

// Initialize knex with the appropriate configuration
const db = knex(config[environment])

module.exports = db
