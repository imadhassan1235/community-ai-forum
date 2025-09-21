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

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
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
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
commentSchema.index({ postId: 1, createdAt: -1 })
commentSchema.index({ userId: 1 })
commentSchema.index({ "votes.userId": 1 })

// Virtual for vote count
commentSchema.virtual("voteCount").get(function () {
  return this.votes.reduce((sum, vote) => sum + vote.value, 0)
})

// Ensure virtuals are included in JSON output
commentSchema.set("toJSON", { virtuals: true })

module.exports = mongoose.model("Comment", commentSchema)
