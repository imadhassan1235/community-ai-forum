const express = require("express")
const { body } = require("express-validator")
const User = require("../models/User")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const auth = require("../middleware/auth")
const { handleValidationErrors } = require("../middleware/validation")

const router = express.Router()

// Validation for profile update
const validateProfileUpdate = [
  body("bio").optional().isLength({ max: 500 }).withMessage("Bio must be 500 characters or less").trim(),
  body("avatarUrl").optional().isURL().withMessage("Avatar URL must be a valid URL"),
  handleValidationErrors,
]

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      })
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, validateProfileUpdate, async (req, res) => {
  try {
    const { bio, avatarUrl } = req.body
    const updateData = {}

    if (bio !== undefined) updateData.bio = bio
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   GET /api/users/:id/posts
// @desc    Get user's posts
// @access  Public
router.get("/:id/posts", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ userId: req.params.id })
      .populate("userId", "username avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Post.countDocuments({ userId: req.params.id })

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
    console.error("Get user posts error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   GET /api/users/:id/comments
// @desc    Get user's comments
// @access  Public
router.get("/:id/comments", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const comments = await Comment.find({ userId: req.params.id })
      .populate("userId", "username avatarUrl")
      .populate("postId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Comment.countDocuments({ userId: req.params.id })

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
    console.error("Get user comments error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router
