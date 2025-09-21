const express = require("express")
const Comment = require("../models/Comment")
const Post = require("../models/Post")
const auth = require("../middleware/auth")
const { validateComment } = require("../middleware/validation")
const { handleVoteScoring, handleVoteRemoval } = require("../utils/gamification")

const router = express.Router()

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a post
// @access  Public
router.get("/post/:postId", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    const { sortBy = "createdAt", sortOrder = "asc" } = req.query

    // Build sort object
    const sort = {}
    if (sortBy === "votes") {
      // Use aggregation for vote sorting
      const comments = await Comment.aggregate([
        { $match: { postId: require("mongoose").Types.ObjectId(req.params.postId) } },
        {
          $addFields: {
            voteCount: {
              $sum: "$votes.value",
            },
          },
        },
        { $sort: { voteCount: sortOrder === "desc" ? -1 : 1, createdAt: 1 } },
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

      const total = await Comment.countDocuments({ postId: req.params.postId })

      return res.json({
        success: true,
        data: {
          comments,
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

    const comments = await Comment.find({ postId: req.params.postId })
      .populate("userId", "username avatarUrl score")
      .sort(sort)
      .skip(skip)
      .limit(limit)

    const total = await Comment.countDocuments({ postId: req.params.postId })

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get comments error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   POST /api/comments
// @desc    Create new comment
// @access  Private
router.post("/", auth, validateComment, async (req, res) => {
  try {
    const { postId, content } = req.body

    // Verify post exists
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      })
    }

    const comment = new Comment({
      postId,
      content,
      userId: req.user._id,
    })

    await comment.save()
    await comment.populate("userId", "username avatarUrl score")

    res.status(201).json({
      success: true,
      data: comment,
      message: "Comment created successfully",
    })
  } catch (error) {
    console.error("Create comment error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private
router.put("/:id", auth, validateComment, async (req, res) => {
  try {
    const { content } = req.body

    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found",
      })
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this comment",
      })
    }

    comment.content = content
    comment.updatedAt = new Date()

    await comment.save()
    await comment.populate("userId", "username avatarUrl score")

    res.json({
      success: true,
      data: comment,
      message: "Comment updated successfully",
    })
  } catch (error) {
    console.error("Update comment error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found",
      })
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this comment",
      })
    }

    await Comment.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    console.error("Delete comment error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   POST /api/comments/:id/vote
// @desc    Vote on a comment
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

    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found",
      })
    }

    // Check if user already voted
    const existingVoteIndex = comment.votes.findIndex((vote) => vote.userId.toString() === req.user._id.toString())

    if (existingVoteIndex !== -1) {
      const existingVote = comment.votes[existingVoteIndex]

      if (existingVote.value === value) {
        // Remove vote if same value
        await handleVoteRemoval("comment", existingVote.value, comment.userId, req.user._id)
        comment.votes.splice(existingVoteIndex, 1)
      } else {
        // Update vote if different value
        await handleVoteRemoval("comment", existingVote.value, comment.userId, req.user._id)
        await handleVoteScoring("comment", value, comment.userId, req.user._id)
        comment.votes[existingVoteIndex].value = value
      }
    } else {
      // Add new vote
      await handleVoteScoring("comment", value, comment.userId, req.user._id)
      comment.votes.push({
        userId: req.user._id,
        value,
      })
    }

    await comment.save()
    await comment.populate("userId", "username avatarUrl score")

    res.json({
      success: true,
      data: comment,
      message: "Vote recorded successfully",
    })
  } catch (error) {
    console.error("Vote comment error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router
