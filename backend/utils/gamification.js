const User = require("../models/User")

// Gamification point values (configurable via environment)
const POINTS = {
  POST_UPVOTE: Number.parseInt(process.env.POINTS_POST_UPVOTE) || 10,
  COMMENT_UPVOTE: Number.parseInt(process.env.POINTS_COMMENT_UPVOTE) || 5,
  GIVING_UPVOTE: Number.parseInt(process.env.POINTS_GIVING_UPVOTE) || 2,
  RECEIVING_DOWNVOTE: Number.parseInt(process.env.POINTS_RECEIVING_DOWNVOTE) || -2,
}

const updateUserScore = async (userId, points) => {
  try {
    await User.findByIdAndUpdate(userId, { $inc: { score: points } }, { new: true })
  } catch (error) {
    console.error("Error updating user score:", error)
  }
}

const handleVoteScoring = async (contentType, voteValue, contentOwnerId, voterId) => {
  try {
    // Points for the person receiving the vote
    if (voteValue === 1) {
      // Upvote received
      const points = contentType === "post" ? POINTS.POST_UPVOTE : POINTS.COMMENT_UPVOTE
      await updateUserScore(contentOwnerId, points)
    } else if (voteValue === -1) {
      // Downvote received
      await updateUserScore(contentOwnerId, POINTS.RECEIVING_DOWNVOTE)
    }

    // Points for the person giving the upvote (encourage engagement)
    if (voteValue === 1) {
      await updateUserScore(voterId, POINTS.GIVING_UPVOTE)
    }
  } catch (error) {
    console.error("Error handling vote scoring:", error)
  }
}

const handleVoteRemoval = async (contentType, voteValue, contentOwnerId, voterId) => {
  try {
    // Reverse the points when vote is removed
    if (voteValue === 1) {
      const points = contentType === "post" ? POINTS.POST_UPVOTE : POINTS.COMMENT_UPVOTE
      await updateUserScore(contentOwnerId, -points)
      await updateUserScore(voterId, -POINTS.GIVING_UPVOTE)
    } else if (voteValue === -1) {
      await updateUserScore(contentOwnerId, -POINTS.RECEIVING_DOWNVOTE)
    }
  } catch (error) {
    console.error("Error handling vote removal:", error)
  }
}

module.exports = {
  POINTS,
  updateUserScore,
  handleVoteScoring,
  handleVoteRemoval,
}
