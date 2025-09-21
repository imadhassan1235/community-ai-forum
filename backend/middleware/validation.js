const { body, validationResult } = require("express-validator")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: errors.array(),
    })
  }
  next()
}

const validateRegister = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
]

const validateLogin = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

const validatePost = [
  body("title").isLength({ min: 1, max: 200 }).withMessage("Title must be between 1 and 200 characters").trim(),
  body("content").isLength({ min: 1, max: 10000 }).withMessage("Content must be between 1 and 10000 characters").trim(),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isLength({ max: 30 }).withMessage("Each tag must be 30 characters or less").trim(),
  handleValidationErrors,
]

const validateComment = [
  body("content").isLength({ min: 1, max: 2000 }).withMessage("Comment must be between 1 and 2000 characters").trim(),
  handleValidationErrors,
]

module.exports = {
  validateRegister,
  validateLogin,
  validatePost,
  validateComment,
  handleValidationErrors,
}
