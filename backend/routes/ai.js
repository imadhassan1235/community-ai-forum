const express = require("express")
const axios = require("axios")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const auth = require("../middleware/auth")

const router = express.Router()

// Check if AI is enabled
const isAIEnabled = process.env.AI_ENABLED === "true"
const openaiApiKey = process.env.OPENAI_API_KEY
const geminiApiKey = process.env.GEMINI_API_KEY

// @route   POST /api/ai/summarize
// @desc    Summarize a post and its top comments
// @access  Private
router.post("/summarize", auth, async (req, res) => {
  try {
    if (!isAIEnabled) {
      return res.status(503).json({
        success: false,
        error: "AI features are currently disabled",
      })
    }

    const { postId } = req.body

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: "Post ID is required",
      })
    }

    // Get post and top comments
    const post = await Post.findById(postId).populate("userId", "username")
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Post not found",
      })
    }

    const topComments = await Comment.find({ postId }).populate("userId", "username").sort({ createdAt: 1 }).limit(10)

    // Prepare content for AI
    let content = `Post Title: ${post.title}\n\nPost Content: ${post.content}\n\n`

    if (topComments.length > 0) {
      content += "Top Comments:\n"
      topComments.forEach((comment, index) => {
        content += `${index + 1}. ${comment.userId.username}: ${comment.content}\n`
      })
    }

    let summary = ""

    // Try OpenAI first, then Gemini
    if (openaiApiKey) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant that summarizes forum discussions. Provide key takeaways in a concise, bullet-point format.",
              },
              {
                role: "user",
                content: `Please summarize this forum post and its comments, highlighting the key takeaways:\n\n${content}`,
              },
            ],
            max_tokens: 300,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
          },
        )

        summary = response.data.choices[0].message.content
      } catch (error) {
        console.error("OpenAI API error:", error.response?.data || error.message)
        throw error
      }
    } else if (geminiApiKey) {
      // Implement Gemini API call here if needed
      return res.status(501).json({
        success: false,
        error: "Gemini integration not implemented yet",
      })
    } else {
      return res.status(503).json({
        success: false,
        error: "No AI API key configured",
      })
    }

    res.json({
      success: true,
      data: {
        summary,
        postTitle: post.title,
        commentCount: topComments.length,
      },
      message: "Summary generated successfully",
    })
  } catch (error) {
    console.error("AI summarize error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate summary",
    })
  }
})

// @route   POST /api/ai/draft
// @desc    Generate a post draft from a prompt
// @access  Private
router.post("/draft", auth, async (req, res) => {
  try {
    if (!isAIEnabled) {
      return res.status(503).json({
        success: false,
        error: "AI features are currently disabled",
      })
    }

    const { prompt } = req.body

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      })
    }

    let title = ""
    let content = ""

    // Try OpenAI first
    if (openaiApiKey) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant that creates forum posts. Generate a title and content for a forum post based on the user's prompt. Format your response as JSON with 'title' and 'content' fields.",
              },
              {
                role: "user",
                content: `Create a forum post about: ${prompt}`,
              },
            ],
            max_tokens: 500,
            temperature: 0.8,
          },
          {
            headers: {
              Authorization: `Bearer ${openaiApiKey}`,
              "Content-Type": "application/json",
            },
          },
        )

        const aiResponse = response.data.choices[0].message.content
        try {
          const parsed = JSON.parse(aiResponse)
          title = parsed.title || "Generated Post"
          content = parsed.content || aiResponse
        } catch {
          // If not valid JSON, use the response as content
          title = "Generated Post"
          content = aiResponse
        }
      } catch (error) {
        console.error("OpenAI API error:", error.response?.data || error.message)
        throw error
      }
    } else {
      return res.status(503).json({
        success: false,
        error: "No AI API key configured",
      })
    }

    res.json({
      success: true,
      data: {
        title,
        content,
        prompt,
      },
      message: "Draft generated successfully",
    })
  } catch (error) {
    console.error("AI draft error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate draft",
    })
  }
})

module.exports = router
