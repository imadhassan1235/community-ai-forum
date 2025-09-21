const express = require("express")
const User = require("../models/User")

const router = express.Router()

// @route   GET /api/leaderboard
// @desc    Get top users by score
// @access  Public
router.get("/", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 10
    const page = Number.parseInt(req.query.page) || 1
    const skip = (page - 1) * limit

    const users = await User.find()
      .select("username avatarUrl score createdAt")
      .sort({ score: -1, createdAt: 1 }) // Sort by score desc, then by join date asc for ties
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments()

    // Add rank to each user
    const usersWithRank = users.map((user, index) => ({
      ...user.toJSON(),
      rank: skip + index + 1,
    }))

    res.json({
      success: true,
      data: {
        users: usersWithRank,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Get leaderboard error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   GET /api/leaderboard/stats
// @desc    Get leaderboard statistics
// @access  Public
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const topUser = await User.findOne().sort({ score: -1 }).select("username score")
    const averageScore = await User.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
        },
      },
    ])

    res.json({
      success: true,
      data: {
        totalUsers,
        topUser,
        averageScore: averageScore[0]?.avgScore || 0,
      },
    })
  } catch (error) {
    console.error("Get leaderboard stats error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router
