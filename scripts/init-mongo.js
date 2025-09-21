// MongoDB initialization script
const db = db.getSiblingDB("community-ai-forum")

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "passwordHash"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30,
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
        },
        passwordHash: {
          bsonType: "string",
          minLength: 6,
        },
        score: {
          bsonType: "number",
          minimum: 0,
        },
      },
    },
  },
})

db.createCollection("posts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "content", "userId"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200,
        },
        content: {
          bsonType: "string",
          minLength: 1,
          maxLength: 10000,
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string",
            maxLength: 30,
          },
        },
      },
    },
  },
})

db.createCollection("comments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["content", "postId", "userId"],
      properties: {
        content: {
          bsonType: "string",
          minLength: 1,
          maxLength: 2000,
        },
      },
    },
  },
})

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ score: -1 })

db.posts.createIndex({ userId: 1 })
db.posts.createIndex({ tags: 1 })
db.posts.createIndex({ createdAt: -1 })
db.posts.createIndex({ "votes.userId": 1 })

db.comments.createIndex({ postId: 1, createdAt: -1 })
db.comments.createIndex({ userId: 1 })
db.comments.createIndex({ "votes.userId": 1 })

print("Database initialized successfully!")
