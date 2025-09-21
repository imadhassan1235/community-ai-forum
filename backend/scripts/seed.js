"use client"

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Post = require("../models/Post")
const Comment = require("../models/Comment")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/community-ai-forum"

const sampleUsers = [
  {
    username: "alice_dev",
    email: "alice@example.com",
    password: "password123",
    bio: "Full-stack developer passionate about React and Node.js",
    score: 150,
  },
  {
    username: "bob_designer",
    email: "bob@example.com",
    password: "password123",
    bio: "UI/UX designer with a love for clean, accessible interfaces",
    score: 120,
  },
  {
    username: "charlie_ai",
    email: "charlie@example.com",
    password: "password123",
    bio: "AI researcher exploring the intersection of machine learning and web development",
    score: 200,
  },
  {
    username: "diana_mobile",
    email: "diana@example.com",
    password: "password123",
    bio: "Mobile app developer specializing in React Native and Flutter",
    score: 90,
  },
  {
    username: "eve_backend",
    email: "eve@example.com",
    password: "password123",
    bio: "Backend engineer with expertise in microservices and cloud architecture",
    score: 180,
  },
]

const samplePosts = [
  {
    title: "Getting Started with React Hooks",
    content: `React Hooks have revolutionized how we write React components. Here's a comprehensive guide to get you started:

## useState Hook
The useState hook allows you to add state to functional components:

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

## useEffect Hook
The useEffect hook lets you perform side effects in functional components:

\`\`\`javascript
useEffect(() => {
  document.title = \`Count: \${count}\`;
}, [count]);
\`\`\`

## Best Practices
1. Always use the dependency array in useEffect
2. Keep hooks at the top level of your component
3. Use custom hooks to share stateful logic

What are your favorite React hooks and why?`,
    tags: ["react", "javascript", "hooks", "frontend"],
    votes: [
      { value: 1 }, // Will be populated with actual user IDs
      { value: 1 },
      { value: 1 },
      { value: -1 },
    ],
  },
  {
    title: "Building Scalable APIs with Node.js and Express",
    content: `When building APIs that need to scale, there are several key principles to follow:

## 1. Proper Error Handling
Always use middleware for consistent error handling:

\`\`\`javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
\`\`\`

## 2. Input Validation
Use libraries like express-validator to validate incoming data:

\`\`\`javascript
const { body, validationResult } = require('express-validator');

app.post('/users', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid data
});
\`\`\`

## 3. Rate Limiting
Implement rate limiting to prevent abuse:

\`\`\`javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
\`\`\`

What other patterns do you use for scalable APIs?`,
    tags: ["nodejs", "express", "api", "backend", "scalability"],
    votes: [{ value: 1 }, { value: 1 }, { value: 1 }],
  },
  {
    title: "The Future of AI in Web Development",
    content: `Artificial Intelligence is rapidly transforming how we build web applications. Here are some key areas where AI is making an impact:

## Code Generation
AI tools like GitHub Copilot and ChatGPT are helping developers write code faster and with fewer bugs. These tools can:
- Generate boilerplate code
- Suggest optimizations
- Help with debugging
- Write documentation

## Automated Testing
AI can help create comprehensive test suites by:
- Analyzing code to identify edge cases
- Generating test data
- Creating visual regression tests
- Predicting which tests are most likely to fail

## User Experience Enhancement
AI enables more personalized and intelligent user experiences:
- Personalized content recommendations
- Intelligent search and filtering
- Automated accessibility improvements
- Dynamic UI optimization

## Performance Optimization
Machine learning can optimize web performance by:
- Predicting user behavior for preloading
- Optimizing bundle sizes
- Intelligent caching strategies
- Real-time performance monitoring

What AI tools are you currently using in your development workflow? How do you see AI changing web development in the next 5 years?`,
    tags: ["ai", "machine-learning", "web-development", "future", "automation"],
    votes: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }],
  },
  {
    title: "CSS Grid vs Flexbox: When to Use Which?",
    content: `Both CSS Grid and Flexbox are powerful layout systems, but they serve different purposes. Here's when to use each:

## Use Flexbox When:
- Creating one-dimensional layouts (row or column)
- Aligning items within a container
- Distributing space between items
- Building navigation bars, button groups, or form controls

\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\`

## Use CSS Grid When:
- Creating two-dimensional layouts (rows and columns)
- Building complex page layouts
- Creating responsive designs without media queries
- Overlapping elements

\`\`\`css
.layout {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 200px 1fr;
}
\`\`\`

## Can They Work Together?
Grid for the overall page layout, Flexbox for component-level layouts:

\`\`\`css
.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
\`\`\`

What's your preferred approach for modern CSS layouts?`,
    tags: ["css", "grid", "flexbox", "layout", "responsive"],
    votes: [{ value: 1 }, { value: 1 }],
  },
  {
    title: "Database Design Best Practices for Web Applications",
    content: `Good database design is crucial for application performance and maintainability. Here are key principles to follow:

## 1. Normalization (But Don't Over-Normalize)
- Eliminate data redundancy
- Ensure data integrity
- But consider denormalization for read-heavy applications

## 2. Proper Indexing Strategy
\`\`\`sql
-- Index frequently queried columns
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_post_created_at ON posts(created_at);

-- Composite indexes for multi-column queries
CREATE INDEX idx_post_user_date ON posts(user_id, created_at);
\`\`\`

## 3. Use Appropriate Data Types
- Choose the smallest data type that can hold your data
- Use ENUM for fixed sets of values
- Consider using UUIDs for distributed systems

## 4. Plan for Scalability
- Partition large tables
- Consider read replicas for read-heavy workloads
- Use connection pooling

## 5. Implement Proper Constraints
\`\`\`sql
ALTER TABLE users 
ADD CONSTRAINT chk_email_format 
CHECK (email LIKE '%@%.%');
\`\`\`

What database design patterns have worked well for your projects?`,
    tags: ["database", "sql", "design", "performance", "scalability"],
    votes: [{ value: 1 }, { value: 1 }, { value: 1 }],
  },
]

const sampleComments = [
  {
    content:
      "Great explanation! I've been using useState but wasn't sure about the dependency array in useEffect. This cleared it up for me.",
    votes: [{ value: 1 }, { value: 1 }],
  },
  {
    content:
      "One thing to add: custom hooks are incredibly powerful for sharing logic between components. I've created hooks for API calls, local storage, and form validation.",
    votes: [{ value: 1 }],
  },
  {
    content:
      "Thanks for the rate limiting example! I've been looking for a simple way to implement this in my Express apps.",
    votes: [{ value: 1 }, { value: 1 }, { value: 1 }],
  },
  {
    content: "Don't forget about middleware for authentication and logging. These are essential for production APIs.",
    votes: [{ value: 1 }],
  },
  {
    content:
      "AI code generation is impressive, but I worry about developers becoming too dependent on it. We still need to understand the fundamentals.",
    votes: [{ value: 1 }, { value: -1 }],
  },
  {
    content:
      "I use GitHub Copilot daily and it's been a game-changer for productivity. The key is knowing when to accept or reject its suggestions.",
    votes: [{ value: 1 }, { value: 1 }],
  },
  {
    content: "I prefer Grid for page layouts and Flexbox for components. They complement each other perfectly!",
    votes: [{ value: 1 }],
  },
  {
    content: "The indexing section is gold! I've seen so many slow queries that could be fixed with proper indexes.",
    votes: [{ value: 1 }, { value: 1 }],
  },
]

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)

    console.log("Clearing existing data...")
    await User.deleteMany({})
    await Post.deleteMany({})
    await Comment.deleteMany({})

    console.log("Creating users...")
    const users = []
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      const user = new User({
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        bio: userData.bio,
        score: userData.score,
      })
      await user.save()
      users.push(user)
    }

    console.log("Creating posts...")
    const posts = []
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i]
      const randomUser = users[Math.floor(Math.random() * users.length)]

      // Assign random user IDs to votes
      const votes = postData.votes.map(() => ({
        userId: users[Math.floor(Math.random() * users.length)]._id,
        value: Math.random() > 0.8 ? -1 : 1, // 20% chance of downvote
      }))

      const post = new Post({
        title: postData.title,
        content: postData.content,
        tags: postData.tags,
        userId: randomUser._id,
        votes,
      })
      await post.save()
      posts.push(post)
    }

    console.log("Creating comments...")
    for (let i = 0; i < sampleComments.length; i++) {
      const commentData = sampleComments[i]
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomPost = posts[Math.floor(Math.random() * posts.length)]

      // Assign random user IDs to votes
      const votes = commentData.votes.map(() => ({
        userId: users[Math.floor(Math.random() * users.length)]._id,
        value: Math.random() > 0.9 ? -1 : 1, // 10% chance of downvote
      }))

      const comment = new Comment({
        content: commentData.content,
        postId: randomPost._id,
        userId: randomUser._id,
        votes,
      })
      await comment.save()
    }

    console.log("Database seeded successfully!")
    console.log(`Created ${users.length} users`)
    console.log(`Created ${posts.length} posts`)
    console.log(`Created ${sampleComments.length} comments`)

    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
