const bcrypt = require("bcryptjs")

/**
 * Seed file for creating test users
 */
exports.seed = async (knex) => {
  // Delete existing entries
  await knex("users").del()

  // Create hashed passwords
  const password = await bcrypt.hash("password123", 10)

  // Insert seed data
  await knex("users").insert([
    {
      username: "john_doe",
      email: "john@example.com",
      password_hash: password,
      full_name: "John Doe",
      profile_picture: "/avatars/john.jpg",
      bio: "Software developer with a passion for building great applications.",
      is_online: false,
      last_seen: new Date(),
    },
    {
      username: "jane_smith",
      email: "jane@example.com",
      password_hash: password,
      full_name: "Jane Smith",
      profile_picture: "/avatars/jane.jpg",
      bio: "UX designer who loves creating beautiful interfaces.",
      is_online: true,
      last_seen: new Date(),
    },
  ])
}
