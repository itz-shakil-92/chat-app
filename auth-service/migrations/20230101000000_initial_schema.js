/**
 * Initial database schema migration
 */
exports.up = async (knex) => {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

  // Users Table
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.string("username", 50).notNullable().unique()
    table.string("email", 255).notNullable().unique()
    table.string("password_hash", 255).notNullable()
    table.string("full_name", 100)
    table.string("profile_picture", 255)
    table.text("bio")
    table.boolean("is_online").defaultTo(false)
    table.timestamp("last_seen").defaultTo(knex.fn.now())
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("updated_at").defaultTo(knex.fn.now())
  })

  // Sessions Table
  await knex.schema.createTable("sessions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"))
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE")
    table.string("token", 255).notNullable().unique()
    table.text("device_info")
    table.string("ip_address", 45)
    table.timestamp("expires_at").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.timestamp("last_active_at").defaultTo(knex.fn.now())
  })

  // Create indexes
  await knex.raw("CREATE INDEX idx_users_email ON users(email)")
  await knex.raw("CREATE INDEX idx_users_username ON users(username)")
  await knex.raw("CREATE INDEX idx_sessions_user_id ON sessions(user_id)")
  await knex.raw("CREATE INDEX idx_sessions_token ON sessions(token)")
}

exports.down = async (knex) => {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists("sessions")
  await knex.schema.dropTableIfExists("users")
}
