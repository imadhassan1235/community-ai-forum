const express = require("express")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const auth = require("../middleware/auth")
const { validatePost } = require("../middleware/validation")
const { handleVoteScoring, handleVoteRemoval } = require("../utils/gamification")

const router = express.Router()

// @route   GET /api/posts
// @desc    Get all posts with pagination and filtering
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const { tag, author, search, sortBy = "createdAt", sortOrder = "desc" } = req.query

    // Build filter object
    const filter = {}
    if (tag) filter.tags = { $in: [tag.toLowerCase()] }
    if (author) {
      // Find user by username and get their ID
      const User = require("../models/User")
      const user = await User.findOne({ username: author })
      if (user) filter.userId = user._id
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }

    // Build sort object
    const sort = {}
    if (sortBy === "votes") {
      // For vote sorting, we'll use aggregation
      const posts = await Post.aggregate([
        { $match: filter },
        {
          $addFields: {
            voteCount: {
              $sum: "$votes.value",
            },
          },
        },
        { $sort: { voteCount: sortOrder === "desc" ? -1 : 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        { $unwind: "$userId" },
        {
          $project: {
            "userId.passwordHash": 0,
            "userId.__v": 0,
          },
        },
      ])

      const total = await Post.countDocuments(filter)

      return res.json({
        success: true,
        data: {
          posts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      })
    } else {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1
    }

    const posts = await Post.find(filter)
      .populate("userId", "username avatarUrl score")
      .sort(sort)
      .skip(skip)
      .limit(limit)

    const total = await Post.countDocuments(filter)

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get posts error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("userId", "username avatarUrl score")

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      })
    }

    res.json({
      success: true,
      data: post,
    })
  } catch (error) {
    console.error("Get post error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post("/", auth, validatePost, async (req, res) => {
  try {
    const { title, content, tags } = req.body

    const post = new Post({
      title,
      content,
      tags: tags ? tags.map((tag) => tag.toLowerCase()) : [],
      userId: req.user._id,
    })

    await post.save()
    await post.populate("userId", "username avatarUrl score")

    res.status(201).json({
      success: true,
      data: post,
      message: "Post created successfully",
    })
  } catch (error) {
    console.error("Create post error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put("/:id", auth, validatePost, async (req, res) => {
  try {
    const { title, content, tags } = req.body

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      })
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this post",
      })
    }

    post.title = title
    post.content = content
    post.tags = tags ? tags.map((tag) => tag.toLowerCase()) : []
    post.updatedAt = new Date()

    await post.save()
    await post.populate("userId", "username avatarUrl score")

    res.json({
      success: true,
      data: post,
      message: "Post updated successfully",
    })
  } catch (error) {
    console.error("Update post error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      })
    }

    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this post",
      })
    }

    // Delete associated comments
    await Comment.deleteMany({ postId: req.params.id })

    // Delete the post
    await Post.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Post and associated comments deleted successfully",
    })
  } catch (error) {
    console.error("Delete post error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   POST /api/posts/:id/vote
// @desc    Vote on a post
// @access  Private
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { value } = req.body // 1 for upvote, -1 for downvote

    if (![1, -1].includes(value)) {
      return res.status(400).json({
        success: false,
        error: "Vote value must be 1 (upvote) or -1 (downvote)",
      })
    }

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      })
    }

    // Check if user already voted
    const existingVoteIndex = post.votes.findIndex((vote) => vote.userId.toString() === req.user._id.toString())

    if (existingVoteIndex !== -1) {
      const existingVote = post.votes[existingVoteIndex]

      if (existingVote.value === value) {
        // Remove vote if same value
        await handleVoteRemoval("post", existingVote.value, post.userId, req.user._id)
        post.votes.splice(existingVoteIndex, 1)
      } else {
        // Update vote if different value
        await handleVoteRemoval("post", existingVote.value, post.userId, req.user._id)
        await handleVoteScoring("post", value, post.userId, req.user._id)
        post.votes[existingVoteIndex].value = value
      }
    } else {
      // Add new vote
      await handleVoteScoring("post", value, post.userId, req.user._id)
      post.votes.push({
        userId: req.user._id,
        value,
      })
    }

    await post.save()
    await post.populate("userId", "username avatarUrl score")

    res.json({
      success: true,
      data: post,
      message: "Vote recorded successfully",
    })
  } catch (error) {
    console.error("Vote post error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   GET /api/posts/tags/popular
// @desc    Get popular tags
// @access  Public
router.get("/tags/popular", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 20

    const tags = await Post.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ])

    res.json({
      success: true,
      data: tags,
    })
  } catch (error) {
    console.error("Get popular tags error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router
