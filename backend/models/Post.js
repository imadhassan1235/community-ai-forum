const mongoose = require("mongoose")

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    value: {
      type: Number,
      enum: [-1, 1],
      required: true,
    },
  },
  { _id: false },
)

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 30,
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    votes: [voteSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
postSchema.index({ userId: 1 })
postSchema.index({ tags: 1 })
postSchema.index({ createdAt: -1 })
postSchema.index({ "votes.userId": 1 })

// Virtual for vote count
postSchema.virtual("voteCount").get(function () {
  return this.votes.reduce((sum, vote) => sum + vote.value, 0)
})

// Virtual for upvote count
postSchema.virtual("upvoteCount").get(function () {
  return this.votes.filter((vote) => vote.value === 1).length
})

// Virtual for downvote count
postSchema.virtual("downvoteCount").get(function () {
  return this.votes.filter((vote) => vote.value === -1).length
})

// Ensure virtuals are included in JSON output
postSchema.set("toJSON", { virtuals: true })

module.exports = mongoose.model("Post", postSchema)
