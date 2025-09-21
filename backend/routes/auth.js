const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { validateRegister, validateLogin } = require("../middleware/validation")
const auth = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email ? "Email already registered" : "Username already taken",
      })
    }

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      data: {
        token,
        user,
      },
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      data: {
        token,
        user,
      },
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      error: "Server error during login",
    })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Private
router.post("/verify-token", auth, (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  })
})

module.exports = router
