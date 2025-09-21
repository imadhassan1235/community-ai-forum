const request = require("supertest")
const mongoose = require("mongoose")
const app = require("../server")
const User = require("../models/User")
const Post = require("../models/Post")

const MONGODB_URI = process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/community-ai-forum-test"

describe("Posts API", () => {
  let authToken
  let userId
  let postId

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI)
  })

  beforeEach(async () => {
    await User.deleteMany({})
    await Post.deleteMany({})

    // Create test user and get auth token
    const userResponse = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    })

    authToken = userResponse.body.data.token
    userId = userResponse.body.data.user._id
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  describe("POST /api/posts", () => {
    it("should create a new post", async () => {
      const postData = {
        title: "Test Post",
        content: "This is a test post content",
        tags: ["test", "javascript"],
      }

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(postData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(postData.title)
      expect(response.body.data.content).toBe(postData.content)
      expect(response.body.data.tags).toEqual(postData.tags)
      expect(response.body.data.userId._id).toBe(userId)

      postId = response.body.data._id
    })

    it("should not create post without authentication", async () => {
      const postData = {
        title: "Test Post",
        content: "This is a test post content",
      }

      const response = await request(app).post("/api/posts").send(postData).expect(401)

      expect(response.body.success).toBe(false)
    })

    it("should not create post with invalid data", async () => {
      const postData = {
        title: "", // Empty title
        content: "This is a test post content",
      }

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(postData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe("GET /api/posts", () => {
    beforeEach(async () => {
      // Create test posts
      const post1 = new Post({
        title: "First Post",
        content: "Content of first post",
        tags: ["javascript", "react"],
        userId,
      })
      await post1.save()

      const post2 = new Post({
        title: "Second Post",
        content: "Content of second post",
        tags: ["nodejs", "express"],
        userId,
      })
      await post2.save()
    })

    it("should get all posts", async () => {
      const response = await request(app).get("/api/posts").expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.posts).toHaveLength(2)
      expect(response.body.data.pagination).toBeDefined()
    })

    it("should filter posts by tag", async () => {
      const response = await request(app).get("/api/posts?tag=javascript").expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.posts).toHaveLength(1)
      expect(response.body.data.posts[0].title).toBe("First Post")
    })

    it("should search posts by content", async () => {
      const response = await request(app).get("/api/posts?search=first").expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.posts).toHaveLength(1)
      expect(response.body.data.posts[0].title).toBe("First Post")
    })
  })

  describe("POST /api/posts/:id/vote", () => {
    beforeEach(async () => {
      const post = new Post({
        title: "Test Post",
        content: "Test content",
        userId,
      })
      await post.save()
      postId = post._id
    })

    it("should upvote a post", async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/vote`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ value: 1 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.voteCount).toBe(1)
      expect(response.body.data.votes).toHaveLength(1)
      expect(response.body.data.votes[0].value).toBe(1)
    })

    it("should downvote a post", async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/vote`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ value: -1 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.voteCount).toBe(-1)
    })

    it("should not vote without authentication", async () => {
      const response = await request(app).post(`/api/posts/${postId}/vote`).send({ value: 1 }).expect(401)

      expect(response.body.success).toBe(false)
    })

    it("should not vote with invalid value", async () => {
      const response = await request(app)
        .post(`/api/posts/${postId}/vote`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ value: 2 })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })
})
