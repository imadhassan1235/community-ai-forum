const request = require("supertest")
const mongoose = require("mongoose")
const app = require("../server")
const User = require("../models/User")

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/community-ai-forum-test"

describe("Authentication", () => {
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI)
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.username).toBe(userData.username)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.passwordHash).toBeUndefined()
    })

    it("should not register user with existing email", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      }

      // Create first user
      await request(app).post("/api/auth/register").send(userData)

      // Try to create second user with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...userData,
          username: "testuser2",
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain("Email already registered")
    })
  })

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        passwordHash: "password123",
      })
      await user.save()
    })

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.email).toBe("test@example.com")
    })

    it("should not login with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("Invalid credentials")
    })
  })
})
